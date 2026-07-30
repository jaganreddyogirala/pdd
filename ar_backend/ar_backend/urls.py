"""
URL configuration for ar_backend project.

Architecture: Pure REST API backend.
  - All HTML rendering has been removed.
  - The root (/) returns a JSON API index.
  - The Next.js app at localhost:3000 is the ONLY user-facing website.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from ar_service.views import ApiRootView

urlpatterns = [
    # JSON API root — NOT an HTML page
    path('', ApiRootView.as_view(), name='api-root'),

    # Django admin panel (HTML is acceptable here — it is internal tooling)
    path('admin/', admin.site.urls),

    # All REST API endpoints live under /api/
    path('api/', include('ar_service.urls')),

    # AR Captures module — /api/ar-captures/
    path('api/ar-captures/', include('ar_captures.urls')),
]

# Serve uploaded media files in development (images, GLB models, captures)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
