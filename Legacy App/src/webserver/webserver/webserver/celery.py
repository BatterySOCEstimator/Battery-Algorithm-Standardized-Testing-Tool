import os
from celery import Celery

# Set default Django settings module for Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webserver.settings')

app = Celery('webserver')

# Load task modules from all registered Django apps
app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()