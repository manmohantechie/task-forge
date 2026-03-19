# ⚡ TaskForge — Distributed Background Job Processing System

A production-grade distributed system for scalable background job processing built with **FastAPI**, **Celery**, **Redis**, **PostgreSQL**, and **React**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│   React Dashboard (Vite + TypeScript + TanStack Query + Recharts)   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTP / REST
┌───────────────────────────────▼─────────────────────────────────────┐
│                           API LAYER                                 │
│              FastAPI  ·  Uvicorn  ·  Pydantic v2                    │
│         /api/v1/jobs  ·  /api/v1/stats  ·  /api/v1/workers          │
└──────────┬────────────────────────────────────┬─────────────────────┘
           │ SQLAlchemy ORM                     │ Celery tasks
┌──────────▼──────────┐              ┌──────────▼──────────────────────┐
│   PostgreSQL 16      │              │         Redis 7 (Broker)        │
│  Jobs · Workers      │              │  Queues: high · default · low   │
│  QueueStats          │              │           email · analytics      │
└─────────────────────┘              └──────────┬──────────────────────┘
                                                │ consume
        ┌───────────────────────────────────────┼───────────────────┐
        │                   WORKER POOL         │                   │
        ▼                       ▼               ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│worker-high   │   │worker-default│   │worker-email  │   │worker-analyt.│
│concurrency:8 │   │concurrency:4 │   │concurrency:2 │   │concurrency:2 │
│queue: high   │   │queue: default│   │queue: email  │   │queue:analytic│
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
        │
┌───────▼──────────┐
│  Celery Beat      │   Periodic scheduler (cleanup, health-check, reports)
│  (Scheduler)      │
└───────────────────┘
        │
┌───────▼──────────┐
│     Flower        │   Real-time Celery monitoring UI  →  :5555
└───────────────────┘
```

---

## Tech Stack

| Layer        | Technology                                    |
|--------------|-----------------------------------------------|
| API          | FastAPI 0.115, Uvicorn, Pydantic v2           |
| Task queue   | Celery 5.4, Kombu                             |
| Broker       | Redis 7                                       |
| Result store | Redis (separate DB index)                     |
| Database     | PostgreSQL 16 + SQLAlchemy 2 ORM              |
| Migrations   | Alembic                                       |
| Monitoring   | Flower                                        |
| Frontend     | React 18, Vite, TypeScript                    |
| State        | TanStack Query (auto-refresh every 5s)        |
| Charts       | Recharts                                      |
| Routing      | React Router v6                               |
| Styling      | Custom CSS (IBM Plex Mono + Space Grotesk)    |
| Containers   | Docker + Docker Compose                       |

---

## Project Structure

```
job-forge/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── jobs.py          # Job CRUD + dispatch endpoints
│   │   │   └── system.py        # Stats, workers, queues, registry
│   │   ├── core/
│   │   │   ├── celery_app.py    # Celery config, queues, beat schedule
│   │   │   └── config.py        # Pydantic settings (env-based)
│   │   ├── models/
│   │   │   └── models.py        # SQLAlchemy: Job, Worker, QueueStats
│   │   ├── schemas/
│   │   │   └── schemas.py       # Pydantic request/response schemas
│   │   └── workers/
│   │       ├── email_tasks.py   # send_email, send_bulk_email, notify
│   │       ├── analytics_tasks.py  # reports, aggregates, event tracking
│   │       ├── data_tasks.py    # CSV, DB sync, export, health-check
│   │       └── media_tasks.py   # video transcode, thumbnails
│   ├── scripts/
│   │   └── seed.py              # Demo data seeder
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Sidebar + nav
│   │   │   ├── StatCard.tsx     # Metric card
│   │   │   ├── StatusBadge.tsx  # Job status pill
│   │   │   └── ProgressBar.tsx  # Animated progress
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Overview + charts
│   │   │   ├── JobsPage.tsx     # Filterable job list
│   │   │   ├── JobDetailPage.tsx # Job detail + timeline
│   │   │   ├── CreateJobPage.tsx # Job dispatcher form
│   │   │   ├── WorkersPage.tsx  # Worker node monitor
│   │   │   └── QueuesPage.tsx   # Queue depth + charts
│   │   ├── lib/
│   │   │   └── api.ts           # Axios client + all typed API fns
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css            # Full design system (CSS vars)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml           # All 10 services defined
├── Makefile                     # Dev shortcuts
└── README.md
```

---

## Quick Start

### Option A: Docker (Recommended)

```bash
# Clone and enter the project
cd task-forge

# Start everything (Redis, Postgres, API, 4 workers, Beat, Flower, Frontend)
make up

# Seed demo jobs
make seed
```

**Services:**

| Service      | URL                       |
|--------------|---------------------------|
| Frontend     | http://localhost:3000      |
| API Docs     | http://localhost:8000/docs |
| Flower       | http://localhost:5555      |
| API          | http://localhost:8000      |

---

### Option B: Local Development

**Prerequisites:** Python 3.12+, Node 20+, Redis, PostgreSQL

```bash
# 1. Install dependencies
make install

# 2. Start Redis and PostgreSQL (via Docker just for infra)
docker compose up -d redis postgres

# 3. Set environment variables
cp backend/.env.example backend/.env
# Edit .env as needed

# 4. Run database migrations
make db-migrate

# 5. Start services in separate terminals:
make dev-api        # Terminal 1 - FastAPI
make dev-worker     # Terminal 2 - Celery worker
make dev-beat       # Terminal 3 - Beat scheduler
make dev-flower     # Terminal 4 - Flower monitor
make dev-frontend   # Terminal 5 - React app

# 6. Seed data
make seed
```

---

## Environment Variables

Create `backend/.env`:

```env
# App
APP_NAME=TaskForge
DEBUG=true
SECRET_KEY=change-me-in-production

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskforge

# Redis / Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1

# Worker
WORKER_CONCURRENCY=4
MAX_RETRIES=3
RETRY_BACKOFF=60
```

---

## API Reference

### Jobs

| Method | Endpoint                    | Description               |
|--------|-----------------------------|---------------------------|
| POST   | `/api/v1/jobs/`             | Create & dispatch a job   |
| GET    | `/api/v1/jobs/`             | List jobs (filter/paged)  |
| GET    | `/api/v1/jobs/{id}`         | Get job + live status     |
| DELETE | `/api/v1/jobs/{id}`         | Revoke/cancel a job       |
| POST   | `/api/v1/jobs/{id}/retry`   | Re-dispatch failed job    |
| POST   | `/api/v1/jobs/bulk/create`  | Dispatch multiple jobs    |

### System

| Method | Endpoint                    | Description               |
|--------|-----------------------------|---------------------------|
| GET    | `/api/v1/stats`             | Dashboard statistics      |
| GET    | `/api/v1/workers`           | Connected worker nodes    |
| GET    | `/api/v1/queues`            | Queue depths from Redis   |
| GET    | `/api/v1/tasks/registry`    | All registered task types |
| GET    | `/api/v1/health`            | Health check              |

### Create a Job (example)

```bash
curl -X POST http://localhost:8000/api/v1/jobs/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Sales Report",
    "task_name": "generate_report",
    "queue": "analytics",
    "priority": "high",
    "kwargs": {
      "report_type": "sales",
      "date_range": {"start": "2024-01-01", "end": "2024-12-31"}
    },
    "max_retries": 3
  }'
```

---

## Task Registry

| Task Name            | Queue     | Priority | Description                      |
|----------------------|-----------|----------|----------------------------------|
| `send_email`         | email     | high     | Send a single transactional email|
| `send_bulk_email`    | email     | default  | Bulk email campaign              |
| `send_notification`  | email     | high     | Push/in-app notification         |
| `generate_report`    | analytics | default  | Analytics report generation      |
| `compute_aggregates` | analytics | default  | Multi-dim metric aggregation     |
| `track_event`        | analytics | low      | Event tracking pipeline          |
| `process_csv`        | default   | default  | Large CSV file processing        |
| `sync_database`      | default   | low      | Cross-database synchronization   |
| `export_data`        | low       | low      | Data export to S3/storage        |
| `transcode_video`    | default   | default  | Video format conversion          |
| `generate_thumbnail` | high      | high     | Image thumbnail generation       |

---

## Scaling Workers

Scale horizontally using Docker Compose:

```bash
# Scale default workers to 5 instances
docker compose up -d --scale worker-default=5

# Scale high-priority workers
docker compose up -d --scale worker-high=4

# Or use the Makefile shortcut
make worker-scale-up
```

Each worker type is independently scalable and consumes only from its designated queue(s).

---

## Periodic Tasks (Beat Scheduler)

| Task                  | Schedule    | Description                          |
|-----------------------|-------------|--------------------------------------|
| `cleanup_old_jobs`    | Every hour  | Remove job records older than 7 days |
| `generate_hourly_report` | Every hour | Hourly system performance report  |
| `system_health_check` | Every 60s   | Redis + DB + worker health probe     |

---

## Dashboard Features

- **Live Dashboard** — Real-time stats refreshed every 4 seconds
- **Job List** — Filter by status, queue, search by name; pagination
- **Job Detail** — Progress bar, execution timeline, args/result/error inspector
- **Create Job** — Visual task picker with auto-filled parameter templates
- **Workers** — Live worker node cards with load bars and queue assignments
- **Queues** — Depth monitoring, bar chart comparisons, per-queue metrics

---

## Adding a New Task

1. Define the task in `backend/app/workers/`:

```python
from app.core.celery_app import celery_app

@celery_app.task(bind=True, name="app.workers.my_tasks.my_task", queue="default")
def my_task(self, param1: str, param2: int):
    self.update_state(state="STARTED", meta={"progress": 50})
    # ... your logic ...
    return {"result": "done"}
```

2. Add it to `include` in `app/core/celery_app.py`
3. Register the name in `TASK_REGISTRY` in `app/api/jobs.py`
4. Add a default kwargs template in `TASK_DEFAULTS` in `CreateJobPage.tsx`

---

## Production Checklist

- [ ] Change `SECRET_KEY` in environment
- [ ] Use Redis Sentinel or Redis Cluster for HA
- [ ] Use RDS/managed PostgreSQL
- [ ] Enable Celery result compression (`task_compression = "gzip"`)
- [ ] Set `FLOWER_BASIC_AUTH` for Flower authentication
- [ ] Configure dead letter queues for failed tasks
- [ ] Add Prometheus metrics via `celery-prometheus-exporter`
- [ ] Set up log aggregation (ELK, Loki, Datadog)
- [ ] Use `task_always_eager=False` in tests, `True` in local dev
- [ ] Configure `worker_max_tasks_per_child` to prevent memory leaks

---

## License

MIT
