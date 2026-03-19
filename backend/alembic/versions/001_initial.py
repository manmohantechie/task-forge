"""Initial schema

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'jobs',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('task_id', sa.String(), unique=True, nullable=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('task_name', sa.String(), nullable=False),
        sa.Column('queue', sa.String(), default='default'),
        sa.Column('priority', sa.Enum('high', 'default', 'low', name='jobpriority'), default='default'),
        sa.Column('status', sa.Enum('PENDING', 'STARTED', 'RETRY', 'SUCCESS', 'FAILURE', 'REVOKED', name='jobstatus'), default='PENDING'),
        sa.Column('args', sa.JSON(), default=list),
        sa.Column('kwargs', sa.JSON(), default=dict),
        sa.Column('result', sa.JSON(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('traceback', sa.Text(), nullable=True),
        sa.Column('retries', sa.Integer(), default=0),
        sa.Column('max_retries', sa.Integer(), default=3),
        sa.Column('progress', sa.Float(), default=0.0),
        sa.Column('meta', sa.JSON(), default=dict),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'workers',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('hostname', sa.String(), unique=True),
        sa.Column('status', sa.String(), default='offline'),
        sa.Column('queues', sa.JSON(), default=list),
        sa.Column('concurrency', sa.Integer(), default=4),
        sa.Column('active_tasks', sa.Integer(), default=0),
        sa.Column('processed_tasks', sa.Integer(), default=0),
        sa.Column('failed_tasks', sa.Integer(), default=0),
        sa.Column('last_heartbeat', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'queue_stats',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('queue_name', sa.String(), nullable=False),
        sa.Column('pending', sa.Integer(), default=0),
        sa.Column('active', sa.Integer(), default=0),
        sa.Column('completed', sa.Integer(), default=0),
        sa.Column('failed', sa.Integer(), default=0),
        sa.Column('avg_duration_ms', sa.Float(), default=0.0),
        sa.Column('recorded_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_index('ix_jobs_status', 'jobs', ['status'])
    op.create_index('ix_jobs_queue', 'jobs', ['queue'])
    op.create_index('ix_jobs_created_at', 'jobs', ['created_at'])


def downgrade() -> None:
    op.drop_table('queue_stats')
    op.drop_table('workers')
    op.drop_index('ix_jobs_created_at', 'jobs')
    op.drop_index('ix_jobs_queue', 'jobs')
    op.drop_index('ix_jobs_status', 'jobs')
    op.drop_table('jobs')
    op.execute("DROP TYPE IF EXISTS jobstatus")
    op.execute("DROP TYPE IF EXISTS jobpriority")
