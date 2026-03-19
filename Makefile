.PHONY: up down build logs restart worker-scale seed clean help

# ─── Docker Compose ─────────────────────────────────────────────────────────
up:
	@echo "🚀 Starting TaskForge..."
	docker compose up -d
	@echo "✅ Services started"
	@echo "   API:      http://localhost:8000/docs"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Flower:   http://localhost:5555"

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

logs-worker:
	docker compose logs -f worker-default worker-high worker-email worker-analytics

restart:
	docker compose restart api

# ─── Development ─────────────────────────────────────────────────────────────
dev-api:
	@cd backend && uvicorn main:app --reload --port 8000

dev-worker:
	@cd backend && celery -A app.core.celery_app worker --loglevel=info -c 4

dev-beat:
	@cd backend && celery -A app.core.celery_app beat --loglevel=info

dev-flower:
	@cd backend && celery -A app.core.celery_app flower

dev-frontend:
	@cd frontend && npm run dev

# ─── Worker scaling ───────────────────────────────────────────────────────────
worker-scale-up:
	docker compose up -d --scale worker-default=3 --scale worker-high=2

worker-scale-down:
	docker compose up -d --scale worker-default=1 --scale worker-high=1

# ─── Database ────────────────────────────────────────────────────────────────
db-migrate:
	@cd backend && alembic upgrade head

db-rollback:
	@cd backend && alembic downgrade -1

# ─── Testing ─────────────────────────────────────────────────────────────────
test:
	@cd backend && pytest tests/ -v

seed:
	@echo "Seeding demo jobs via API..."
	@python3 backend/scripts/seed.py

# ─── Cleanup ─────────────────────────────────────────────────────────────────
clean:
	docker compose down -v --remove-orphans
	docker system prune -f

# ─── Install (local dev) ──────────────────────────────────────────────────────
install:
	@echo "Installing backend dependencies..."
	@cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "✅ Ready. Run 'make up' to start with Docker or 'make dev-api' for local dev."

help:
	@echo ""
	@echo "  TaskForge — Distributed Job Processing"
	@echo ""
	@echo "  make up             Start all services (Docker)"
	@echo "  make down           Stop all services"
	@echo "  make build          Rebuild Docker images"
	@echo "  make logs           Tail all logs"
	@echo "  make dev-api        Run API locally (no Docker)"
	@echo "  make dev-worker     Run Celery worker locally"
	@echo "  make worker-scale-up   Scale workers up"
	@echo "  make test           Run backend tests"
	@echo "  make seed           Seed demo data"
	@echo "  make clean          Remove all containers and volumes"
	@echo ""
