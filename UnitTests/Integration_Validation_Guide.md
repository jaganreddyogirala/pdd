# Integration & Cross-Device Validation Guide

This guide details the procedure for cross-device testing between the iOS SwiftUI client and the Django REST API backend.

## 1. Local Network Configuration
1. Ensure both the iOS physical device and the Mac running the Django backend are connected to the same Wi-Fi network.
2. Obtain the Mac IP address (`ipconfig` / `ifconfig`).
3. Update `AppConfig.swift` or pass `API_BASE_URL` in Scheme Environment Variables:
   `API_BASE_URL=http://<YOUR_IP>:8000/api`

## 2. API Validation Flow
- **Product Retrieval**: Launch app -> `ProductListView` loads products via `GET /api/products/`.
- **Session Handshake**: Tap "View in your space" -> `POST /api/session/start/` responds with session token.
- **Model Caching**: Model is downloaded via `ModelCacheService`, cached in `.cachesDirectory/ARModels/`.
- **Snapshot Capture**: Tap Shutter -> Base64 JPEG is uploaded via `POST /api/capture/save/`.

## 3. Offline Resilience
- If network drops, `ModelCacheService` loads previously downloaded models from disk.
- Captured images are saved to local photo album and queued in `capturedImages` gallery state.
