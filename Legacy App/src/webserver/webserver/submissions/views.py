from django.http import HttpRequest, HttpResponse
from django.shortcuts import render, redirect
from .models import Submission, SubmissionStatus
from .forms import FileUploadForm
from .tasks import run_submission
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.db.models import Exists, OuterRef
from django.shortcuts import render, get_object_or_404
from django.http import Http404
from zipfile import ZipFile

Users = get_user_model()

MODEL_TYPE_MAP={
    "Machine Learning": "ML",
    "Kalman Filter":    "KF",
    "Extended Kalman Filter": "EKF",
    "Other Kalman Filter": "OKF",
    "FNN": "FNN",
    "LSTM": "LSTM",
    "GRU": "GRU",
    "NARX": "NARX",
    "Transformer": "T",
    "Other Neural Network": "ONN",
    "Hybrid Model": "HM",
    "Coulomb Counter": "CC",
    "Not Specified":    "NA"
}
MODEL_TYPE_CHOICES=["Machine Learning", "Kalman Filter", "Extended Kalman Filter", "Other Kalman Filter", "FNN", "LSTM", "GRU", "NARX", "Transformer", "Other Neural Network", "Coulomb Counter", "Hybrid Model", "Not Specified"]

@login_required
def index(request: HttpRequest):
    if request.method == 'POST':
        form = FileUploadForm(request.POST, request.FILES)
        if form.is_valid():
            submission: Submission = form.save(commit=False)
            submission.status = SubmissionStatus.objects.get(name="pending")
            submission.submitted_at = timezone.now()
            submission.user = request.user
            submission.save()

            # once submission is successfulled stored in db,
            # create a task to execute it

            run_submission.delay(submission.id)
            return redirect('submissionsPage')
    else:
        form = FileUploadForm()
    return render(request, "submissions/index.html", {"form": form})

@login_required
def submissionsPage(request: HttpRequest):
    order_by = request.GET.get('order_by', "weighted_error")
    mt = request.GET.get('modeltype')

    submissions = Submission.objects.all().filter(user=request.user).order_by(order_by)

    if mt:
        submissions = submissions.filter(model_type=MODEL_TYPE_MAP[mt])

    return render(request, "submissions/submissions.html", {"submissions": submissions, "modeltypes": MODEL_TYPE_CHOICES})

def submission_detail(request, submission_id):
    submission = get_object_or_404(Submission, id=submission_id)
    figures = submission.figures.filter(file__endswith='.png')

    for figure in figures:
        figure.display_name = figure.file.name.split("/")[-1]

    if not request.user.is_authenticated:
        return render(request, "submissions/logged_out_submission.html", {'submission': submission, 'images': figures })

    return render(request, 'submissions/submission.html', {'submission': submission, 'images': figures })

def download_all_files(request, submission_id):
    submission = get_object_or_404(Submission, id=submission_id)

    zip_response = HttpResponse()

    figures = submission.figures.filter()

    zip = ZipFile(zip_response,"w")
    for figure in figures:
        zip.writestr(figure.file.name, figure.file.open("rb").read())

    zip_response['Content-Type'] = "application/zip"
    zip_response['Content-Disposition'] = f"attachment; filename=Submission-{submission.id}.zip"
    return zip_response