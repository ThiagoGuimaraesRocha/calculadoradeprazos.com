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

Spike de comarcas (CALC-21): ver `docs/comarcas-fonte-go-to.md` e `public/data/comarcas-mapeamento-legado.json`.

```bash
npm run data:comarcas-gap
```

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
