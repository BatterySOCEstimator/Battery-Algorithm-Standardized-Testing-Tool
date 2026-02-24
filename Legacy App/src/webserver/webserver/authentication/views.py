from django.http import HttpResponse, HttpRequest
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import get_user_model
from authentication.models import CustomUser
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.urls import reverse
from django.conf import settings
from django.utils.http import urlsafe_base64_decode

User = get_user_model()

def register(request: HttpRequest):
    if request.method == 'POST':
        # Get form data from the POST request
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        academic_affiliation = request.POST.get('academic_affiliation', '')

        # Check if the username already exists
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists!")
            return render(request, 'registration/register.html')
        
        # Check if the email already exists
        if User.objects.filter(email=email).exists():
            messages.error(request, "Email is already associated with an account!")
            return render(request, 'registration/register.html')

        # Create user and save to the database
        user = CustomUser.objects.create_user(username, email, password)
        
        # Update additional fields
        user.first_name = first_name
        user.last_name = last_name
        user.academic_affiliation = academic_affiliation
        user.is_active = False
        user.save()
        
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verification_link = f"http://{settings.SITE_DOMAIN}{reverse('verify-email', kwargs={'uidb64': uid, 'token': token})}"
        
        send_mail(
            subject="Verify Your Email",
            message=f"Click the link to verify your email: {verification_link}",
            from_email=None, 
            recipient_list=[email], 
            fail_silently=False,
        )

        messages.success(request, "Registration successful! Please check your email to verify your account.")
        return redirect('/authentication/register')  # Redirect to the home page after successful registration

    return render(request, 'registration/register.html')

def verify_email(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user and default_token_generator.check_token(user, token):
        user.is_active = True  # Activate the user or perform any action
        user.save()
        return redirect('email_verified')  # Redirect after successful verification
    else:
        return render(request, 'registration/email_verification_failed.html')

def email_verified(request):
    return render(request, 'registration/email_verified.html')