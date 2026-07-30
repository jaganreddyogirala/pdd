# Arv (ios)

## Project Description
**Arv** is a full-stack AR product visualization and capture system designed to bridge the gap between digital catalogues and physical spaces. It consists of a Django-based backend and a high-performance iOS application built using ARKit and RealityKit.

The system allows users to seamlessly browse furniture and other products, visualize them in their real-world environment with accurate scaling and placement, and capture high-quality snapshots that are synchronized with the central server.

## Key Features
- **Accurate AR Placement**: Uses ARKit for plane detection and RealityKit for high-fidelity 3D model rendering.
- **Real-time Surface Detection**: Robust tracking of horizontal surfaces for stable object placement.
- **Session Management**: Each viewing session is tracked to provide personalized experiences and history.
- **Image Capture & Sync**: Captures AR scenes and uploads base64 encoded images to the Django backend.
- **Robust Networking**: Implemented with Combine and Swift Concurrency, featuring exponential backoff and retry logic.

## Technical Details 

### iOS Application (Swift/SwiftUI)
- **ARKit/RealityKit**: Core technologies for AR functionality.
- **Combine**: Used for reactive programming and network state management.
- **Custom Shaders**: Employed for professional effects like "ghost" previews and focus indicators.
- **Persistence**: Local caching of 3D models for performance.

### Backend (Python/Django)
- **Django REST Framework**: Provides the API layer for product metadata and image storage.
- **Pillow**: Handles image processing for captured snapshots.
- **SQLite**: Used for local development and metadata storage.
