from django.contrib import admin
from .models import Product, ARSession, ModelHandler, Capture

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('product_id', 'name', 'material', 'dimensions')
    search_fields = ('product_id', 'name')


@admin.register(ARSession)
class ARSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'product_name', 'host_app_id', 'created_time')
    search_fields = ('session_id', 'product_name', 'product__product_id', 'host_app_id')

@admin.register(ModelHandler)
class ModelHandlerAdmin(admin.ModelAdmin):
    list_display = ('session', 'model_url', 'scale', 'rotation')

@admin.register(Capture)
class CaptureAdmin(admin.ModelAdmin):
    list_display = ('capture_id', 'session', 'timestamp')
    readonly_fields = ('timestamp',)
