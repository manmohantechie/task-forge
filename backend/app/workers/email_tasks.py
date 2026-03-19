from app.core.celery_app import celery_app
from celery import Task
import time
import random
import logging

logger = logging.getLogger(__name__)


class BaseJobTask(Task):
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {self.name} [{task_id}] failed: {exc}")

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        logger.warning(f"Task {self.name} [{task_id}] retrying: {exc}")

    def on_success(self, retval, task_id, args, kwargs):
        logger.info(f"Task {self.name} [{task_id}] succeeded")


@celery_app.task(
    bind=True,
    base=BaseJobTask,
    name="app.workers.email_tasks.send_email",
    queue="email",
    max_retries=3,
    default_retry_delay=30,
)
def send_email(self, to: str, subject: str, body: str, template: str = "default"):
    """Send a single email."""
    logger.info(f"Sending email to {to}: {subject}")

    # Update progress
    self.update_state(state="STARTED", meta={"progress": 10, "step": "validating"})
    time.sleep(0.5)

    # Simulate email sending with occasional failures
    if random.random() < 0.05:
        raise self.retry(exc=Exception("SMTP connection timeout"), countdown=30)

    self.update_state(state="STARTED", meta={"progress": 50, "step": "sending"})
    time.sleep(random.uniform(0.3, 1.5))

    self.update_state(state="STARTED", meta={"progress": 90, "step": "confirming"})
    time.sleep(0.2)

    return {
        "to": to,
        "subject": subject,
        "template": template,
        "message_id": f"msg_{random.randint(10000, 99999)}",
        "delivered": True,
    }


@celery_app.task(
    bind=True,
    base=BaseJobTask,
    name="app.workers.email_tasks.send_bulk_email",
    queue="email",
    max_retries=2,
)
def send_bulk_email(self, recipients: list, subject: str, body: str):
    """Send bulk emails to a list of recipients."""
    total = len(recipients)
    sent = 0

    for i, recipient in enumerate(recipients):
        self.update_state(
            state="STARTED",
            meta={"progress": int((i / total) * 100), "sent": sent, "total": total},
        )
        time.sleep(random.uniform(0.05, 0.2))
        sent += 1

    return {"total_sent": sent, "total_recipients": total, "subject": subject}


@celery_app.task(
    bind=True,
    base=BaseJobTask,
    name="app.workers.email_tasks.send_notification",
    queue="email",
)
def send_notification(self, user_id: str, notification_type: str, payload: dict):
    """Send a push/in-app notification."""
    time.sleep(random.uniform(0.1, 0.5))
    return {
        "user_id": user_id,
        "type": notification_type,
        "delivered": True,
        "notification_id": f"notif_{random.randint(1000, 9999)}",
    }
