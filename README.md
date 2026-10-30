# AI-Powered DevOps Incident Management System

OpsPilot is an academic Service-Oriented Architecture demonstration with a responsive React operations console, a REST API gateway, persistent PostgreSQL data, and simulated AI-assisted log analysis. All data and engineer identities are fictional.

## Problem and solution

Large volumes of logs and alerts make incident identification and troubleshooting time-consuming. This application centralizes the incident lifecycle and produces explainable classifications, severity suggestions, possible root causes, and recommended actions.

## Features

- Landing page and explicitly labeled demo login: `admin@devops-demo.com` / `admin123`.
- Dashboard with current incident totals, active critical incidents, resolved-today count, logical service connectivity, activity chart, severity doughnut, service bars, and status distribution.
- Search and severity, status, service, and creation-date filters.
- Incident creation, details, severity changes, assignment, lifecycle transitions, timelines, related logs, and deletion.
- Paste logs, load sample logs, or upload `.txt` and `.log` files up to 200 KB. Analyze, search, and filter persisted log records.
- Simulation creates a payment timeout incident, classifies severity, stores logs and analysis, records a notification, and opens the resulting incident.
- Readable notifications with mark-all-read and incident navigation.
- Services, architecture, and About Project pages for explaining the implementation.
- Loading skeletons, inline validation, error/retry states, empty states, toast feedback, and mobile navigation.

## Architecture and SOA concepts

```text
React frontend
      | HTTP / REST
Netlify Function: API Gateway (/api/*)
      | typed internal calls
      + Incident service ----+---- Log service
      + Analysis service     +---- Notification service
                             |
                      Repository layer
                             |
                    Netlify PostgreSQL
```

The gateway handles HTTP transport and dispatch. Business capabilities live in separate modules in `server/services`. The repository encapsulates database access. The incident service orchestrates analysis, log ingestion, and notifications. This demonstrates separation of concerns, service contracts, composition, and a single API entry point.

These are logical services in one serverless deployment, not independently deployed microservices. REST is used between the browser and gateway; internal service communication uses typed TypeScript calls. The diagram matches the implementation. Service health reports a shared repository connectivity probe, not independent module availability or measured external uptime.

## Technology stack and folders

React 19, TypeScript, TanStack Start, Tailwind CSS, custom CSS, Lucide icons, Chart.js, Netlify Functions, Netlify Database, and Drizzle ORM.

- `src/components/App.tsx`: presentation shell, pages, reusable badges and analysis cards, client workflows.
- `src/lib/api.ts`: HTTP client, errors, and request timeout.
- `src/shared/models.ts`: shared data contracts and allowed lifecycle values.
- `src/routes`: TanStack entry route and HTML/social metadata.
- `src/styles.css`: design tokens and responsive styles.
- `netlify/functions/gateway.mts`: public gateway and request validation.
- `server/services`: incident orchestration, log ingestion, local analysis, notification handling.
- `server/repository.ts`: persistent CRUD and idempotent seed initialization.
- `db`: Drizzle schema and lazy database client.
- `netlify/database/migrations`: deployment-managed schema migrations.

## API endpoints

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | `/api/incidents` | List incidents |
| GET | `/api/incidents/:id` | Retrieve an incident |
| POST | `/api/incidents` | Create from title, description, service, optional severity |
| PUT | `/api/incidents/:id` | Update fields, severity, status, or engineer |
| DELETE | `/api/incidents/:id` | Delete incident; logs remain as audit records |
| GET | `/api/logs` | Retrieve persisted logs |
| POST | `/api/logs/analyze` | Analyze and ingest `{ "text": "..." }` |
| POST | `/api/analysis` | Alias for log analysis |
| POST | `/api/simulate` | Execute incident simulation workflow |
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications` | Create notification from title and message |
| PUT | `/api/notifications/read` | Mark all notifications read |
| GET | `/api/services/health` | Logical service connectivity probe |
| GET | `/api/health` | Alias for service health |

Successful creation returns 201, deletion 204, invalid input 400, missing incidents 404, unsupported routes/methods 405, and unexpected failures 500. The frontend displays request errors and supports retries. No credentials or external AI keys are required.

## Run locally

Use Node 22.13+ or Node 24 and pnpm. Link the project to Netlify so the managed database integration is available.

```sh
pnpm install
netlify dev --port 8889
```

Open `http://localhost:8889`. Database migrations are created from `db/schema.ts` and applied by the Netlify platform during deployment. Generate a migration after a schema change with `pnpm exec drizzle-kit generate --name describe_schema_change`. Do not apply production migrations manually.

## How analysis works

The local engine checks database, authentication, memory, CPU, network timeout, availability, and generic error patterns in priority order. Each recognized pattern maps to an incident type, predicted severity, suggested cause, action, summary, and heuristic confidence. Unrecognized input returns a low-confidence informational result. Confidence is illustrative and not statistically calibrated. Results are labeled AI Analysis and explicitly identify the local rule-based simulation. No external model is called.

## Demo walkthrough

1. Open View Demo or sign in with the visible demo account.
2. Review the dashboard and use Simulate New Incident.
3. Inspect generated analysis, logs, and timeline; assign an engineer.
4. Start investigation, mark mitigating, then resolve the incident.
5. Return to the dashboard and review updated totals and notifications.
6. Load sample logs in Log Analyzer, analyze, and create an incident from the result.
7. Open Architecture and explain gateway dispatch, focused services, orchestration, and persistence.

## Limits and future improvements

Demo login is a browser-session presentation gate, not production authentication. The REST API and fictional shared workspace are public. Never enter private data. A production version needs Netlify Identity, server-side authorization, tenant isolation, rate limiting, and audit policies. No external monitoring or log collector is connected. Logical service health should not be confused with the health of fictional monitored applications. Log ingestion stores at most 200 nonempty lines per analysis request. The initial seed contains 12 incidents and is inserted transactionally once; deleting all incidents does not reseed the workspace. Dashboard counts use UTC day boundaries.

Future work includes independently deployed services, transactional outbox events, paginated queries, real telemetry integration, robust background retries for multi-step workflows, and optional external model analysis with evaluation and human approval. Multi-step incident creation currently persists sequentially across services, so a later failure can leave a partially completed workflow.

## Validation

Source files and API flow were reviewed during implementation. Local build, browser, and test commands were not run because this environment delegates validation to the platform build pipeline. Production behavior, console output, and deployment availability require the resulting deployed preview and are not claimed as verified here.
