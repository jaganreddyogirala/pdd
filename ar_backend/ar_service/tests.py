from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import Product, ARSession, Category, Wishlist

class ARServiceAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Furniture", slug="furniture")
        self.product = Product.objects.create(
            product_id="chair_001",
            name="Test Chair",
            description="A test chair",
            material="Wood",
            dimensions="20x20x30",
            weight="10kg",
            assembly="None",
            model_url="https://example.com/chair.glb",
            scale=1.0,
            category=self.category
        )

    def test_product_list(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.json()) >= 1)

    def test_product_detail(self):
        response = self.client.get('/api/product/chair_001/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['name'], "Test Chair")

    def test_start_session(self):
        data = {
            "host_app_id": "test_app",
            "product_id": "chair_001",
            "product_name": "Test Chair",
            "model_url": "https://example.com/chair.glb",
            "scale": 1.0
        }
        response = self.client.post('/api/session/start/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('session_id', response.json())

    def test_user_registration_and_login(self):
        reg_data = {"username": "testuser", "password": "password123", "email": "test@example.com"}
        reg_res = self.client.post('/api/auth/register/', reg_data, format='json')
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)

        login_res = self.client.post('/api/auth/login/', {"username": "testuser", "password": "password123"}, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('token', login_res.json())

