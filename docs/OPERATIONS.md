# AIScrape local demo and operations

## Deterministic local stack

The reproducible local environment is PostgreSQL 16, Redis 7, the Next.js web
application, and a BullMQ worker. It is a local demonstration, not a hosted
scraping service.

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:3000`. The PostgreSQL and Redis health checks gate the
web and worker startup. Use `docker compose logs -f worker` to observe
structured `job.started`, `job.retrying`, `job.dead_lettered`, and
`job.completed` events.

The Docker image includes Chromium for browser tasks and runs browser tasks in
`BROWSER_MODE=local` for this demo. Authentication, payment,
and Gemini features need their own test credentials in `.env`; never add them
to source control. `DATABASE_URL` and Redis are supplied by Compose and should
not be copied from production.

### Queue semantics

Workflow jobs use the execution ID as the BullMQ `jobId`, so a duplicate submit
does not create a second execution. Jobs retry three times with exponential
backoff from one second. A terminal failure is copied to
`workflow-execution-dead-letter-queue` with its error and attempts count. The
worker logs are the local observability surface; production deployments should
ship those JSON logs to their normal collector and monitor DLQ depth.

### Worker and browser smoke

After the stack is running, the same ephemeral workflow used by CI can verify
that Redis enqueues a real job, the worker launches Chromium, and HTML output is
persisted:

```bash
docker compose exec -T worker npx tsx scripts/compose-worker-smoke.ts
```

The script uses the public IANA example page, consumes seven temporary credits,
and deletes its workflow and balance after the assertion. Replace
`WORKER_SMOKE_URL` only with a host that is present in `SCRAPE_ALLOWED_HOSTS`.

## Target and compliance policy

Only scrape targets for which you have permission and which comply with the
target site's terms, robots policy, and applicable law. AIScrape blocks
non-HTTP(S), loopback, private-network, and cloud-metadata targets before a
browser opens. Before navigation it retrieves `robots.txt` and fails closed in
the default `SCRAPE_ROBOTS_MODE=strict`; it also takes a Redis-backed per-host
slot (`SCRAPE_MIN_INTERVAL_MS`, one second by default). Set
`SCRAPE_ALLOWED_HOSTS=example.com,docs.example.com` in any
shared or deployed environment to use a strict allowlist. Keep per-domain
rate limits conservative, identify the bot responsibly, and stop a workflow
when a site asks not to be automated. Do not use browser nodes to bypass login,
paywalls, CAPTCHAs, or access controls.

Credentials are encrypted by the app's credential handling path, but environment
secrets remain deployment-owned. Use a managed secret store or Kubernetes
Secrets supplied by CI/CD; never place values in manifests, images, workflow
definitions, logs, or commits.

## Kubernetes deployment and rollback

`k8s/deployment.yaml` is a production-template baseline. Build and push an
immutable image (replace the `replace-me` image tag in the manifest through
your deployment system), then apply the manifests through your
deployment system. Supply `DATABASE_URL`, `REDIS_CONNECTION_URL`, and
`BRIGHT_DATA_BROWSER_WS` through a pre-created secret and use managed
PostgreSQL/Redis. The production manifest deliberately does not create a
local Redis instance. Verify `kubectl rollout status deployment/aiscrape-web` and
`deployment/aiscrape-worker`, then inspect worker logs and DLQ depth.

To roll back, use `kubectl rollout undo deployment/aiscrape-web` and
`kubectl rollout undo deployment/aiscrape-worker`; validate database migration
compatibility before rolling an image back. Do not delete volumes or schema data
as part of a rollback.
