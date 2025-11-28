from django.contrib import admin
from django.utils.html import format_html
from .models import TreePhotoSubmission


@admin.register(TreePhotoSubmission)
class TreePhotoSubmissionAdmin(admin.ModelAdmin):
    list_display = ['person_name', 'tree_description', 'latitude', 'longitude', 'image_format', 'created_at']
    list_filter = ['image_format', 'created_at']
    search_fields = ['person_name', 'tree_description']
    readonly_fields = ['created_at', 'updated_at', 'image_preview']
    
    fieldsets = (
        ('Submission Information', {
            'fields': ('person_name', 'tree_description', 'created_at', 'updated_at')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude')
        }),
        ('Image', {
            'fields': ('image_format', 'image_preview')
        }),
    )

    def image_preview(self, obj):
        """Display image preview in admin"""
        if obj.tree_image:
            import base64
            image_data = base64.b64encode(obj.tree_image).decode('utf-8')
            image_src = f"data:image/{obj.image_format.lower()};base64,{image_data}"
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 300px;" />',
                image_src
            )
        return "No image"
    
    image_preview.short_description = "Image Preview"
