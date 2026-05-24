# calculadoradeprazos.com

Calculadora de prazos processuais (piloto **Goiás** e **Tocantins**).

## Stack

- **Vite** + **Vue 3** + **TypeScript**
- Dados estáticos em `public/data/` (preparado para API futura)
- Deploy: Cloudflare Pages (`dist/` após `npm run build`)

## Desenvolvimento local

Requer **Node.js 22+** e npm. Na primeira vez (ou após mudar dependências), gere e commite o lockfile — o CI usa `npm ci`:

```bash
npm install
npm run dev
```

O arquivo `package-lock.json` deve estar versionado no repositório para o deploy em GitHub Actions.

Build de produção:

```bash
npm run build
npm run preview
```

Testes:

```bash
npm test
```

## Versão da aplicação (SemVer)

A versão oficial fica em `package.json` (`version`), atualizada automaticamente no **merge em `main`** pelo [semantic-release](https://github.com/semantic-release/semantic-release) (workflow `.github/workflows/deploy-cloudflare-pages.yml`). A SPA lê o valor via `src/config/version.ts` (`APP_VERSION`) — **não** duplique a string em outros arquivos.

### Commits que geram release

Use [Conventional Commits](https://www.conventionalcommits.org/) no **título do squash merge** ou no commit em `main` (prefixo Jira opcional):

| Mensagem (exemplo) | Bump |
|--------------------|------|
| `CALC-12: feat: opção dias úteis` | minor |
| `CALC-12: fix: corrige feriado` | patch |
| `CALC-12: perf: cache calendário` | patch |
| `feat!: quebra API interna` ou corpo com `BREAKING CHANGE:` | major |
| `CALC-12: chore: docs` | sem release (só deploy se houver mudança de código) |

Fluxo após merge em `main`: `semantic-release` → tag GitHub + `CHANGELOG.md` + bump em `package.json` → `npm test` → `npm run build` → deploy. O commit `chore(release): … [skip ci]` não dispara um segundo pipeline completo.

Release local (dry-run): `npx semantic-release --dry-run` (requer histórico git e variáveis `GITHUB_TOKEN` se for testar publicação).

Spike de comarcas (CALC-21): ver `docs/comarcas-fonte-go-to.md` e `public/data/comarcas-mapeamento-legado.json`.

```bash
npm run data:comarcas-gap
```

Gerar listas completas de comarcas (sedes) para GO e TO — CALC-22:

```bash
npm run data:municipios-comarcas
```

Fontes: anexo legislativo GO (`scripts/data/fonte/comarcas-go-legisla-anexo.txt`) + suplemento (`scripts/data/comarcas-go-suplemento.json`); TJTO (`scripts/data/comarcas-sedes-to.json`). Ver `docs/comarcas-fonte-go-to.md`.

Regenerar índice de varas do piloto (após alterar municípios/tribunais):

```bash
npm run data:varas
```

API de cálculo (Cloudflare Worker): `POST /api/calculo-prazo` com o mesmo JSON documentado em `CalculoPrazoApiPayload` (`src/services/dadosLocalidade.ts`). Em produção o front chama a API; se indisponível, usa o motor local no navegador.

## Premissas de cálculo (piloto)

- O prazo **sempre** começa no **primeiro dia útil** após a data da publicação.
- **Úteis:** exclui fins de semana e feriados nacionais, estaduais e municipais do município selecionado.
- **Corridos:** conta dias de calendário a partir do início, com suspensão no **recesso forense** do tribunal.
- **Tribunal** define o recesso (20/dez a 20/jan). Feriados municipais: ver `public/data/feriados/municipais.json`.

## Deploy (GitHub Actions → Cloudflare Pages)

Em cada push em `main`, o workflow `.github/workflows/deploy-cloudflare-pages.yml` executa:

1. `npm ci`
2. `npm test`
3. `npm run build`
4. `wrangler pages deploy dist`

Secrets necessários: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Variável opcional: `CLOUDFLARE_PAGES_PROJECT_NAME` (padrão: `calculadoradeprazos`).

## Jira

Cartões do piloto: `scripts/data/jira-combos-piloto-issues.json` — criar com:

```powershell
. .\scripts\jira-load-env.ps1
.\scripts\jira-create-combos-piloto-issues.ps1
```
