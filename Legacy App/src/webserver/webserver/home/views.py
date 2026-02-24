from django.http import HttpRequest
from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.contrib.auth import logout

User = get_user_model()

def home(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home.html', {"user": user})
    else:
        return render(request, 'intro.html')
    
def help(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-help.html', {"user": user})
    else:
        return render(request, 'intro-help.html')
    
def valid_files(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-valid_files.html', {"user": user})
    else:
        return render(request, 'intro-valid_files.html')
    
def ownership(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-ownership.html', {"user": user})
    else:
        return render(request, 'intro-ownership.html')
    
def private(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-private-submission.html', {"user": user})
    else:
        return render(request, 'intro-private-submission.html')
    
def sub_process(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-sub-process.html', {"user": user})
    else:
        return render(request, 'intro-sub-process.html')
    
def verification(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-verification.html', {"user": user})
    else:
        return render(request, 'intro-verification.html')
    
def forgot_password(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-forgot-password.html', {"user": user})
    else:
        return render(request, 'intro-forgot-password.html')
    
def forgot_username(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-forgot-username.html', {"user": user})
    else:
        return render(request, 'intro-forgot-username.html')
    
def filtering(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-filtering.html', {"user": user})
    else:
        return render(request, 'intro-filtering.html')
    
def filtering_submissions(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-filtering-sub.html', {"user": user})
    else:
        return render(request, 'intro-filtering-sub.html')
    
def sorting(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-sorting.html', {"user": user})
    else:
        return render(request, 'intro-sorting.html')
    
def export(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-export.html', {"user": user})
    else:
        return render(request, 'intro-export.html')
    
def detailed(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-detailed.html', {"user": user})
    else:
        return render(request, 'intro-detailed.html')
    
def statuses(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-statuses.html', {"user": user})
    else:
        return render(request, 'intro-statuses.html')
    
def visibility(request: HttpRequest):
    user = request.user

    if request.user.is_authenticated:
        return render(request, 'home-visibility.html', {"user": user})
    else:
        return render(request, 'intro-visibility.html')
    
def logout_view(request):
    logout(request)
    return render(request, 'intro.html')