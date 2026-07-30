import base64
from django.core.files.base import ContentFile
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Product, ARSession, ModelHandler, Capture, Category, Wishlist, UserProfile
from .serializers import (
    ProductSerializer, 
    StartSessionSerializer, 
    ModelHandlerSerializer, 
    CaptureSerializer,
    CategorySerializer,
    WishlistSerializer,
    UserSerializer,
    UserProfileSerializer
)

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        
        if not username or not password:
            return Response({"error": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.create_user(username=username, password=password, email=email)
        token, _ = Token.objects.get_or_create(user=user)
        UserProfile.objects.get_or_create(user=user)
        
        serializer = UserSerializer(user)
        return Response({
            "token": token.key,
            "user": serializer.data
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            UserProfile.objects.get_or_create(user=user)
            serializer = UserSerializer(user)
            return Response({
                "token": token.key,
                "user": serializer.data
            }, status=status.HTTP_200_OK)
        return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        if request.user and request.user.is_authenticated:
            try:
                request.user.auth_token.delete()
            except Exception:
                pass
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    def put(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
            
        user = request.user
        email = request.data.get('email')
        if email is not None:
            user.email = email
            user.save()
            
        profile, _ = UserProfile.objects.get_or_create(user=user)
        bio = request.data.get('bio')
        avatar_url = request.data.get('avatar_url')
        if bio is not None:
            profile.bio = bio
        if avatar_url is not None:
            profile.avatar_url = avatar_url
        profile.save()
        
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class ProductListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        products = Product.objects.all()
        
        # Filter by search
        search = request.query_params.get('search')
        if search:
            products = products.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) | 
                Q(material__icontains=search)
            )
            
        # Filter by surface_type
        surface_type = request.query_params.get('surface_type') or request.query_params.get('categoryFilter')
        if surface_type and surface_type != 'all':
            products = products.filter(surface_type=surface_type)
            
        # Filter by category name
        category_param = request.query_params.get('category')
        if category_param and category_param != 'all':
            products = products.filter(Q(category__name__iexact=category_param) | Q(category__slug__iexact=category_param))
            
        # Filter by is_featured
        featured = request.query_params.get('featured')
        if featured == 'true':
            products = products.filter(is_featured=True)
            
        # Ordering
        ordering = request.query_params.get('ordering')
        if ordering:
            products = products.order_by(ordering)
        else:
            products = products.order_by('-created_at', 'name')
            
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    def post(self, request):
        # Admin create product
        parser_classes = (MultiPartParser, FormParser, JSONParser)
        serializer = ProductSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProductDetailView(APIView):
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get(self, request, product_id):
        try:
            product = Product.objects.get(product_id=product_id)
            serializer = ProductSerializer(product, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
            
    def put(self, request, product_id):
        try:
            product = Product.objects.get(product_id=product_id)
            serializer = ProductSerializer(product, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, product_id):
        try:
            product = Product.objects.get(product_id=product_id)
            product.delete()
            return Response({"message": "Product deleted successfully"}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

class CategoryListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        categories = Category.objects.all().order_by('name')
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoryDetailView(APIView):
    permission_classes = [AllowAny]
    
    def delete(self, request, category_id):
        try:
            cat = Category.objects.get(pk=category_id)
            cat.delete()
            return Response({"message": "Category deleted successfully"}, status=status.HTTP_200_OK)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)

class WishlistView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        if request.user and request.user.is_authenticated:
            wishlist_items = Wishlist.objects.filter(user=request.user)
        else:
            wishlist_items = Wishlist.objects.all()
        serializer = WishlistSerializer(wishlist_items, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "product_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            product = Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
            
        user = request.user if (request.user and request.user.is_authenticated) else None
        if not user:
            user, _ = User.objects.get_or_create(username='guest_user')
            
        wishlist_item = Wishlist.objects.filter(user=user, product=product).first()
        if wishlist_item:
            wishlist_item.delete()
            return Response({"message": "Removed from wishlist", "added": False}, status=status.HTTP_200_OK)
        else:
            Wishlist.objects.create(user=user, product=product)
            return Response({"message": "Added to wishlist", "added": True}, status=status.HTTP_201_CREATED)

class StartSessionView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = StartSessionSerializer(data=request.data)
        if serializer.is_valid():
            p_id = serializer.validated_data['product_id']
            product = Product.objects.filter(product_id=p_id).first()
            
            p_name = serializer.validated_data.get('product_name')
            if product and not p_name:
                p_name = product.name
            
            session = ARSession.objects.create(
                host_app_id=serializer.validated_data['host_app_id'],
                product=product,
                product_name=p_name or "Unknown Product"
            )
            
            m_url = serializer.validated_data.get('model_url')
            if not m_url and product:
                m_url = product.get_model_display_url()
            
            m_scale = serializer.validated_data.get('scale', 1.0)
            if m_scale == 1.0 and product:
                m_scale = product.scale

            ModelHandler.objects.create(
                session=session,
                model_url=m_url or "",
                scale=m_scale
            )
            
            return Response({
                "session_id": session.session_id,
                "status": "AR session started"
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetModelDataView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({"error": "session_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            session = ARSession.objects.get(session_id=session_id)
            model_handler = session.model_handler
            serializer = ModelHandlerSerializer(model_handler)
            
            return Response({
                "model_url": serializer.data['model_url'],
                "scale": serializer.data['scale'],
                "rotation": serializer.data['rotation']
            }, status=status.HTTP_200_OK)
            
        except ARSession.DoesNotExist:
            return Response({"error": "Invalid session_id"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SaveCaptureView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        captured_image_data = request.data.get('captured_image')
        
        if not session_id or not captured_image_data:
            return Response({"error": "session_id and captured_image are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            session = ARSession.objects.filter(session_id=session_id).first()
            user = request.user if (request.user and request.user.is_authenticated) else None
            
            if isinstance(captured_image_data, str) and ';base64,' in captured_image_data:
                format, imgstr = captured_image_data.split(';base64,')
                ext = format.split('/')[-1]
                data = ContentFile(base64.b64decode(imgstr), name=f'{session_id}_capture.{ext}')
            elif isinstance(captured_image_data, str):
                data = ContentFile(base64.b64decode(captured_image_data), name=f'{session_id}_capture.jpg')
            else:
                data = captured_image_data
                
            Capture.objects.create(
                session=session,
                user=user,
                captured_image=data
            )
            
            return Response({"message": "Capture saved successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ListCapturesView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        if request.user and request.user.is_authenticated:
            captures = Capture.objects.filter(user=request.user).order_by('-timestamp')
            if not captures.exists():
                captures = Capture.objects.all().order_by('-timestamp')
        else:
            captures = Capture.objects.all().order_by('-timestamp')
            
        serializer = CaptureSerializer(captures, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class ApiRootView(APIView):
    """Pure REST API root. Returns a JSON index of all available endpoints."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "service": "AR Visualisation REST API",
            "version": "3.0",
            "status": "ok",
            "frontend": "http://localhost:3000",
            "endpoints": {
                "auth": {
                    "register":  "/api/auth/register/",
                    "login":     "/api/auth/login/",
                    "logout":    "/api/auth/logout/",
                    "profile":   "/api/auth/profile/",
                },
                "products": {
                    "list":   "/api/products/",
                    "detail": "/api/product/{product_id}/",
                },
                "categories": {
                    "list":   "/api/categories/",
                    "detail": "/api/category/{id}/",
                },
                "wishlist":       "/api/wishlist/",
                "session_start":  "/api/session/start/",
                "model_load":     "/api/model/load/",
                "capture_save":   "/api/capture/save/",
                "capture_list":   "/api/capture/list/",
                "ar_captures": {
                    "list_create": "/api/ar-captures/",
                    "detail":     "/api/ar-captures/{id}/",
                },
                "admin":          "/admin/",
            },
        }, status=status.HTTP_200_OK)
