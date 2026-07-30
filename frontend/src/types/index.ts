export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
}

export interface Product {
  product_id: string;
  name: string;
  description: string;
  material: string;
  dimensions: string;
  weight: string;
  assembly: string;
  image_url?: string | null;
  image_file?: string | null;
  image_display_url?: string;
  model_url: string;
  model_file?: string | null;
  model_display_url?: string;
  usdz_url?: string | null;
  usdz_file?: string | null;
  usdz_display_url?: string;
  scale: number;
  surface_type?: 'floor' | 'wall' | 'tabletop';
  category?: number | null;
  category_name?: string;
  price?: number;
  is_featured?: boolean;
  created_at?: string;
}

export interface ARSession {
  session_id: string;
  host_app_id: string;
  product_id: string;
  product_name: string;
  created_time: string;
}

export interface Capture {
  capture_id: string;
  session?: string | null;
  user?: number | null;
  captured_image: string;
  captured_image_url?: string;
  timestamp: string;
}

export interface StartSessionResponse {
  session_id: string;
  status: string;
}

export interface UserProfile {
  bio?: string;
  avatar_url?: string | null;
  preferences?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  profile?: UserProfile;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface WishlistItem {
  id: number;
  user: number;
  product: Product;
  created_at: string;
}

