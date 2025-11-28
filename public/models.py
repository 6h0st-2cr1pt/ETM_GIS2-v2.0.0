from django.db import models
from django.utils import timezone


class TreePhotoSubmission(models.Model):
    """Model for storing public submissions of endemic tree photos"""
    tree_description = models.TextField(help_text="Description of the endemic tree")
    latitude = models.FloatField(help_text="Latitude coordinate")
    longitude = models.FloatField(help_text="Longitude coordinate")
    person_name = models.CharField(max_length=200, help_text="Name of the person submitting")
    # Store image as BYTEA (BinaryField in Django maps to BYTEA in PostgreSQL)
    tree_image = models.BinaryField(help_text="Tree image stored as binary data")
    image_format = models.CharField(
        max_length=10,
        choices=[('JPEG', 'JPEG'), ('PNG', 'PNG')],
        help_text="Format of the uploaded image"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Tree Photo Submission"
        verbose_name_plural = "Tree Photo Submissions"

    def __str__(self):
        return f"Submission by {self.person_name} at ({self.latitude}, {self.longitude})"
