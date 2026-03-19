from app.core.celery_app import celery_app
import time
import random
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    name="app.workers.analytics_tasks.generate_report",
    queue="analytics",
    max_retries=2,
)
def generate_report(self, report_type: str, date_range: dict, filters: dict = {}):
    """Generate an analytics report."""
    steps = ["fetching_data", "aggregating", "computing_metrics", "formatting", "storing"]

    for i, step in enumerate(steps):
        self.update_state(
            state="STARTED",
            meta={"progress": int(((i + 1) / len(steps)) * 100), "step": step},
        )
        time.sleep(random.uniform(0.5, 2.0))

    row_count = random.randint(1000, 500000)
    return {
        "report_type": report_type,
        "date_range": date_range,
        "row_count": row_count,
        "file_url": f"https://storage.example.com/reports/{report_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
        "generated_at": datetime.utcnow().isoformat(),
    }


@celery_app.task(
    bind=True,
    name="app.workers.analytics_tasks.compute_aggregates",
    queue="analytics",
)
def compute_aggregates(self, dataset: str, dimensions: list, metrics: list):
    """Compute aggregate metrics for a dataset."""
    self.update_state(state="STARTED", meta={"progress": 20, "step": "loading"})
    time.sleep(random.uniform(1.0, 3.0))

    self.update_state(state="STARTED", meta={"progress": 60, "step": "computing"})
    time.sleep(random.uniform(2.0, 5.0))

    self.update_state(state="STARTED", meta={"progress": 90, "step": "writing"})
    time.sleep(0.5)

    return {
        "dataset": dataset,
        "dimensions": dimensions,
        "metrics": metrics,
        "result_count": random.randint(10, 10000),
    }


@celery_app.task(
    name="app.workers.analytics_tasks.generate_hourly_report",
    queue="analytics",
)
def generate_hourly_report():
    """Periodic task: Generate hourly system report."""
    time.sleep(random.uniform(0.5, 1.5))
    return {
        "report_type": "hourly_summary",
        "generated_at": datetime.utcnow().isoformat(),
        "metrics": {
            "jobs_processed": random.randint(100, 5000),
            "success_rate": round(random.uniform(0.92, 0.99), 4),
            "avg_duration_ms": round(random.uniform(200, 2000), 2),
        },
    }


@celery_app.task(
    bind=True,
    name="app.workers.analytics_tasks.track_event",
    queue="analytics",
)
def track_event(self, event_name: str, properties: dict, user_id: str = None):
    """Track a user or system event."""
    time.sleep(random.uniform(0.05, 0.2))
    return {
        "event_name": event_name,
        "user_id": user_id,
        "tracked": True,
        "event_id": f"evt_{random.randint(100000, 999999)}",
    }
