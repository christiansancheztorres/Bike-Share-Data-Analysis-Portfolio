# Bike-Share Data Analysis Portfolio

A reproducible Python/pandas analysis and interactive report examining patterns in Capital Bikeshare's 2011–2012 hourly rental data.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/bike-share-analysis run dev` — run the interactive report
- `python artifacts/bike-share-analysis/analysis/analyze.py` — rerun cleaning, analysis, exports, and static charts
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bike-share-analysis/analysis/analyze.py` — source of truth for cleaning, validation, analysis, and report-data generation
- `artifacts/bike-share-analysis/analysis/data/hour.csv` — supplied UCI hourly source data
- `artifacts/bike-share-analysis/public/data/bikeshare-analysis.json` — generated report dataset
- `artifacts/bike-share-analysis/src/` — interactive report UI

## Architecture decisions

- The small official UCI Capital Bikeshare dataset is bundled for reliable, offline reproduction.
- The Python pipeline generates all report metrics; the React report presents those outputs and does not duplicate analysis logic.
- Results are framed as descriptive associations because the dataset is historical and aggregated hourly.

## Product

Readers can review quantified findings, explore interactive charts, download each chart's data, inspect the cleaning audit and methodology, switch themes, and print the report as a PDF.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Rerun the Python analysis after replacing the source CSV so the report JSON and static chart exports stay synchronized.
- The source's season coding is ambiguous relative to calendar months, so the pipeline derives Northern Hemisphere seasons from parsed dates.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
