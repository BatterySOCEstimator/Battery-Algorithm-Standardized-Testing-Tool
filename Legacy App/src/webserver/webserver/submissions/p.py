import random
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from submissions.models import Submission, SubmissionStatus

User = get_user_model()  # Ensures compatibility with custom User models

def create_user(username):
    """Create and return a new User object."""
    return User.objects.create_user(username=username, password="password123", email=f"{username}@example.com")

def get_or_create_submission_status(status_name):
    """Retrieve or create a SubmissionStatus instance."""
    status, created = SubmissionStatus.objects.get_or_create(name=status_name)
    return status

def create_submission(user, model_name, status_name):
    """Create and return a new Submission object with randomized data."""
    # Get the SubmissionStatus instance
    status = get_or_create_submission_status(status_name)

    # Randomize submission and completion times within the last 30 days
    now = datetime.now()
    submitted_at = now - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23), minutes=random.randint(0, 59))
    completed_at = submitted_at + timedelta(minutes=random.randint(1, 30))
    
    # Base values (modify within 20% for randomness)
    base_values = {
        "weighted_error": 9.131,
        "all_cells": 0.249,
        "blind_cells": 0.233,
        "non_blinded_cells": 0.254,
        "charging": 82.883,
        "payload_80kg": 0.229,
        "payload_448kg_hvac": 0.233,
        "payload_448kg_no_hvac": 0.229,
        "payload_1000kg": 0.304,
        "standard_cycles": 0.142,
        "custom_cycles": 0.461,
        "n20c": 0.378,
        "n10c": 0.313,
        "zero_c": 0.256,
        "ten_c": 0.200,
        "twenty_five_c": 0.128,
        "forty_c": 0.098,
        "isoc_error": 6.532,
        "current_sensor_error": 0.249,
        "avg_rmse": 0.215,
        "avg_mae": 0.412,
        "avg_maxe": 0.412,
    }

    def modify_value(value):
        return round(value * random.uniform(0.8, 1.2), 3)

    submission = Submission(
        user=user,
        model_name=model_name,
        status=status,  # Assigning SubmissionStatus instance instead of string
        submitted_at=submitted_at,
        completed_at=completed_at,
        weighted_error=modify_value(base_values["weighted_error"]),
        t1_all_cells=modify_value(base_values["all_cells"]),
        t2_blind_cells=modify_value(base_values["blind_cells"]),
        t3_non_blinded_cells=modify_value(base_values["non_blinded_cells"]),
        t4_charging=modify_value(base_values["charging"]),
        t5_80kg_payload=modify_value(base_values["payload_80kg"]),
        t5_6_448kg_payload_with_HVAC=modify_value(base_values["payload_448kg_hvac"]),
        t5_6_448kg_payload=modify_value(base_values["payload_448kg_no_hvac"]),
        t5_1000kg_payload=modify_value(base_values["payload_1000kg"]),
        t7_standard_cycles=modify_value(base_values["standard_cycles"]),
        t8_custom_cycles=modify_value(base_values["custom_cycles"]),
        t9_n20C=modify_value(base_values["n20c"]),
        t9_n10C=modify_value(base_values["n10c"]),
        t9_0C=modify_value(base_values["zero_c"]),
        t9_10C=modify_value(base_values["ten_c"]),
        t9_25C=modify_value(base_values["twenty_five_c"]),
        t9_40C=modify_value(base_values["forty_c"]),
        t10_iSOC_error=modify_value(base_values["isoc_error"]),
        t11_current_sensor_error=modify_value(base_values["current_sensor_error"]),
        all_drive_cycles_average_RMSE=modify_value(base_values["avg_rmse"]),
        all_drive_cycles_average_MAE=modify_value(base_values["avg_mae"]),
        all_drive_cycles_average_MAXE=modify_value(base_values["avg_maxe"]),
    )
    
    submission.save()
    print(f"Created submission for {user.username} with model {model_name} and status {status.name}")

def p():
    # Create users
    user1 = create_user("user1")
    user2 = create_user("user2")
    
    statuses = ["completed"]  # Ensure they match actual DB entries
    
    # Create 10 submissions, 5 for each user
    for i in range(5):
        create_submission(user1, f"test model {i+1}", random.choice(statuses))
        create_submission(user2, f"test model {i+6}", random.choice(statuses))

if __name__ == "__main__":
    p()