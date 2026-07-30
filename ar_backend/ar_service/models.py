import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

class Product(models.Model):
    SURFACE_CHOICES = (
        ('floor', 'Floor'),
        ('tabletop', 'Tabletop'),
        ('wall', 'Wall'),
    )

    product_id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    material = models.CharField(max_length=255, blank=True, default='')
    dimensions = models.CharField(max_length=255, blank=True, default='')
    weight = models.CharField(max_length=100, blank=True, default='')
    assembly = models.CharField(max_length=100, blank=True, default='')
    image_url = models.URLField(max_length=500, blank=True, null=True)
    image_file = models.ImageField(upload_to='product_images/', blank=True, null=True)
    model_url = models.URLField(max_length=500, blank=True, default='')
    model_file = models.FileField(upload_to='product_models/', blank=True, null=True)
    usdz_url = models.URLField(max_length=500, blank=True, null=True)
    usdz_file = models.FileField(upload_to='product_models_usdz/', blank=True, null=True)
    scale = models.FloatField(default=1.0)
    surface_type = models.CharField(max_length=50, choices=SURFACE_CHOICES, default='floor')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    price = models.FloatField(default=0.0)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

    def get_image_display_url(self):
        try:
            if self.image_file and hasattr(self.image_file, 'name') and self.image_file.name:
                return self.image_file.url
        except ValueError:
            pass
        return self.image_url or ''

    def get_model_display_url(self):
        try:
            if self.model_file and hasattr(self.model_file, 'name') and self.model_file.name:
                return self.model_file.url
        except ValueError:
            pass
        return self.model_url or ''

    def get_usdz_display_url(self):
        try:
            if self.usdz_file and hasattr(self.usdz_file, 'name') and self.usdz_file.name:
                return self.usdz_file.url
        except ValueError:
            pass
        return self.usdz_url or ''

class ARSession(models.Model):
    session_id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    host_app_id = models.CharField(max_length=255)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='sessions')
    product_name = models.CharField(max_length=255)
    created_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product_name} - {self.session_id}"

class ModelHandler(models.Model):
    session = models.OneToOneField(ARSession, on_delete=models.CASCADE, related_name='model_handler')
    model_url = models.URLField(max_length=500)
    scale = models.FloatField(default=1.0)
    rotation = models.FloatField(default=0.0)

    def __str__(self):
        return f"Model for {self.session.session_id}"

class Capture(models.Model):
    capture_id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ARSession, on_delete=models.CASCADE, related_name='captures', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='captures')
    captured_image = models.ImageField(upload_to='captures/')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Capture {self.capture_id} at {self.timestamp}"

class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, default='Spatial Computing Enthusiast & E-Commerce Shopper')
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    preferences = models.TextField(blank=True, default='{}')

    def __str__(self):
        return f"Profile of {self.user.username}"


