from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure, task_retry
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

celery_app = Celery(
    "taskforge",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.email_tasks",
        "app.workers.analytics_tasks",
        "app.workers.data_tasks",
        "app.workers.media_tasks",
    ],
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Task behavior
    task_track_started=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,

    # Result expiry
    result_expires=86400,  # 24 hours

    # Retry policy
    task_max_retries=settings.MAX_RETRIES,

    # Queue routing
    task_default_queue=settings.DEFAULT_QUEUE,
    task_queues={
        settings.HIGH_PRIORITY_QUEUE: {"exchange": settings.HIGH_PRIORITY_QUEUE, "routing_key": "high"},
        settings.DEFAULT_QUEUE: {"exchange": settings.DEFAULT_QUEUE, "routing_key": "default"},
        settings.LOW_PRIORITY_QUEUE: {"exchange": settings.LOW_PRIORITY_QUEUE, "routing_key": "low"},
        settings.EMAIL_QUEUE: {"exchange": settings.EMAIL_QUEUE, "routing_key": "email"},
        settings.ANALYTICS_QUEUE: {"exchange": settings.ANALYTICS_QUEUE, "routing_key": "analytics"},
    },
    task_routes={
        "app.workers.email_tasks.*": {"queue": settings.EMAIL_QUEUE},
        "app.workers.analytics_tasks.*": {"queue": settings.ANALYTICS_QUEUE},
    },

    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,

    # Beat schedule for periodic tasks
    beat_schedule={
        "cleanup-old-jobs": {
            "task": "app.workers.data_tasks.cleanup_old_jobs",
            "schedule": 3600.0,  # every hour
        },
        "generate-hourly-report": {
            "task": "app.workers.analytics_tasks.generate_hourly_report",
            "schedule": 3600.0,
        },
        "health-check": {
            "task": "app.workers.data_tasks.system_health_check",
            "schedule": 60.0,  # every minute
        },
    },
)


@task_prerun.connect
def task_prerun_handler(task_id, task, args, kwargs, **kw):
    logger.info(f"Task starting: {task.name} [{task_id}]")


@task_postrun.connect
def task_postrun_handler(task_id, task, args, kwargs, retval, state, **kw):
    logger.info(f"Task completed: {task.name} [{task_id}] state={state}")


@task_failure.connect
def task_failure_handler(task_id, exception, traceback, einfo, **kw):
    logger.error(f"Task failed [{task_id}]: {exception}")


@task_retry.connect
def task_retry_handler(request, reason, einfo, **kw):
    logger.warning(f"Task retrying [{request.id}]: {reason}")
