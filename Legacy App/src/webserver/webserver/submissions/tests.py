from django.test import TestCase
from submissions.models import SubmissionStatus, Submission, Figure
from submissions.forms import FileUploadForm
from django.urls import reverse
from django.core.exceptions import ValidationError
from django.db import transaction


from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils.timezone import now
from django.utils import timezone
from django.contrib.auth import get_user_model

#tests database integrity
class SubmissionStatusModelTest(TestCase):
    def test_create_submission_status(self):
        status = SubmissionStatus.objects.create(name="Pending", description="Waiting for review")
        self.assertEqual(status.name, "Pending")

User = get_user_model()

class SubmissionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="securepassword")
        self.status = SubmissionStatus.objects.create(name="Pending", description="Waiting for review")

    def test_submission_creation(self):
        test_file = SimpleUploadedFile("test_file.txt", b"dummy content")
        
        submission = Submission.objects.create(
            status=self.status,
            file=test_file,
            submitted_at=now(),
            completed_at=None,
            user=self.user,
            model_name="Test Model",
            weighted_error=0.123
        )

        self.assertEqual(submission.status.name, "Pending")
        self.assertEqual(submission.user.username, "testuser")
        self.assertEqual(submission.model_name, "Test Model")
        self.assertEqual(float(submission.weighted_error), 0.123)
        self.assertIsNotNone(submission.submitted_at)
        self.assertIsNone(submission.completed_at)

    def test_invalid_submission_creation(self):
        test_file = SimpleUploadedFile("test_file.txt", b"dummy content")
        with self.assertRaises(ValidationError):
            with transaction.atomic():
                submission = Submission.objects.create(
                    status=self.status,
                    file=test_file,
                    submitted_at=now(),
                    completed_at=None,
                    user=self.user,
                    model_name="Test Model",
                    weighted_error="error"
                )
                submission.save()

        self.assertEqual(Submission.objects.count(), 0)

class FigureModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="securepassword")
        self.status = SubmissionStatus.objects.create(name="Pending", description="Waiting for review")
        self.submission = Submission.objects.create(
            status=self.status,
            file=SimpleUploadedFile("test_file.txt", b"dummy content"),
            user=self.user,
            model_name="Test Model"
        )

    def test_figure_creation(self):
        """Test creating a Figure linked to a Submission"""
        fig_file = SimpleUploadedFile("test_figure.png", b"fake image content")
        
        figure = Figure.objects.create(
            submission=self.submission,
            name="Figure 1",
            file=fig_file
        )

        self.assertEqual(figure.submission, self.submission)
        self.assertEqual(figure.name, "Figure 1")
        self.assertIn("matlab_figures/", figure.file.name) 

#tests file submission
class FileUploadFormTest(TestCase):
    def test_valid_form(self):
        test_file = SimpleUploadedFile("test.m", b"dummy content")

        form_data = {"model_name": "Machine Learning"}
        form_files = {"file": test_file}

        form = FileUploadForm(data=form_data, files=form_files)
        self.assertTrue(form.is_valid())
    
    def test_missing_file(self):
        form_data = {"model_name": "Test Model"}
        form = FileUploadForm(data=form_data, files={})  
        self.assertFalse(form.is_valid())

    def test_missing_model_name(self):
        test_file = SimpleUploadedFile("test.txt", b"dummy content")

        form_files = {"file": test_file}
        form = FileUploadForm(data={}, files=form_files)  

        self.assertFalse(form.is_valid())

    def test_invalid_file_type(self):
        test_file = SimpleUploadedFile("test.exe", b"malicious content")

        form_data = {"model_name": "Test Model"}
        form_files = {"file": test_file}

        form = FileUploadForm(data=form_data, files=form_files)
        self.assertFalse(form.is_valid())

#tests data segregation
class SubmissionDetailViewTest(TestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", password="password")
        self.user2 = User.objects.create_user(username="user2", password="password")
        
        self.status = SubmissionStatus.objects.create(name="Pending", description="Waiting for review")
        
        now = timezone.now()
        self.submission1 = Submission.objects.create(
            status=self.status,
            file=SimpleUploadedFile("file.txt", b"dummy content"),
            model_name="Model 1",
            user=self.user1,
            submitted_at=now,
            completed_at=now + timezone.timedelta(days=1)
        )
        
        self.submission2 = Submission.objects.create(
            status=self.status,
            file=SimpleUploadedFile("file.txt", b"dummy content"),
            model_name="Model 2",
            user=self.user2,
            submitted_at=now,
            completed_at=now + timezone.timedelta(days=1)
        )

    def test_submission_detail_with_authorized_user(self):
        self.client.login(username='user1', password='password')
        
        response = self.client.get(reverse('submission', args=[self.submission1.id]))
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Model 1")  # Ensure the submission data is loaded

    def test_submission_detail_with_unauthorized_user(self):
        self.client.login(username='user2', password='password')
        
        response = self.client.get(reverse('submission', args=[self.submission1.id]))
        
        self.assertEqual(response.status_code, 404)