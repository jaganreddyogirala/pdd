"""
Serializers for the AR Captures module.

ARCaptureSerializer handles both read (GET) and write (POST) operations:
- On read: includes absolute `image_url` and `product_name` for easy consumption.
- On write: accepts multipart `image` file + optional metadata fields.
"""

from rest_framework import serializers
from .models import ARCapture


class ARCaptureSerializer(serializers.ModelSerializer):
    """Full serializer for ARCapture — used for list, detail, and create."""

    # Read-only computed fields for the API response
    image_url = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()

    class Meta:
        model = ARCapture
        fields = [
            'id',
            'product',
            'product_name',
            'image',
            'image_url',
            'position_x',
            'position_y',
            'position_z',
            'rotation_x',
            'rotation_y',
            'rotation_z',
            'scale',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'image_url', 'product_name']

    def get_image_url(self, obj: ARCapture) -> str:
        """Return the absolute URL of the captured image."""
        try:
            if obj.image and hasattr(obj.image, 'name') and obj.image.name:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
        except Exception:
            pass
        return ''

    def get_product_name(self, obj: ARCapture) -> str:
        """Return the name of the associated product, or empty string."""
        if obj.product:
            return obj.product.name
        return ''
