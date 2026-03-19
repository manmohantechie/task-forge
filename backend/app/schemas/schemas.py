from pydantic import BaseModel, Field
from typing import Any, Optional, List, Dict
from datetime import datetime
from app.models.models import JobStatus, JobPriority


class JobCreate(BaseModel):
    name: str
    task_name: str
    queue: str = "default"
    priority: JobPriority = JobPriority.DEFAULT
    args: List[Any] = []
    kwargs: Dict[str, Any] = {}
    max_retries: int = 3
    scheduled_at: Optional[datetime] = None
    meta: Dict[str, Any] = {}


class JobResponse(BaseModel):
    id: str
    task_id: Optional[str]
    name: str
    task_name: str
    queue: str
    priority: str
    status: str
    args: List[Any]
    kwargs: Dict[str, Any]
    result: Optional[Any]
    error: Optional[str]
    retries: int
    max_retries: int
    progress: float
    meta: Dict[str, Any]
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class JobList(BaseModel):
    items: List[JobResponse]
    total: int
    page: int
    page_size: int


class WorkerResponse(BaseModel):
    id: str
    hostname: str
    status: str
    queues: List[str]
    concurrency: int
    active_tasks: int
    processed_tasks: int
    failed_tasks: int
    last_heartbeat: Optional[datetime]

    class Config:
        from_attributes = True


class QueueInfo(BaseModel):
    name: str
    pending: int
    active: int
    completed: int
    failed: int
    avg_duration_ms: float


class DashboardStats(BaseModel):
    total_jobs: int
    pending_jobs: int
    active_jobs: int
    completed_jobs: int
    failed_jobs: int
    success_rate: float
    avg_duration_ms: float
    workers_online: int
    queues: List[QueueInfo]


class BulkJobCreate(BaseModel):
    jobs: List[JobCreate]


class JobRetryRequest(BaseModel):
    job_ids: List[str]
