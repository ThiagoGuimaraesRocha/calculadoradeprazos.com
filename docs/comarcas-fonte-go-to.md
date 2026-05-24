# Spike CALC-21 — Fonte oficial e mapeamento comarcas → IDs legados (GO/TO)

Documento de entrega do cartão **CALC-21**. Define de onde extrair a lista completa de **comarcas** (sedes judiciárias), como mapear ao contrato `Municipio { id, nome, estados_id }` e o que o piloto atual cobre.

**Data de consulta das fontes:** 24/05/2026.

## Premissa de produto

- Cada opção do combo «Município» na UI representa o **município sede** de uma **comarca** do TJ estadual.
- Várias unidades judiciárias no mesmo município (ex.: varas) **não** geram linhas duplicadas no combo.
- Comarcas **anexadas** ou **extintas** recentemente ficam **fora** da lista operacional, salvo decisão explícita registrada no CALC-22 (ver riscos).

## Contagem esperada por UF

| UF | Comarcas no repositório hoje | Contagem oficial (meta CALC-22) | Gap (faltam) |
|----|------------------------------|----------------------------------|--------------|
| **GO** | 24 (`public/data/municipios/GO.json`) | **123** | **99** |
| **TO** | 2 (`public/data/municipios/TO.json`) | **≈ 35–42** (validar na extração) | **≈ 33–40** |

### Goiás (123 comarcas)

- **Fonte primária (contagem):** Arquivo Histórico do TJGO — fundo «Comarcas do Estado de Goiás», que informa composição atual de **123 comarcas**.
  - URL: https://atom.tjgo.jus.br/index.php/zwwe-9fsy-btw9
  - Consulta: 24/05/2026.
- **Fonte operacional (lista nominal vigente):** Portal TJGO → Informações → **Organograma e Mapa de Contatos** → **Comarcas / Lista Juízes** (1ª instância). É a base recomendada para o script do CALC-22 cruzar nome da sede.
  - URL: https://www.tjgo.jus.br/index.php/informacoes/mapa-contatos
  - Consulta: 24/05/2026 (página exige navegação no menu; conteúdo dinâmico).
- **Fonte auxiliar (sedes × município):** legislação estadual / anexos com «Município de X – sede de comarca» (ex.: material indexado em https://legisla.casacivil.go.gov.br — tabela de comarcas e distritos). Útil para validar grafia e sede, não substitui a lista do TJGO se houver divergência.
- **Reorganização recente:** Resolução TJGO nº 305/2025 (anexações, varas das garantias) — ao gerar dados, conferir se comarcas anexadas deixam de aparecer como sede autônoma (ex.: Araçu → Inhumas).

### Tocantins (≈ 35–42 comarcas)

- **Fonte primária (lista):** Corregedoria-Geral da Justiça do TJTO — seção **Comarcas**.
  - URL: https://corregedoria.tjto.jus.br/cidadao/comarcas
  - Consulta: 24/05/2026 (portal com frames; extração automatizada no CALC-22).
- **Fonte secundária (relação por entrância):** Relatório «RELAÇÃO DAS COMARCAS DO ESTADO DO TOCANTINS».
  - URL: http://wwa.tjto.jus.br/relepromover/Report/VisualizarRelComarca.aspx
  - Consulta: 24/05/2026 (HTML servido; parsing a implementar no CALC-22).
- **Contexto histórico:** TJTO instalou **32** comarcas em 1989; o número **não** é meta atual — houve criações e **extinções/anexações** (ex.: Resolução TJTO nº 53/2024 — desinstalação da Comarca de Tocantínia, anexada a Miracema do Tocantins).
- **Meta numérica para CALC-22:** extrair do relatório/corregedoria e registrar contagem exata no PR; até lá, estimativa **35–42** com base em relação por entrância e notícias de reorganização.

## Estratégia de IDs

### IDs legados (não alterar)

Todos os `id` já presentes em:

- `public/data/municipios/GO.json` e `TO.json`
- chaves de `public/data/feriados/municipais.json`
- prefixos de chaves em `public/data/varas/piloto-go-to.json` (`GO:{municipioId}:…`)

**Origem do legado:** amostra do piloto CALC-15, alinhada aos identificadores numéricos usados na coleta inicial (mesma ordem de grandeza que serviços de referência externos — ex.: listagem com ~24 municípios para GO e 2 para TO).

Tabela completa em `public/data/comarcas-mapeamento-legado.json`.

### IDs novos (CALC-22)

1. **Nunca** reutilizar ou remapear um `id` legado.
2. Para comarcas ainda não cadastradas: `id = 60000 + sequencial` por UF, na ordem **alfabética** do `nome` oficial da sede (após normalização de acentos/caixa).
3. Registrar cada par `nome` → `id` no JSON gerado e, se possível, em `comarcas-mapeamento-legado.json` (seção `novos`).
4. **Não** usar código IBGE como `id` no contrato atual (evita colisão e mudança de contrato); IBGE pode ir em campo futuro `codigoIbge` se necessário.

## Exemplos de mapeamento (≥ 5)

| nome (sede) | id | estados_id | UF | Ação |
|-------------|-----|------------|-----|------|
| Goiânia | **992** | 9 | GO | Manter legado |
| Palmas | **5535** | 27 | TO | Manter legado |
| Anápolis | **913** | 9 | GO | Manter legado |
| Araguaína | **5458** | 27 | TO | Manter legado |
| Aparecida de Goiânia | **916** | 9 | GO | Manter legado |
| Planaltina | **60001** (proposto) | 9 | GO | Criar no CALC-22 — comarca TJGO, fora do piloto |
| Gurupi | **60002** (proposto) | 27 | TO | Criar no CALC-22 |
| Paraíso do Tocantins | **60003** (proposto) | 27 | TO | Criar no CALC-22 |

## Gap analysis (piloto atual)

Arquivo gerado por `node scripts/inventario-comarcas-gap.mjs` → `public/data/comarcas-gap-piloto.json`.

| Métrica | GO | TO |
|---------|----|----|
| Itens em `municipios/{UF}.json` | 24 | 2 |
| Meta oficial | 123 | ≈ 35–42 (confirmar) |
| Faltam (estimativa) | **99** | **≈ 33–40** |
| IDs em `feriados/municipais.json` | 24 chaves GO + 2 TO | todas preservadas no legado |

**Observação:** a amostra atual de GO (24) coincide com a lista reduzida de um agregador externo consultado em 24/05/2026 (24 entradas para `idEstado=9`); **não** representa as 123 comarcas do TJGO.

## Riscos e decisões para o CALC-22

| Risco | Mitigação |
|-------|-----------|
| Nome da comarca ≠ nome do município IBGE | Usar **sede de comarca** como `nome` exibido; documentar alias se necessário. |
| Comarca anexada/extinta após resolução | Excluir da lista; citar resolução no changelog do dataset. |
| Comarca interior com sede em distrito | Premissa deste spike: **uma entrada por sede municipal** de comarca; distritos judiciários sem sede própria **não** entram. |
| Divergência entre fontes (TJGO × legislação) | Prevalece **lista operacional do tribunal** (mapa de contatos / corregedoria). |
| Feriado municipal só para 26 IDs | Novos IDs recebem `{ "recorrentes": [], "datas": [] }` até curadoria (CALC-18). |
| Varas só para combinações piloto | CALC-19 permanece parcial; novas comarcas não exigem varas no CALC-22. |

## Contrato técnico (inalterado neste spike)

- Tipo: `Municipio` em `src/domain/types.ts`
- Carga: `carregarMunicipios(sigla)` em `src/services/dadosLocalidade.ts`
- UI: `FormCalculoPrazo.vue` (Tom Select no campo município)

## Próximo cartão

**CALC-22** — Gerar datasets completos com script reprodutível, testes Vitest de integridade e contagem batendo com este documento.

## Artefatos deste spike

| Artefato | Caminho |
|----------|---------|
| Este documento | `docs/comarcas-fonte-go-to.md` |
| Mapeamento legado + exemplos | `public/data/comarcas-mapeamento-legado.json` |
| Gap numérico (gerado) | `public/data/comarcas-gap-piloto.json` |
| Script de inventário | `scripts/inventario-comarcas-gap.mjs` |
