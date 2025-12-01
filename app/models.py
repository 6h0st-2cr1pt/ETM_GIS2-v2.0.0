from django.db import models
from django.utils import timezone
import uuid
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class TreeFamily(models.Model):
    """Tree family classification"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Tree Families"
        unique_together = ['name', 'user']


class TreeGenus(models.Model):
    """Tree genus classification"""
    name = models.CharField(max_length=100)
    family = models.ForeignKey(TreeFamily, on_delete=models.CASCADE, related_name='genera')
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Tree Genera"
        unique_together = ['name', 'user']


class TreeSpecies(models.Model):
    """Tree species classification"""
    scientific_name = models.CharField(max_length=100)
    common_name = models.CharField(max_length=100)
    genus = models.ForeignKey(TreeGenus, on_delete=models.CASCADE, related_name='species')
    description = models.TextField(blank=True, null=True)
    is_endemic = models.BooleanField(default=True)
    conservation_status = models.CharField(max_length=50, blank=True, null=True)
    # Image stored as BYTEA in PostgreSQL, shared by all trees with same common_name and scientific_name
    image = models.BinaryField(null=True, blank=True, help_text="Tree image stored as binary data (BYTEA)")
    image_format = models.CharField(
        max_length=10,
        choices=[('JPEG', 'JPEG'), ('PNG', 'PNG')],
        blank=True,
        null=True,
        help_text="Format of the uploaded image"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.common_name} ({self.scientific_name})"

    class Meta:
        verbose_name_plural = "Tree Species"
        unique_together = ['scientific_name', 'user']


class Location(models.Model):
    """Geographic location"""
    name = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    elevation = models.FloatField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.latitude}, {self.longitude})"


class PinStyle(models.Model):
    """Custom pin styles for map markers"""
    name = models.CharField(max_length=50)
    icon_class = models.CharField(max_length=50, default="fa-tree")
    color = models.CharField(max_length=20, default="#4caf50")
    size = models.IntegerField(default=24)
    border_color = models.CharField(max_length=20, default="#ffffff")
    border_width = models.IntegerField(default=2)
    background_color = models.CharField(max_length=20, default="rgba(0, 0, 0, 0.6)")
    is_default = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure only one default style
        if self.is_default:
            PinStyle.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class EndemicTree(models.Model):
    """Endemic tree records with yearly population data"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    species = models.ForeignKey(TreeSpecies, on_delete=models.CASCADE, related_name='trees')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='trees')
    population = models.IntegerField()
    year = models.IntegerField(default=timezone.now().year)
    health_status = models.CharField(max_length=20, choices=[
        ('very_poor', 'Very Poor'),
        ('poor', 'Poor'),
        ('good', 'Good'),
        ('very_good', 'Very Good'),
        ('excellent', 'Excellent'),
    ], default='good')
    # Health distribution fields
    healthy_count = models.IntegerField(default=0, help_text="Number of healthy trees (excellent/very_good)")
    good_count = models.IntegerField(default=0, help_text="Number of trees in good condition")
    bad_count = models.IntegerField(default=0, help_text="Number of trees in bad condition (poor/very_poor)")
    deceased_count = models.IntegerField(default=0, help_text="Number of deceased trees")
    hectares = models.FloatField(help_text="Area covered in hectares")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.species.common_name} at {self.location.name} ({self.year})"

    class Meta:
        ordering = ['species__common_name', '-year']
        indexes = [
            models.Index(fields=['year']),
        ]
        unique_together = ['species', 'location', 'year']


class TreeSeed(models.Model):
    """Newly planted tree seeds/seedlings records"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    species = models.ForeignKey(TreeSpecies, on_delete=models.CASCADE, related_name='seeds')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='seeds')
    quantity = models.IntegerField(help_text="Number of seeds planted")
    planting_date = models.DateField(default=timezone.now)
    germination_status = models.CharField(max_length=20, choices=[
        ('not_germinated', 'Not Germinated'),
        ('germinating', 'Germinating'),
        ('partially_germinated', 'Partially Germinated'),
        ('fully_germinated', 'Fully Germinated'),
        ('failed', 'Failed to Germinate'),
    ], default='not_germinated')
    germination_date = models.DateField(null=True, blank=True, help_text="Date when germination was first observed")
    survival_rate = models.FloatField(null=True, blank=True, help_text="Percentage of seeds that survived (0-100)")
    hectares = models.FloatField(help_text="Area covered in hectares")
    expected_maturity_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.species.common_name} seeds at {self.location.name} ({self.planting_date})"

    class Meta:
        ordering = ['-planting_date']
        indexes = [
            models.Index(fields=['planting_date']),
        ]


class MapLayer(models.Model):
    """Map layers for GIS visualization"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    url = models.URLField()
    layer_type = models.CharField(max_length=50, choices=[
        ('topographic', 'Topographic'),
        ('satellite', 'Satellite'),
        ('street', 'Street View'),
        ('heatmap', 'Heatmap'),
        ('protected', 'Protected Areas'),
        ('landuse', 'Land Use'),
        ('soil', 'Soil Type'),
        ('custom', 'Custom'),
    ])
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    attribution = models.CharField(max_length=255, blank=True, null=True)
    z_index = models.IntegerField(default=0)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure only one default per layer type
        if self.is_default:
            MapLayer.objects.filter(layer_type=self.layer_type, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class UserProfile(models.Model):
    """User profile to track user type/role"""
    USER_TYPE_CHOICES = [
        ('app_user', 'App User'),
        ('head_user', 'Head User'),
        ('public_user', 'Public User'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='app_user')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_user_type_display()}"

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"


# Signal to automatically create UserProfile when a User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create UserProfile automatically when a User is created"""
    if created:
        # Use get_or_create to avoid duplicate key errors
        # This will be created with default 'app_user' type
        # Admin inline form will update it if a different type is selected
        UserProfile.objects.get_or_create(
            user=instance, 
            defaults={'user_type': 'app_user'}
        )


class UserSetting(models.Model):
    """User application settings"""
    key = models.CharField(max_length=50)
    value = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.key

    class Meta:
        unique_together = ['key', 'user']
