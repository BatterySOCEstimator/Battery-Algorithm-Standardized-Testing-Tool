from django.apps import AppConfig


class SubmissionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'submissions'

    # for dev purposes only. look into
    # how we will preload data for production
    # def ready(self):
    #     from .models import SubmissionStatus

    #     initial_statuses = [
    #         {"name": "pending", "description": "placeholder"},
    #         {"name": "failed", "description": "placeholder"},
    #         {"name": "completed", "description": "placeholder"},
    #         {"name": "started", "description": "placeholder"},
    #     ]

    #     for status in initial_statuses:
    #         SubmissionStatus.objects.get_or_create(name=status["name"], description=status["description"])
