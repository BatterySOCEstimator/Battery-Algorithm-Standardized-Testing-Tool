from django.urls import path

from . import views
from .views import export_leaderboard_csv


urlpatterns = [
    path("", views.leaderboard, name="leaderboard"),
    path("export-leaderboard/", export_leaderboard_csv, name="export_leaderboard_csv"),
]