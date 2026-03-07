from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("help/", views.help, name="help"),
    path("help/valid-files/", views.valid_files, name="valid_files"),
    path("help/code-ownership/", views.ownership, name="code_ownership"),
    path("help/submission-process/", views.sub_process, name="submission-process"),
    path("help/public-private-submission/", views.private, name="public-private-submission"),
    path("help/account-verification/", views.verification, name="account-verification"),
    path("help/forgot-username/", views.forgot_username, name="forgot-username"),
    path("help/forgot-password/", views.forgot_password, name="forgot-password"),
    path("help/filtering-leaderboard/", views.filtering, name="filtering"),
    path("help/filtering-submissions/", views.filtering_submissions, name="filtering"),
    path("help/sorting/", views.sorting, name="sorting"),
    path("help/export-csv/", views.export, name="export-csv"),
    path("help/leaderboard-views/", views.detailed, name="leaderboard-views"),
    path("help/submission-statuses/", views.statuses, name="submission-statuses"),
    path("help/visibility/", views.visibility, name="visibility"),
]