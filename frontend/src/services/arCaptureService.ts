/**
 * AR Capture Service
 *
 * Typed API client for the /api/ar-captures/ endpoints.
 * Used by the AR page to upload screenshots and by the gallery to list them.
 * The same GET endpoint is consumed by the iOS application.
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of a single AR capture returned by the API */
export interface ARCaptureResponse {
  id: number;
  product: string | null;
  product_name: string;
  image: string;
  image_url: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale: number;
  created_at: string;
}

/** Metadata sent alongside the captured image during upload */
export interface CaptureMetadata {
  position_x?: number;
  position_y?: number;
  position_z?: number;
  rotation_x?: number;
  rotation_y?: number;
  rotation_z?: number;
  scale?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Client
// ─────────────────────────────────────────────────────────────────────────────

const captureClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // captures can be large images — generous timeout
});

// ─────────────────────────────────────────────────────────────────────────────
// Service Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all AR captures, newest first.
 * Optionally filter by product_id query param.
 */
export async function fetchCaptures(productId?: string): Promise<ARCaptureResponse[]> {
  const params: Record<string, string> = {};
  if (productId) {
    params.product_id = productId;
  }

  const response = await captureClient.get<ARCaptureResponse[]>('/ar-captures/', { params });
  return response.data;
}

/**
 * Upload a captured AR screenshot.
 *
 * @param imageBlob  The captured image as a Blob (from canvas.toBlob or dataURL conversion).
 * @param productId  The product_id of the product currently placed in AR.
 * @param metadata   Optional 3D transform metadata (position, rotation, scale).
 * @returns          The created ARCapture object.
 */
export async function uploadCapture(
  imageBlob: Blob,
  productId: string,
  metadata?: CaptureMetadata
): Promise<ARCaptureResponse> {
  const formData = new FormData();

  // Image file — the required field
  formData.append('image', imageBlob, `ar_capture_${Date.now()}.png`);

  // Product FK
  formData.append('product', productId);

  // Optional 3D metadata
  if (metadata) {
    if (metadata.position_x !== undefined) formData.append('position_x', String(metadata.position_x));
    if (metadata.position_y !== undefined) formData.append('position_y', String(metadata.position_y));
    if (metadata.position_z !== undefined) formData.append('position_z', String(metadata.position_z));
    if (metadata.rotation_x !== undefined) formData.append('rotation_x', String(metadata.rotation_x));
    if (metadata.rotation_y !== undefined) formData.append('rotation_y', String(metadata.rotation_y));
    if (metadata.rotation_z !== undefined) formData.append('rotation_z', String(metadata.rotation_z));
    if (metadata.scale !== undefined) formData.append('scale', String(metadata.scale));
  }

  const response = await captureClient.post<ARCaptureResponse>('/ar-captures/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

/**
 * Delete an AR capture by ID.
 */
export async function deleteCapture(captureId: number): Promise<void> {
  await captureClient.delete(`/ar-captures/${captureId}/`);
}
