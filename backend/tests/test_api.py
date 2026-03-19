"""
Backend tests for TaskForge API.
Run with: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add backend root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_db():
    """Mock SQLAlchemy session."""
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.count.return_value = 0
    db.query.return_value.all.return_value = []
    return db


@pytest.fixture
def mock_celery():
    """Mock Celery send_task."""
    with patch("app.core.celery_app.celery_app.send_task") as mock:
        result = MagicMock()
        result.id = "test-task-id-12345"
        mock.return_value = result
        yield mock


# ─── Unit: Config ────────────────────────────────────────────────────────────

def test_settings_defaults():
    from app.core.config import settings
    assert settings.APP_NAME == "TaskForge"
    assert settings.DEFAULT_QUEUE == "default"
    assert settings.MAX_RETRIES == 3
    assert settings.WORKER_CONCURRENCY == 4


def test_queue_names():
    from app.core.config import settings
    assert settings.HIGH_PRIORITY_QUEUE == "high"
    assert settings.LOW_PRIORITY_QUEUE == "low"
    assert settings.EMAIL_QUEUE == "email"
    assert settings.ANALYTICS_QUEUE == "analytics"


# ─── Unit: Models ────────────────────────────────────────────────────────────

def test_job_model_defaults():
    from app.models.models import Job, JobStatus, JobPriority
    job = Job(name="test", task_name="my.task")
    assert job.status == JobStatus.PENDING
    assert job.priority == JobPriority.DEFAULT
    assert job.retries == 0
    assert job.progress == 0.0


def test_job_to_dict():
    from app.models.models import Job
    from datetime import datetime

    job = Job(
        id="abc-123",
        name="Test Job",
        task_name="app.workers.email_tasks.send_email",
        queue="email",
        retries=1,
        max_retries=3,
        progress=50.0,
    )
    job.created_at = None
    job.updated_at = None
    job.scheduled_at = None
    job.started_at = None
    job.completed_at = None

    d = job.to_dict()
    assert d["id"] == "abc-123"
    assert d["name"] == "Test Job"
    assert d["queue"] == "email"
    assert d["progress"] == 50.0
    assert d["retries"] == 1


# ─── Unit: Schemas ────────────────────────────────────────────────────────────

def test_job_create_schema_defaults():
    from app.schemas.schemas import JobCreate
    job = JobCreate(name="My Job", task_name="send_email")
    assert job.queue == "default"
    assert job.max_retries == 3
    assert job.args == []
    assert job.kwargs == {}


def test_job_create_schema_validation():
    from app.schemas.schemas import JobCreate
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        JobCreate()  # missing required fields


def test_bulk_job_create():
    from app.schemas.schemas import BulkJobCreate, JobCreate
    bulk = BulkJobCreate(jobs=[
        JobCreate(name="Job 1", task_name="send_email"),
        JobCreate(name="Job 2", task_name="generate_report", queue="analytics"),
    ])
    assert len(bulk.jobs) == 2
    assert bulk.jobs[0].name == "Job 1"
    assert bulk.jobs[1].queue == "analytics"


def test_dashboard_stats_schema():
    from app.schemas.schemas import DashboardStats, QueueInfo
    stats = DashboardStats(
        total_jobs=100,
        pending_jobs=10,
        active_jobs=5,
        completed_jobs=80,
        failed_jobs=5,
        success_rate=94.1,
        avg_duration_ms=450.0,
        workers_online=3,
        queues=[
            QueueInfo(name="default", pending=3, active=2, completed=80, failed=2, avg_duration_ms=300.0)
        ]
    )
    assert stats.total_jobs == 100
    assert stats.success_rate == 94.1
    assert len(stats.queues) == 1


# ─── Unit: Task Registry ──────────────────────────────────────────────────────

def test_task_registry_mapping():
    from app.api.jobs import TASK_REGISTRY
    assert "send_email" in TASK_REGISTRY
    assert "generate_report" in TASK_REGISTRY
    assert "process_csv" in TASK_REGISTRY
    assert "transcode_video" in TASK_REGISTRY
    assert TASK_REGISTRY["send_email"] == "app.workers.email_tasks.send_email"
    assert TASK_REGISTRY["generate_report"] == "app.workers.analytics_tasks.generate_report"


# ─── Integration: Health ──────────────────────────────────────────────────────

def test_health_endpoint():
    """Test health check without DB or Celery."""
    with patch("app.models.models.get_db"), \
         patch("app.core.celery_app.celery_app"):
        from main import app
        client = TestClient(app)
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"


def test_root_endpoint():
    with patch("app.models.models.get_db"), \
         patch("app.core.celery_app.celery_app"):
        from main import app
        client = TestClient(app)
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "TaskForge" in data["name"]
        assert data["status"] == "running"


# ─── Unit: Celery Config ─────────────────────────────────────────────────────

def test_celery_queues_defined():
    from app.core.celery_app import celery_app
    conf = celery_app.conf
    assert conf.task_track_started is True
    assert conf.task_acks_late is True
    assert conf.worker_prefetch_multiplier == 1


def test_beat_schedule():
    from app.core.celery_app import celery_app
    schedule = celery_app.conf.beat_schedule
    assert "cleanup-old-jobs" in schedule
    assert "generate-hourly-report" in schedule
    assert "health-check" in schedule
    assert schedule["health-check"]["schedule"] == 60.0


# ─── Unit: Priority handling ─────────────────────────────────────────────────

def test_job_priority_enum():
    from app.models.models import JobPriority
    assert JobPriority.HIGH == "high"
    assert JobPriority.DEFAULT == "default"
    assert JobPriority.LOW == "low"


def test_job_status_enum():
    from app.models.models import JobStatus
    assert JobStatus.PENDING == "PENDING"
    assert JobStatus.SUCCESS == "SUCCESS"
    assert JobStatus.FAILURE == "FAILURE"
