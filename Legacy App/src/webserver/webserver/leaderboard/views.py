import csv
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.db.models.functions import Length
from django.db.models import Exists, OuterRef

from submissions.models import Submission
from django.contrib.auth import get_user_model


Users = get_user_model()
# Create your views here.

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

def leaderboard(request: HttpRequest):

    user_id = request.GET.get('author')
    mt = request.GET.get('modeltype')
    academic_affiliation = request.GET.get('academic_affiliation')

    order_by = request.GET.get('order_by', "weighted_error")

    # get all users with at least 1 submission
    users = Users.objects.filter(Exists(Submission.objects.filter(user=OuterRef("id"))))

    submissions = Submission.objects.filter(status__name="completed", visibility="public").order_by(order_by)

    if user_id:
        submissions = submissions.filter(user=user_id)

    if mt:
        submissions = submissions.filter(model_type=MODEL_TYPE_MAP[mt])

    if academic_affiliation:
        submissions = submissions.filter(user__academic_affiliation=academic_affiliation)
        
    if not request.user.is_authenticated:
        return render(request, "leaderboard/logged_out_leaderboard.html", {"submissions": submissions, "authors": users, "modeltypes": MODEL_TYPE_CHOICES})
    
    return render(request, "leaderboard/leaderboard.html", {"submissions": submissions, "authors": users, "modeltypes": MODEL_TYPE_CHOICES})

def export_leaderboard_csv(request: HttpRequest):
    user_id = request.GET.get('author')
    mt = request.GET.get('modeltype')
    order_by = request.GET.get('order_by', "weighted_error")

    if not user_id:
        user_id = None
    if not mt:
        mt = None
    if not order_by:
        order_by = "weighted_error"

    submissions = Submission.objects.filter(status__name="completed", visibility="public").order_by(order_by)

    if user_id:
        submissions = submissions.filter(user=user_id)

    if mt:
        submissions = submissions.filter(model_type=MODEL_TYPE_MAP[mt])

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="leaderboard.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Ranking', 'Submission ID', 'Author', 'Affiliation', 'Model Name', 'Model Type', 
        'Weighted Error', 'All Cells', 'Blind Cells', 'Non-Blinded Cells', 'Charging', 
        '80kg Payload', '448kg Payload with HVAC', '448kg Payload', '1000kg Payload',
        'Standard Cycles', 'Custom Cycles', 'n20C', 'n10C', '0C', '10C', '25C', '40C',
        'iSOC Error', 'Current Sensor Error', 'All Drive Cycles Average RMSE', 
        'All Drive Cycles Average MAE', 'All Drive Cycles Average MAXE'
    ])

    for idx, submission in enumerate(submissions):
        writer.writerow([
            idx + 1,
            submission.id, 
            submission.user.username, 
            submission.user.academic_affiliation, 
            submission.model_name, 
            submission.get_model_type_display(),
            submission.weighted_error,
            submission.t1_all_cells,
            submission.t2_blind_cells,
            submission.t3_non_blinded_cells,
            submission.t4_charging,
            submission.t5_80kg_payload,
            submission.t5_6_448kg_payload_with_HVAC,
            submission.t5_6_448kg_payload,
            submission.t5_1000kg_payload,
            submission.t7_standard_cycles,
            submission.t8_custom_cycles,
            submission.t9_n20C,
            submission.t9_n10C,
            submission.t9_0C,
            submission.t9_10C,
            submission.t9_25C,
            submission.t9_40C,
            submission.t10_iSOC_error,
            submission.t11_current_sensor_error,
            submission.all_drive_cycles_average_RMSE,
            submission.all_drive_cycles_average_MAE,
            submission.all_drive_cycles_average_MAXE
        ])

    return response