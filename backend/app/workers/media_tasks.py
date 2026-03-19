# Media tasks are defined in app.workers.data_tasks
# This file re-exports them for Celery's autodiscovery via include list
from app.workers.data_tasks import transcode_video, generate_thumbnail

__all__ = ["transcode_video", "generate_thumbnail"]
