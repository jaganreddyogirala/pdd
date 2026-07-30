"""
Views for the AR Captures module.

Two API views:
- ARCaptureListCreateView  →  GET (list all) + POST (upload new capture)
- ARCaptureDetailView      →  GET (retrieve one) + DELETE (remove one)

All views are AllowAny — no authentication required.
POST accepts multipart/form-data with an `image` file field.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import ARCapture
from .serializers import ARCaptureSerializer


class ARCaptureListCreateView(APIView):
    """
    GET  /api/ar-captures/  → List all captures (newest first).
    POST /api/ar-captures/  → Upload a new capture (multipart form-data).
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        """Return all captures ordered by newest first."""
        captures = ARCapture.objects.select_related('product').all()

        # Optional filter by product_id query param
        product_id = request.query_params.get('product_id')
        if product_id:
            captures = captures.filter(product__product_id=product_id)

        serializer = ARCaptureSerializer(
            captures, many=True, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Create a new AR capture.

        Expected multipart fields:
          - image (required): The captured screenshot file.
          - product (optional): Product ID string.
          - position_x, position_y, position_z (optional): Model position.
          - rotation_x, rotation_y, rotation_z (optional): Model rotation.
          - scale (optional): Model scale.
        """
        serializer = ARCaptureSerializer(
            data=request.data, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ARCaptureDetailView(APIView):
    """
    GET    /api/ar-captures/<id>/  → Retrieve a single capture.
    DELETE /api/ar-captures/<id>/  → Delete a capture and its image file.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        """Return a single capture by ID."""
        try:
            capture = ARCapture.objects.select_related('product').get(pk=pk)
        except ARCapture.DoesNotExist:
            return Response(
                {'error': 'Capture not found'}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ARCaptureSerializer(capture, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """Delete a capture and remove the image file from disk."""
        try:
            capture = ARCapture.objects.get(pk=pk)
        except ARCapture.DoesNotExist:
            return Response(
                {'error': 'Capture not found'}, status=status.HTTP_404_NOT_FOUND
            )

        # Delete the image file from media storage
        if capture.image:
            capture.image.delete(save=False)

        capture.delete()
        return Response(
            {'message': 'Capture deleted successfully'},
            status=status.HTTP_200_OK,
        )
