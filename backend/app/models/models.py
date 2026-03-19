from sqlalchemy import create_engine, Column, String, DateTime, Integer, Float, Text, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
from app.core.config import settings
import enum
import uuid

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    STARTED = "STARTED"
    RETRY = "RETRY"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    REVOKED = "REVOKED"


class JobPriority(str, enum.Enum):
    HIGH = "high"
    DEFAULT = "default"
    LOW = "low"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=False)
    task_name = Column(String, nullable=False)
    queue = Column(String, default="default")
    priority = Column(Enum(JobPriority), default=JobPriority.DEFAULT)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    args = Column(JSON, default=list)
    kwargs = Column(JSON, default=dict)
    result = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    traceback = Column(Text, nullable=True)
    retries = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    progress = Column(Float, default=0.0)
    meta = Column(JSON, default=dict)
    scheduled_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "name": self.name,
            "task_name": self.task_name,
            "queue": self.queue,
            "priority": self.priority,
            "status": self.status,
            "args": self.args,
            "kwargs": self.kwargs,
            "result": self.result,
            "error": self.error,
            "retries": self.retries,
            "max_retries": self.max_retries,
            "progress": self.progress,
            "meta": self.meta,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Worker(Base):
    __tablename__ = "workers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hostname = Column(String, unique=True)
    status = Column(String, default="offline")
    queues = Column(JSON, default=list)
    concurrency = Column(Integer, default=4)
    active_tasks = Column(Integer, default=0)
    processed_tasks = Column(Integer, default=0)
    failed_tasks = Column(Integer, default=0)
    last_heartbeat = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class QueueStats(Base):
    __tablename__ = "queue_stats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    queue_name = Column(String, nullable=False)
    pending = Column(Integer, default=0)
    active = Column(Integer, default=0)
    completed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    avg_duration_ms = Column(Float, default=0.0)
    recorded_at = Column(DateTime, server_default=func.now())
