# OpsPilot project guide

This academic SOA application uses React/TypeScript and TanStack Start. The entry page is `src/routes/index.tsx`; the product UI is `src/components/App.tsx`, with styling in `src/styles.css`. The index starts with a landing page, followed by demo login or View Demo. In-workspace page navigation uses hash names and sessionStorage stores only the demo-access flag.

All business requests go through `src/lib/api.ts` to `netlify/functions/gateway.mts` at `/api/*`. Keep HTTP handling in the gateway and business logic in `server/services`. Shared data contracts are in `src/shared/models.ts`. Incident orchestration invokes analysis, ingestion, persistence, and notifications. Services are logical modules within one Function, not separately deployed microservices. Keep the architecture diagram and README honest about this boundary.

Persistence uses Netlify Database and Drizzle's native Netlify adapter. `db/schema.ts` owns the schema; migrations live under `netlify/database/migrations` and must accompany schema edits. The platform applies migrations. Repository seed initialization is transactional with a metadata marker so concurrent requests do not duplicate seed data and user deletions do not trigger reseeding.

The AI analysis is intentionally deterministic local simulation. Preserve the simulation labels and heuristic-confidence disclosure. All sample identities and incidents must remain fictional. Demo credentials are public presentation conveniences; do not treat the browser gate as access control. Production authentication would require Netlify Identity and server authorization.

Use reusable visual primitives, semantic buttons, accessible labels, request error feedback, and responsive layouts. Keep API calls out of SSR rendering. UI charts derive from persisted incidents rather than unrelated sample constants. Health values measure the shared repository probe; do not invent isolated service latency or uptime.

Use pnpm and Node 22.13+ or 24. Local development uses `netlify dev --port 8889` to include Functions. Follow run-specific restrictions on builds and validation. Never print secrets, inspect `.git`, or manually apply database migrations.
