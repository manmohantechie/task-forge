from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from celery.result import AsyncResult
from app.models.models import get_db, Job, JobStatus
from app.schemas.schemas import JobCreate, JobResponse, JobList, BulkJobCreate, JobRetryRequest
from app.core.celery_app import celery_app
from app.core.config import settings
import uuid
import random
from datetime import datetime

router = APIRouter(prefix="/jobs", tags=["jobs"])

# Map task names to actual Celery tasks
TASK_REGISTRY = {
    "send_email": "app.workers.email_tasks.send_email",
    "send_bulk_email": "app.workers.email_tasks.send_bulk_email",
    "send_notification": "app.workers.email_tasks.send_notification",
    "generate_report": "app.workers.analytics_tasks.generate_report",
    "compute_aggregates": "app.workers.analytics_tasks.compute_aggregates",
    "track_event": "app.workers.analytics_tasks.track_event",
    "process_csv": "app.workers.data_tasks.process_csv",
    "sync_database": "app.workers.data_tasks.sync_database",
    "export_data": "app.workers.data_tasks.export_data",
    "transcode_video": "app.workers.data_tasks.transcode_video",
    "generate_thumbnail": "app.workers.data_tasks.generate_thumbnail",
}


@router.post("/", response_model=JobResponse, status_code=201)
def create_job(job_data: JobCreate, db: Session = Depends(get_db)):
    """Dispatch a new background job."""
    task_name = TASK_REGISTRY.get(job_data.task_name, job_data.task_name)

    # Create DB record
    job = Job(
        id=str(uuid.uuid4()),
        name=job_data.name,
        task_name=task_name,
        queue=job_data.queue,
        priority=job_data.priority,
        args=job_data.args,
        kwargs=job_data.kwargs,
        max_retries=job_data.max_retries,
        scheduled_at=job_data.scheduled_at,
        meta=job_data.meta,
        status=JobStatus.PENDING,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Dispatch to Celery
    try:
        if job_data.scheduled_at:
            result = celery_app.send_task(
                task_name,
                args=job_data.args,
                kwargs=job_data.kwargs,
                queue=job_data.queue,
                eta=job_data.scheduled_at,
            )
        else:
            result = celery_app.send_task(
                task_name,
                args=job_data.args,
                kwargs=job_data.kwargs,
                queue=job_data.queue,
            )

        job.task_id = result.id
        db.commit()
        db.refresh(job)
    except Exception as e:
        job.status = JobStatus.FAILURE
        job.error = str(e)
        db.commit()
        db.refresh(job)

    return JobResponse(**job.to_dict())


@router.get("/", response_model=JobList)
def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    queue: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all jobs with filtering and pagination."""
    query = db.query(Job)

    if status:
        query = query.filter(Job.status == status)
    if queue:
        query = query.filter(Job.queue == queue)
    if search:
        query = query.filter(Job.name.ilike(f"%{search}%"))

    total = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return JobList(
        items=[JobResponse(**j.to_dict()) for j in jobs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    """Get a specific job with live status."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Sync status from Celery if task_id exists
    if job.task_id:
        result = AsyncResult(job.task_id, app=celery_app)
        job.status = result.state
        if result.state == "SUCCESS":
            job.result = result.result
            job.progress = 100.0
            if not job.completed_at:
                job.completed_at = datetime.utcnow()
        elif result.state == "FAILURE":
            job.error = str(result.result)
            if not job.completed_at:
                job.completed_at = datetime.utcnow()
        elif result.state == "STARTED":
            meta = result.info or {}
            job.progress = meta.get("progress", 0)
            if not job.started_at:
                job.started_at = datetime.utcnow()

        db.commit()
        db.refresh(job)

    return JobResponse(**job.to_dict())


@router.delete("/{job_id}", status_code=204)
def revoke_job(job_id: str, terminate: bool = False, db: Session = Depends(get_db)):
    """Revoke/cancel a job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.task_id:
        celery_app.control.revoke(job.task_id, terminate=terminate)

    job.status = JobStatus.REVOKED
    job.completed_at = datetime.utcnow()
    db.commit()


@router.post("/{job_id}/retry", response_model=JobResponse)
def retry_job(job_id: str, db: Session = Depends(get_db)):
    """Re-dispatch a failed job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    result = celery_app.send_task(
        job.task_name,
        args=job.args,
        kwargs=job.kwargs,
        queue=job.queue,
    )

    job.task_id = result.id
    job.status = JobStatus.PENDING
    job.error = None
    job.retries += 1
    job.progress = 0.0
    job.completed_at = None
    db.commit()
    db.refresh(job)

    return JobResponse(**job.to_dict())


@router.post("/bulk/create", response_model=List[JobResponse], status_code=201)
def create_bulk_jobs(bulk: BulkJobCreate, db: Session = Depends(get_db)):
    """Dispatch multiple jobs at once."""
    responses = []
    for job_data in bulk.jobs:
        task_name = TASK_REGISTRY.get(job_data.task_name, job_data.task_name)
        job = Job(
            id=str(uuid.uuid4()),
            name=job_data.name,
            task_name=task_name,
            queue=job_data.queue,
            priority=job_data.priority,
            args=job_data.args,
            kwargs=job_data.kwargs,
            max_retries=job_data.max_retries,
            meta=job_data.meta,
            status=JobStatus.PENDING,
        )
        db.add(job)
        db.flush()

        try:
            result = celery_app.send_task(task_name, args=job_data.args, kwargs=job_data.kwargs, queue=job_data.queue)
            job.task_id = result.id
        except Exception as e:
            job.status = JobStatus.FAILURE
            job.error = str(e)

        responses.append(JobResponse(**job.to_dict()))

    db.commit()
    return responses
