---
name: jira-tarefas-calculadora
description: >-
  Redige e revisa cartões de tarefas no Jira com padrões convencionais para
  calculadoradeprazos.com: resumo, descrição, critérios de aceite, tipo de issue,
  rótulos e ligação com chaves CALC- e GitHub. Use ao criar ou melhorar issues,
  quebrar épicos em tarefas ou quando o usuário pedir o agente Jira / cartões.
disable-model-invocation: true
---

# Agente: cartões Jira (calculadoradeprazos.com)

## API e projeto CALC

- Este skill **não chama o Jira sozinho**; produz texto para colar manualmente ou via automação que você configurar.
- Para **listar projetos** (e confirmar o **CALC**) na sua conta Jira Cloud, use credenciais fora do repositório:
  - Crie um **API token** em [Security da conta Atlassian](https://id.atlassian.com/manage-profile/security/api-tokens).
  - Defina `JIRA_BASE_URL` (ex.: `https://suaempresa.atlassian.net`), `JIRA_EMAIL` e `JIRA_API_TOKEN` e rode `scripts/jira-list-projects.ps1` ou `scripts/jira-list-issues.ps1` (JQL padrão `project = CALC`; ver `scripts/jira.env.example`).
- No Cursor: template em `.cursor/mcp.json.example` (servidor **`mcp-atlassian`**, apenas Jira, filtro projeto **CALC**). Copiar para `.cursor/mcp.json` — esse arquivo está no `.gitignore`; **não** versionar tokens. Requer **`uv`** no PATH (`uvx mcp-atlassian`). Doc oficial: https://mcp-atlassian.soomiles.com/docs/configuration

---

## Papel

- Produzir texto **pronto para colar** no Jira (resumo + descrição + campos sugeridos), alinhado ao **produto** (prazos, judiciário BR, precisão) e às **convenções do repo**: chave de projeto **CALC-**, branches `feature|fix/<JIRA-KEY>-slug`, commits e PRs com a mesma chave (ver `.cursor/rules/integracoes-jira-github-cloudflare.mdc`).

## Resumo (Summary)

- Uma linha, **imperativo** ou **substantivo + ação**, em pt-BR (ex.: «Incluir feriados estaduais configuráveis» / «Corrigir contagem quando data inicial cai em feriado»).
- Entre **~40 e 80 caracteres** quando couber (legível na board); evitar genéricos («Melhorias», «Ajustes»).

## Descrição (template)

Usar blocos nesta ordem; omitir seções irrelevantes, manter títulos:

```markdown
## Contexto
[Por que existe / problema ou oportunidade; usuário impactado]

## Escopo
[O que entra; o que fica fora deste cartão]

## Comportamento esperado
[Regra de negócio ou UX; se houver ambiguidade jurídica/regional, **declarar a premissa** adotada neste cartão]

## Critérios de aceite
- [ ] …
- [ ] …

## Notas técnicas (opcional)
[API, flags, migração, risco]

## Referências (opcional)
[links, artigo de lei citado só como referência de produto, sem blindar interpretação]
```

## Tipos de issue (orientação)

| Tipo | Uso típico |
|------|------------|
| **História** | Valor ao usuário em linguagem de resultado |
| **Tarefa** | Trabalho técnico ou operacional claro |
| **Bug** | Regressão ou comportamento incorreto frente ao acordado |
| **Spike / pesquisa** | Incerteza técnica ou de produto com timebox |

## Campos e rótulos sugeridos

- **Prioridade**: coerente com risco para **precisão de prazos** (bugs de cálculo tendem a ser mais altos).
- **Labels**: curtas, reutilizáveis (`frontend`, `deploy`, `regra-prazo`, `seo`, `ux`).
- **Epic / parent**: indicar quando o cartão for parte de uma entrega maior.
- **Componente / ambiente**: preencher se o projeto Jira usar esses campos.

## Convenções que o texto do cartão deve facilitar

- Título e descrição devem permitir **branch** `feature/CALC-n-slug-curto` e commit `CALC-n: …` sem reinventar o escopo.
- Critérios de aceite **testáveis** (observável na UI, no JSON da API ou em teste automatizado).

## O que evitar

- Descrição só em uma frase vaga; critérios genéricos («funcionar bem»).
- Assumir interpretação jurídica sem registrar a **premissa** no cartão ou na UI (alinhado às regras do produto).
- Duplicar três cartões para o mesmo escopo sem linkar ou dividir critérios.

## Exemplo completo (referência)

Valores fictícios; ajustar chave **CALC-** ao projeto Jira.

**Campos sugeridos**

| Campo | Valor exemplo |
|-------|----------------|
| Tipo | História |
| Resumo | Contar prazo em dias úteis com feriados nacionais |
| Prioridade | Alta (impacto direto na precisão) |
| Labels | `frontend`, `regra-prazo`, `vue` |
| Epic / pai | (opcional) Épico «MVP — cálculo de prazos» |

**Descrição (corpo da issue)**

```markdown
## Contexto

Advogados e servidores precisam calcular prazos em **dias úteis**, desconsiderados sábados, domingos e feriados. Hoje a calculadora lista apenas dias corridos; isso gera divergência com prazos processuais comuns.

## Escopo

- **Entra:** opção «Dias úteis» na mesma tela de cálculo; uso dos **feriados nacionais** de um calendário mantido no repositório (lista versionada ou tabela estática).
- **Fora deste cartão:** feriados estaduais/municipais, suspension of deadlines (férias forenses), regras específicas por tribunal ou por tipo de processo.

## Comportamento esperado

- Com «Dias úteis» ativo, o sistema avança só em dias que não sejam sábado, domingo nem feriado nacional conforme a lista acordada.
- **Premissa deste cartão:** «dia útil» segue o conjunto **apenas** de feriados nacionais em `data/feriados-nacionais.json` (ou path definido na implementação). Qualquer exceção (ex.: feriado local) exige novo cartão ou configuração explícita.

## Critérios de aceite

- [ ] Usuário escolhe entre «Dias corridos» e «Dias úteis» antes de calcular; o resultado exibe claramente qual modo foi usado.
- [ ] Para uma data inicial e quantidade N de dias úteis, o último dia listado coincide com o esperado nos testes automatizados para os casos de referência anexados ao PR (mínimo 3 cenários, incl. ano bissexto e feriado que cai na semana).
- [ ] Se não houver feriados carregados, a UI indica erro ou aviso explícito — sem calcular em silêncio.
- [ ] Texto de ajuda curto na tela ou rodapé menciona que **apenas feriados nacionais** estão considerados (alinhado à premissa).

## Notas técnicas

- Implementar em módulo puro de domínio (ex.: `src/domain/diasUteis.ts`) consumido pela UI Vue; preparar testes Vitest.
- Branch sugerida: `feature/CALC-47-dias-uteis-feriados-nacionais`.

## Referências

- (opcional) Link para lista oficial de feriados usada como fonte da tabela — apenas rastreio; o produto não se compromete com interpretação jurídica fora do que estiver no texto da UI e neste cartão.
```
