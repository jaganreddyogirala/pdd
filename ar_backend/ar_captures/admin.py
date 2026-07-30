"""
Django admin registration for the AR Captures module.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import ARCapture


@admin.register(ARCapture)
class ARCaptureAdmin(admin.ModelAdmin):
    list_display = ('id', 'product_name_display', 'image_thumbnail', 'scale', 'created_at')
    list_filter = ('created_at', 'product')
    search_fields = ('product__name', 'product__product_id')
    readonly_fields = ('created_at', 'image_preview')
    ordering = ('-created_at',)

    def product_name_display(self, obj):
        """Show product name in the list view."""
        return obj.product.name if obj.product else '—'
    product_name_display.short_description = 'Product'

    def image_thumbnail(self, obj):
        """Show a small thumbnail in the list view."""
        if obj.image:
            return format_html(
                '<img src="{}" style="height:40px; border-radius:4px;" />',
                obj.image.url,
            )
        return '—'
    image_thumbnail.short_description = 'Preview'

    def image_preview(self, obj):
        """Show a larger preview on the detail page."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height:300px; border-radius:8px;" />',
                obj.image.url,
            )
        return '—'
    image_preview.short_description = 'Image Preview'
