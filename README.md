# Arv: Full-Stack AR Product Visualization and Capture System

**Arv** is a platform that bridges a Django-based backend with a high-performance iOS ARKit/RealityKit application to provide an immersive furniture shopping and visualization experience.

## Project Goal
The primary goal is to enable users to view 3D models of products (like furniture) in their real-world space using Augmented Reality, manage their viewing sessions, and capture/save these visualizations back to a central server for persistence and future reference.

## Core Functionality

- **Catalogue Management:** A Django backend serves product metadata (IDs, names, specs) and 3D model URLs via a REST API.
- **Immersive AR Experience:** A SwiftUI-based iOS app uses **ARKit** and **RealityKit** for plane detection and 3D object placement.
- **Dynamic Session Handling:** Automatic session tracking between the client and backend to link user interactions with specific products.
- **Capture & Cloud Sync:** Users can take snapshots of their AR scenes. Images are sent via base64 encoded requests to the Django server for long-term storage.

## Technical Stack

### Frontend (iOS)
- **Language:** Swift
- **UI Framework:** SwiftUI
### Web Platform (Next.js 15 App Router - `frontend/`)
- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **State & Data:** Zustand, Axios API client
- **Styling:** Tailwind CSS, Custom Dark Glassmorphism Design System
- **3D & WebGL:** Three.js, OrbitControls, GLTFLoader, WebAR Room Simulator Engine
- **Icons:** Lucide React

## Getting Started

### 1. Run the Backend
```bash
cd ar_backend
python manage.py runserver 0.0.0.0:8000
```

### 2. Run the Next.js 15 Web Frontend
```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:3000` to access the Next.js 15 AR product visualization app.
- The web app automatically fetches live catalog products from `http://localhost:8000/api/products/` and supports WebAR 3D room simulation and snapshot uploads to `/api/capture/save/`.



### 3. Run the iOS App
- Open `ar_visualisation.xcodeproj` in Xcode.
- Ensure the `baseURL` in `AppConfig.swift` points to your backend IP (or `localhost` for simulator).
- Build and run on an iOS device or simulator.

## Testing & Validation

We have implemented a robust testing suite to ensure production stability:

- **Unit Tests**: Located in `UnitTests/`. Tests network retries, backoff logic, dimension regex parsing, and model caching.
- **Integration Guide**: See `UnitTests/Integration_Validation_Guide.md` for steps on cross-device testing and environment configuration.
- **Logging**: Real-time logs are available via `os.Logger`. Filter for `ARSession` or `Network` in the Mac Console app.

