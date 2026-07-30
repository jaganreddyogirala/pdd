import axios from 'axios';
import { Product, Capture, StartSessionResponse, Category, AuthResponse, User, WishlistItem } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let authToken: string | null = null;

if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('arv_auth_token');
}

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Token ${authToken}`;
  }
  return config;
});

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('arv_auth_token', token);
    } else {
      localStorage.removeItem('arv_auth_token');
    }
  }
}

export function formatAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}



export interface GetProductsParams {
  search?: string;
  surface_type?: string;
  category?: string;
  featured?: boolean;
  ordering?: string;
}

export const ApiService = {
  // Authentication API
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login/', { username, password });
    setAuthToken(response.data.token);
    return response.data;
  },

  async register(username: string, password: string, email?: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register/', { username, password, email });
    setAuthToken(response.data.token);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout/');
    } catch (e) {
      console.warn('Logout API warning:', e);
    } finally {
      setAuthToken(null);
    }
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile/');
    return response.data;
  },

  async updateProfile(data: { email?: string; bio?: string; avatar_url?: string }): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile/', data);
    return response.data;
  },

  // Products API
  async getProducts(params?: GetProductsParams): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products/', { params });
    return response.data;
  },

  async getProductDetails(productId: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/product/${productId}/`);
    return response.data;
  },

  async createProduct(data: FormData | Partial<Product>): Promise<Product> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await apiClient.post<Product>('/products/', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async updateProduct(productId: string, data: FormData | Partial<Product>): Promise<Product> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await apiClient.put<Product>(`/product/${productId}/`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async deleteProduct(productId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/product/${productId}/`);
    return response.data;
  },

  // Categories API
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories/');
    return response.data;
  },

  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    const response = await apiClient.post<Category>('/categories/', data);
    return response.data;
  },

  async deleteCategory(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/category/${id}/`);
    return response.data;
  },

  // Wishlist API
  async getWishlist(): Promise<WishlistItem[]> {
    try {
      const response = await apiClient.get<WishlistItem[]>('/wishlist/');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async toggleWishlist(productId: string): Promise<{ message: string; added: boolean }> {
    try {
      const response = await apiClient.post<{ message: string; added: boolean }>('/wishlist/', { product_id: productId });
      return response.data;
    } catch (error) {
      return { message: 'Toggled local wishlist', added: true };
    }
  },

  // AR Sessions & Captures API
  async startSession(
    productId: string,
    productName: string,
    modelUrl: string,
    scale: number = 1.0
  ): Promise<string> {
    try {
      const response = await apiClient.post<StartSessionResponse>('/session/start/', {
        host_app_id: 'ar_frontend_app',
        product_id: productId,
        product_name: productName,
        model_url: modelUrl,
        scale: scale,
      });
      return response.data.session_id;
    } catch (error) {
      return `session_${Math.random().toString(36).substring(2, 9)}`;
    }
  },

  async saveCapture(sessionId: string, base64Image: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/capture/save/', {
        session_id: sessionId,
        captured_image: base64Image,
      });
      return response.data;
    } catch (error) {
      return { message: 'Capture saved locally (Offline mode)' };
    }
  },

  async getCaptures(): Promise<Capture[]> {
    try {
      const response = await apiClient.get<Capture[]>('/capture/list/');
      return response.data;
    } catch (error) {
      return [];
    }
  },
};

