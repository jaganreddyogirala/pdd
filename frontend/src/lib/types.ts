export interface Product {
  product_id: string;
  name: string;
  description: string;
  material: string;
  dimensions: string;
  weight: string;
  assembly: string;
  image_url?: string | null;
  model_url: string;
  scale: number;
  surface_type?: 'floor' | 'wall' | 'tabletop';
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
  session: string;
  captured_image: string;
  timestamp: string;
}

export interface StartSessionResponse {
  session_id: string;
  status: string;
}
