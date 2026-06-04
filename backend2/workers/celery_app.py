from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "openscience",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

celery_app.conf.beat_schedule = {
    "drain-outbox-every-10s": {
        "task": "app.workers.tasks.drain_outbox",
        "schedule": 10.0,
    },
    "reconcile-pending-every-5min": {
        "task": "app.workers.tasks.reconcile_pending",
        "schedule": crontab(minute="*/5"),
    },
}
