from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from submissions.models import Submission, SubmissionStatus

User = get_user_model()

class LeaderboardViewTest(TestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", password="password")
        self.user2 = User.objects.create_user(username="user2", password="password")
        
        self.status = SubmissionStatus.objects.create(name="completed", description="Completed submission")
        
        now = timezone.now()

        self.submission1 = Submission.objects.create(
            status=self.status,
            file=SimpleUploadedFile("file1.txt", b"dummy content"),
            model_name="Model 1",
            user=self.user1,
            submitted_at=now,
            completed_at=now + timezone.timedelta(days=6),
            weighted_error=1.5
        )
        
        self.submission2 = Submission.objects.create(
            status=self.status,
            file=SimpleUploadedFile("file2.txt", b"dummy content"),
            model_name="Model 2",
            user=self.user2,
            submitted_at=now + timezone.timedelta(days=2),
            completed_at=now + timezone.timedelta(days=5),
            weighted_error=2.5
        )
        
        self.submission3 = Submission.objects.create(
            status=self.status,
            file=SimpleUploadedFile("file3.txt", b"dummy content"),
            model_name="Model 3",
            user=self.user1,
            submitted_at=now + timezone.timedelta(days=3),
            completed_at=now + timezone.timedelta(days=4),
            weighted_error=0.5
        )

    #tests leaderboard sorting
    def test_leaderboard_sorting_default(self):
        response = self.client.get(reverse('leaderboard'))
        submissions = response.context['submissions']
        
        self.assertEqual(submissions[0], self.submission3)
        self.assertEqual(submissions[1], self.submission1)
        self.assertEqual(submissions[2], self.submission2)

    def test_leaderboard_sorting_by_submitted_at(self):
        response = self.client.get(reverse('leaderboard') + '?order_by=submitted_at')
        submissions = response.context['submissions']
        
        self.assertEqual(submissions[0], self.submission1)
        self.assertEqual(submissions[1], self.submission2)
        self.assertEqual(submissions[2], self.submission3)

    def test_leaderboard_sorting_by_completed_at(self):
        response = self.client.get(reverse('leaderboard') + '?order_by=completed_at')
        submissions = response.context['submissions']
        
        self.assertEqual(submissions[0], self.submission3)
        self.assertEqual(submissions[1], self.submission2)
        self.assertEqual(submissions[2], self.submission1)
