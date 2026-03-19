from app.core.celery_app import celery_app
import time
import random
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


# ─── Data Tasks ────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.workers.data_tasks.process_csv",
    queue="default",
    max_retries=3,
)
def process_csv(self, file_path: str, options: dict = {}):
    """Process a large CSV file."""
    total_rows = random.randint(10000, 1000000)
    batch_size = 1000
    processed = 0

    while processed < total_rows:
        batch = min(batch_size, total_rows - processed)
        processed += batch
        progress = int((processed / total_rows) * 100)
        self.update_state(
            state="STARTED",
            meta={"progress": progress, "processed_rows": processed, "total_rows": total_rows},
        )
        time.sleep(random.uniform(0.01, 0.05))

    return {
        "file_path": file_path,
        "total_rows": total_rows,
        "processed_rows": processed,
        "errors": random.randint(0, 10),
    }


@celery_app.task(
    bind=True,
    name="app.workers.data_tasks.sync_database",
    queue="default",
)
def sync_database(self, source: str, destination: str, tables: list):
    """Sync data between databases."""
    for i, table in enumerate(tables):
        self.update_state(
            state="STARTED",
            meta={"progress": int(((i + 1) / len(tables)) * 100), "current_table": table},
        )
        time.sleep(random.uniform(0.5, 2.0))

    return {
        "source": source,
        "destination": destination,
        "tables_synced": len(tables),
        "synced_at": datetime.utcnow().isoformat(),
    }


@celery_app.task(
    name="app.workers.data_tasks.cleanup_old_jobs",
    queue="default",
)
def cleanup_old_jobs():
    """Periodic task: Clean up jobs older than 7 days."""
    cutoff = datetime.utcnow() - timedelta(days=7)
    cleaned = random.randint(0, 500)
    logger.info(f"Cleaned {cleaned} old job records before {cutoff}")
    return {"cleaned_count": cleaned, "cutoff": cutoff.isoformat()}


@celery_app.task(
    name="app.workers.data_tasks.system_health_check",
    queue="default",
)
def system_health_check():
    """Periodic task: System health check."""
    return {
        "status": "healthy",
        "checked_at": datetime.utcnow().isoformat(),
        "components": {
            "redis": "ok",
            "database": "ok",
            "workers": "ok",
        },
    }


@celery_app.task(
    bind=True,
    name="app.workers.data_tasks.export_data",
    queue="low",
)
def export_data(self, query: dict, format: str = "csv", destination: str = "s3"):
    """Export data to external storage."""
    steps = ["querying", "transforming", "compressing", "uploading"]
    for i, step in enumerate(steps):
        self.update_state(
            state="STARTED",
            meta={"progress": int(((i + 1) / len(steps)) * 100), "step": step},
        )
        time.sleep(random.uniform(0.5, 3.0))

    size_mb = round(random.uniform(1.0, 500.0), 2)
    return {
        "format": format,
        "destination": destination,
        "file_size_mb": size_mb,
        "file_url": f"https://s3.example.com/exports/export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{format}",
    }


# ─── Media Tasks ────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.workers.media_tasks.transcode_video",
    queue="default",
    max_retries=2,
)
def transcode_video(self, input_url: str, output_format: str, quality: str = "720p"):
    """Transcode a video to a different format/quality."""
    total_duration = random.randint(60, 3600)  # seconds
    processed = 0

    while processed < total_duration:
        chunk = random.randint(5, 30)
        processed = min(processed + chunk, total_duration)
        self.update_state(
            state="STARTED",
            meta={
                "progress": int((processed / total_duration) * 100),
                "processed_seconds": processed,
                "total_seconds": total_duration,
                "fps": round(random.uniform(24, 60), 1),
            },
        )
        time.sleep(random.uniform(0.1, 0.5))

    return {
        "input_url": input_url,
        "output_format": output_format,
        "quality": quality,
        "output_url": f"https://cdn.example.com/videos/transcoded_{random.randint(1000,9999)}.{output_format}",
        "duration_seconds": total_duration,
    }


@celery_app.task(
    bind=True,
    name="app.workers.media_tasks.generate_thumbnail",
    queue="high",
)
def generate_thumbnail(self, image_url: str, sizes: list):
    """Generate thumbnails in multiple sizes."""
    for i, size in enumerate(sizes):
        self.update_state(
            state="STARTED",
            meta={"progress": int(((i + 1) / len(sizes)) * 100), "current_size": size},
        )
        time.sleep(random.uniform(0.1, 0.5))

    return {
        "source": image_url,
        "thumbnails": [
            {"size": s, "url": f"https://cdn.example.com/thumbs/img_{random.randint(100,999)}_{s}.webp"}
            for s in sizes
        ],
    }
