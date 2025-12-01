from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django import forms
from django.utils.html import format_html
from .models import (
    EndemicTree, MapLayer, UserSetting, TreeFamily, 
    TreeGenus, TreeSpecies, Location, PinStyle, TreeSeed, UserProfile
)

@admin.register(TreeFamily)
class TreeFamilyAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(TreeGenus)
class TreeGenusAdmin(admin.ModelAdmin):
    list_display = ('name', 'family', 'description')
    list_filter = ('family',)
    search_fields = ('name',)

class TreeSpeciesAdminForm(forms.ModelForm):
    """Custom form to handle binary image uploads"""
    image_upload = forms.ImageField(required=False, help_text="Upload an image for this species. This image will be shared by all trees with the same common name and scientific name.")
    
    class Meta:
        model = TreeSpecies
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Don't show the binary image field directly in the form
        if 'image' in self.fields:
            self.fields['image'].widget = forms.HiddenInput()
    
    def clean_image_upload(self):
        """Validate that image is not being uploaded if species already has one"""
        image_file = self.cleaned_data.get('image_upload')
        instance = self.instance
        
        # If editing existing species and it already has an image
        if instance and instance.pk and instance.image and image_file:
            raise forms.ValidationError(
                f"Image already exists for {instance.common_name} ({instance.scientific_name}). "
                "Please delete the existing image first or edit the species to replace it."
            )
        
        return image_file
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Handle image upload
        image_file = self.cleaned_data.get('image_upload')
        if image_file:
            # Check if species already has an image (double check)
            if instance.pk and instance.image:
                # This shouldn't happen due to clean validation, but just in case
                return instance
            
            # Read image as binary
            image_file.seek(0)  # Reset file pointer
            image_binary = image_file.read()
            
            # Store binary data
            instance.image = image_binary
            
            # Determine and store image format
            content_type = image_file.content_type
            if 'jpeg' in content_type or 'jpg' in content_type:
                instance.image_format = 'JPEG'
            elif 'png' in content_type:
                instance.image_format = 'PNG'
        
        if commit:
            instance.save()
        
        return instance


@admin.register(TreeSpecies)
class TreeSpeciesAdmin(admin.ModelAdmin):
    form = TreeSpeciesAdminForm
    list_display = ('common_name', 'scientific_name', 'genus', 'is_endemic', 'conservation_status', 'has_image')
    list_filter = ('genus__family', 'genus', 'is_endemic')
    search_fields = ('common_name', 'scientific_name')
    readonly_fields = ('image_preview',)
    
    fieldsets = (
        ('Species Information', {
            'fields': ('common_name', 'scientific_name', 'genus', 'description', 'is_endemic', 'conservation_status', 'user')
        }),
        ('Image', {
            'fields': ('image_upload', 'image_format', 'image_preview'),
            'description': 'Upload an image for this species. This image will be shared by all trees with the same common name and scientific name, and displayed in the GIS map popup. Note: If the species already has an image, you cannot upload a new one. To replace an existing image, you must first clear the image field or delete the species and recreate it.'
        }),
    )
    
    def has_image(self, obj):
        """Check if species has an image"""
        return bool(obj.image)
    has_image.boolean = True
    has_image.short_description = 'Has Image'
    
    def image_preview(self, obj):
        """Display image preview in admin"""
        if obj.image:
            import base64
            image_data = obj.image
            if isinstance(image_data, memoryview):
                image_data = bytes(image_data)
            elif not isinstance(image_data, bytes):
                image_data = bytes(image_data)
            
            image_b64 = base64.b64encode(image_data).decode('utf-8')
            image_format = obj.image_format.lower() if obj.image_format else 'jpeg'
            image_src = f"data:image/{image_format};base64,{image_b64}"
            return format_html(
                '<div>'
                '<img src="{}" style="max-width: 300px; max-height: 300px; margin-bottom: 10px;" /><br/>'
                '<strong>Image exists:</strong> Yes<br/>'
                '<strong>Format:</strong> {}<br/>'
                '<small style="color: #666;">To replace this image, you must clear the image field or delete and recreate the species.</small>'
                '</div>',
                image_src,
                obj.image_format or 'Unknown'
            )
        return format_html(
            '<div>'
            '<strong>Image exists:</strong> No<br/>'
            '<small style="color: #666;">You can upload an image using the "Image Upload" field above.</small>'
            '</div>'
        )
    
    image_preview.short_description = "Image Preview"

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'latitude', 'longitude', 'elevation')
    search_fields = ('name',)

@admin.register(PinStyle)
class PinStyleAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon_class', 'color', 'size', 'is_default')
    list_filter = ('is_default',)
    search_fields = ('name',)

@admin.register(EndemicTree)
class EndemicTreeAdmin(admin.ModelAdmin):
    list_display = ('species', 'location', 'population', 'year')
    list_filter = ('species__genus__family', 'species', 'year', 'location')
    search_fields = ('species__common_name', 'species__scientific_name', 'location__name')

@admin.register(TreeSeed)
class TreeSeedAdmin(admin.ModelAdmin):
    list_display = ('species', 'location', 'quantity', 'planting_date', 'germination_status', 'survival_rate')
    list_filter = ('species__genus__family', 'species', 'planting_date', 'germination_status', 'location')
    search_fields = ('species__common_name', 'species__scientific_name', 'location__name')
    date_hierarchy = 'planting_date'

@admin.register(MapLayer)
class MapLayerAdmin(admin.ModelAdmin):
    list_display = ('name', 'layer_type', 'is_active', 'is_default')
    list_filter = ('layer_type', 'is_active', 'is_default')
    search_fields = ('name', 'description')

@admin.register(UserSetting)
class UserSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value')
    search_fields = ('key',)

# Inline admin for UserProfile
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'User Profile'
    verbose_name = 'User Profile'
    fk_name = 'user'
    fields = ('user_type',)
    max_num = 1
    min_num = 1
    
    def get_extra(self, request, obj=None, **kwargs):
        """Show inline even when creating new user"""
        if obj is None:
            return 1
        # If user exists but no profile, show 1 extra
        if obj and not hasattr(obj, 'profile'):
            return 1
        return 0

# Extend UserAdmin to include UserProfile
class CustomUserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_user_type')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'profile__user_type')
    
    def get_user_type(self, obj):
        try:
            return obj.profile.get_user_type_display()
        except UserProfile.DoesNotExist:
            return 'No Profile (Default: App User)'
    get_user_type.short_description = 'User Type'
    
    def save_formset(self, request, form, formset, change):
        """Override to handle UserProfile inline - prevents duplicate key errors"""
        if formset.model == UserProfile:
            instances = formset.save(commit=False)
            for instance in instances:
                if isinstance(instance, UserProfile):
                    # Get or create profile (signal may have already created it)
                    profile, created = UserProfile.objects.get_or_create(
                        user=form.instance,
                        defaults={'user_type': getattr(instance, 'user_type', 'app_user') or 'app_user'}
                    )
                    # Update with form data if provided
                    user_type = getattr(instance, 'user_type', None)
                    if user_type and profile.user_type != user_type:
                        profile.user_type = user_type
                        profile.save()
            # Mark formset as saved
            formset.save_m2m()
        else:
            # For other formsets, use default behavior
            formset.save()

# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_type', 'created_at', 'updated_at')
    list_filter = ('user_type', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
