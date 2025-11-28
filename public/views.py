from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.urls import reverse
from .forms import TreePhotoSubmissionForm, CustomUserCreationForm, CustomAuthenticationForm
from .models import TreePhotoSubmission
from app.models import UserProfile


def home(request):
    """Home page view"""
    return render(request, 'public/home.html')


@login_required(login_url='public:login')
def submit_tree_photo(request):
    """Handle tree photo submission - requires authentication"""
    if request.method == 'POST':
        form = TreePhotoSubmissionForm(request.POST, request.FILES)
        if form.is_valid():
            # Save to database
            submission = form.save()
            # Verify it was saved
            if submission and submission.pk:
                messages.success(
                    request,
                    'Thank you! Your tree photo submission has been received successfully.'
                )
                # Redirect to submit page to show success modal
                return redirect('public:submit')
            else:
                messages.error(
                    request,
                    'There was an error saving your submission. Please try again.'
                )
        else:
            messages.error(
                request,
                'Please correct the errors below and try again.'
            )
    else:
        form = TreePhotoSubmissionForm()
    
    return render(request, 'public/submit.html', {'form': form})


def submissions_list(request):
    """View all submissions (optional - for admin/public viewing)"""
    submissions = TreePhotoSubmission.objects.all()[:50]  # Limit to 50 most recent
    return render(request, 'public/submissions_list.html', {'submissions': submissions})


def get_user_type(user):
    """Helper function to get user type from profile"""
    try:
        return user.profile.user_type
    except (AttributeError, UserProfile.DoesNotExist):
        return None


def user_login(request):
    """Handle user login - only for public users"""
    if request.user.is_authenticated:
        return redirect('public:home')
    
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                # Check user type - only allow public_user
                user_type = get_user_type(user)
                if user_type != 'public_user':
                    messages.error(request, 'This account is not authorized to access the public portal. Please use the correct login portal.')
                    form = CustomAuthenticationForm()
                    return render(request, 'public/login.html', {'form': form})
                
                # Specify the backend since we have multiple backends
                login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                # Use info message instead of success to avoid triggering submission modal
                messages.info(request, f'Welcome back, {user.username}!')
                # Redirect to next page or submit page if they were trying to upload
                next_url = request.GET.get('next', 'public:home')
                return redirect(next_url)
            else:
                messages.error(request, 'Invalid username or password.')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = CustomAuthenticationForm()
    
    return render(request, 'public/login.html', {'form': form})


def user_signup(request):
    """Handle user signup"""
    if request.user.is_authenticated:
        return redirect('public:home')
    
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            
            # Set user type to 'public_user' for public signups
            # The signal creates a profile with 'app_user' by default, so we need to update it
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'user_type': 'public_user'}
            )
            if not created:
                # Profile already exists (created by signal), update it
                profile.user_type = 'public_user'
                profile.save()
            
            # Log the user in - specify the backend since we have multiple backends
            from django.contrib.auth import login
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            # Use info message instead of success to avoid triggering submission modal
            messages.info(request, f'Account created successfully! Welcome, {user.username}!')
            return redirect('public:home')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'public/signup.html', {'form': form})


def user_logout(request):
    """Handle user logout"""
    from django.contrib.auth import logout
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('public:home')
