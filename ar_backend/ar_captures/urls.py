"""
URL routing for the AR Captures module.

These URLs are included at /api/ar-captures/ by the project root urls.py.
"""

from django.urls import path
from .views import ARCaptureListCreateView, ARCaptureDetailView

urlpatterns = [
    path('', ARCaptureListCreateView.as_view(), name='ar-capture-list-create'),
    path('<int:pk>/', ARCaptureDetailView.as_view(), name='ar-capture-detail'),
]
