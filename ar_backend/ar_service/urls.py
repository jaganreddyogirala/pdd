# pyrefly: ignore [missing-import]
from django.urls import path
from .views import (
    ApiRootView,
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    ProductListView,
    ProductDetailView,
    CategoryListView,
    CategoryDetailView,
    WishlistView,
    StartSessionView,
    GetModelDataView,
    SaveCaptureView,
    ListCapturesView,
)

urlpatterns = [
    # API root — returns a JSON index of all endpoints (no HTML)
    path('', ApiRootView.as_view(), name='api-index'),

    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),

    # Product Endpoints
    path('products/', ProductListView.as_view(), name='product-list'),
    path('product/<str:product_id>/', ProductDetailView.as_view(), name='product-detail'),

    # Category Endpoints
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('category/<int:category_id>/', CategoryDetailView.as_view(), name='category-detail'),

    # Wishlist Endpoints
    path('wishlist/', WishlistView.as_view(), name='wishlist'),

    # AR Session & Capture Endpoints
    path('session/start/', StartSessionView.as_view(), name='session-start'),
    path('model/load/', GetModelDataView.as_view(), name='model-load'),
    path('capture/save/', SaveCaptureView.as_view(), name='capture-save'),
    path('capture/list/', ListCapturesView.as_view(), name='capture-list'),
]
