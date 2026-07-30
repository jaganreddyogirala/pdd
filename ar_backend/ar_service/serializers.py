from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, ARSession, ModelHandler, Capture, Category, Wishlist, UserProfile

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    image_display_url = serializers.SerializerMethodField()
    model_display_url = serializers.SerializerMethodField()
    usdz_display_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_image_display_url(self, obj):
        try:
            if obj.image_file and hasattr(obj.image_file, 'name') and obj.image_file.name:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.image_file.url)
                return obj.image_file.url
        except Exception:
            pass
        return obj.image_url or ''

    def get_model_display_url(self, obj):
        try:
            if obj.model_file and hasattr(obj.model_file, 'name') and obj.model_file.name:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.model_file.url)
                return obj.model_file.url
        except Exception:
            pass
        return obj.model_url or ''

    def get_usdz_display_url(self, obj):
        try:
            if obj.usdz_file and hasattr(obj.usdz_file, 'name') and obj.usdz_file.name:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.usdz_file.url)
                return obj.usdz_file.url
        except Exception:
            pass
        return obj.usdz_url or ''

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['bio', 'avatar_url', 'preferences']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'profile']

class StartSessionSerializer(serializers.Serializer):
    host_app_id = serializers.CharField(max_length=255)
    product_id = serializers.CharField(max_length=255)
    product_name = serializers.CharField(max_length=255, required=False)
    model_url = serializers.URLField(max_length=500, required=False)
    scale = serializers.FloatField(default=1.0, required=False)

class ModelHandlerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelHandler
        fields = ['model_url', 'scale', 'rotation']

class CaptureSerializer(serializers.ModelSerializer):
    captured_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Capture
        fields = ['capture_id', 'session', 'user', 'captured_image', 'captured_image_url', 'timestamp']

    def get_captured_image_url(self, obj):
        try:
            if obj.captured_image and hasattr(obj.captured_image, 'name') and obj.captured_image.name:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.captured_image.url)
                return obj.captured_image.url
        except Exception:
            pass
        return ''

class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.CharField(write_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'product', 'product_id', 'created_at']


