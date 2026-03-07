from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path("register", views.register, name='register'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/home'), name='logout'),
    path('verify-email/<uidb64>/<token>/', views.verify_email, name='verify-email'),
    path('email-verified/', views.email_verified, name='email_verified'),
]