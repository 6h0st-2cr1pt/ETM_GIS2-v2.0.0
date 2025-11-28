from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
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

@admin.register(TreeSpecies)
class TreeSpeciesAdmin(admin.ModelAdmin):
    list_display = ('common_name', 'scientific_name', 'genus', 'is_endemic', 'conservation_status')
    list_filter = ('genus__family', 'genus', 'is_endemic')
    search_fields = ('common_name', 'scientific_name')

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
