from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from .models import TreePhotoSubmission


class TreePhotoSubmissionForm(forms.ModelForm):
    """Form for submitting tree photos"""
    
    tree_image = forms.ImageField(
        required=True,
        help_text="Upload a JPEG or PNG image (max 2MB)",
        widget=forms.FileInput(attrs={
            'accept': 'image/jpeg,image/png,image/jpg',
            'class': 'form-control',
            'id': 'tree_image_input'
        })
    )

    class Meta:
        model = TreePhotoSubmission
        fields = ['tree_description', 'latitude', 'longitude', 'person_name']
        exclude = ['tree_image', 'image_format']  # Handle these manually
        widgets = {
            'tree_description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Describe the endemic tree...'
            }),
            'latitude': forms.NumberInput(attrs={
                'class': 'form-control',
                'id': 'latitude_input',
                'step': 'any',
                'placeholder': 'Latitude'
            }),
            'longitude': forms.NumberInput(attrs={
                'class': 'form-control',
                'id': 'longitude_input',
                'step': 'any',
                'placeholder': 'Longitude'
            }),
            'person_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Your name'
            }),
        }
        labels = {
            'tree_description': 'Tree Description',
            'latitude': 'Latitude',
            'longitude': 'Longitude',
            'person_name': 'Name of the Person',
            'tree_image': 'Tree Image',
        }

    def clean_tree_image(self):
        """Validate image size and format"""
        image = self.cleaned_data.get('tree_image')
        
        if not image:
            raise forms.ValidationError("Please upload an image.")
        
        # Check file size (2MB = 2 * 1024 * 1024 bytes)
        max_size = 2 * 1024 * 1024  # 2MB
        if image.size > max_size:
            raise forms.ValidationError(
                f"Image size must be less than 2MB. Current size: {image.size / (1024 * 1024):.2f}MB"
            )
        
        # Check file format
        valid_formats = ['image/jpeg', 'image/jpg', 'image/png']
        if image.content_type not in valid_formats:
            raise forms.ValidationError(
                "Only JPEG and PNG image formats are allowed."
            )
        
        return image

    def clean_latitude(self):
        """Validate latitude range"""
        latitude = self.cleaned_data.get('latitude')
        if latitude is not None:
            if latitude < -90 or latitude > 90:
                raise forms.ValidationError("Latitude must be between -90 and 90.")
        return latitude

    def clean_longitude(self):
        """Validate longitude range"""
        longitude = self.cleaned_data.get('longitude')
        if longitude is not None:
            if longitude < -180 or longitude > 180:
                raise forms.ValidationError("Longitude must be between -180 and 180.")
        return longitude

    def save(self, commit=True):
        """Override save to convert image to binary and store format"""
        instance = super().save(commit=False)
        
        # Get the image file
        image_file = self.cleaned_data.get('tree_image')
        
        if image_file:
            # Read image as binary
            image_file.seek(0)  # Reset file pointer
            image_binary = image_file.read()
            
            # Store binary data
            instance.tree_image = image_binary
            
            # Determine and store image format
            content_type = image_file.content_type
            if 'jpeg' in content_type or 'jpg' in content_type:
                instance.image_format = 'JPEG'
            elif 'png' in content_type:
                instance.image_format = 'PNG'
        
        if commit:
            instance.save()
        
        return instance


class CustomUserCreationForm(UserCreationForm):
    """Custom signup form with email field"""
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your email'
        })
    )
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Choose a username'
        })
    )
    password1 = forms.CharField(
        label='Password',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Create a password'
        })
    )
    password2 = forms.CharField(
        label='Confirm Password',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Confirm your password'
        })
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')

    def clean_email(self):
        """Ensure email is unique"""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email

    def clean_username(self):
        """Ensure username is unique"""
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("This username is already taken.")
        return username


class CustomAuthenticationForm(AuthenticationForm):
    """Custom login form"""
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your username or email'
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your password'
        })
    )
