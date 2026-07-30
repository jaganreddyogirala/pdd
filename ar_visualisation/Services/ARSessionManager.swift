import Foundation
import RealityKit
import ARKit
import SwiftUI
import Combine
import os
import RoomPlan

class ARSessionManager: ObservableObject {
    static let shared = ARSessionManager()
    
    // Session State
    @Published var currentSessionID: String? = nil
    @Published var activeProduct: Product? = nil
    @Published var isSessionActive: Bool = false
    
    // AR Stability & Surface Detection
    @Published var fitStatus: String = "Initializing..."
    @Published var isPlacementValid: Bool = false
    @Published var detectedPlaneExtent: CGSize? = nil
    @Published var lastFitMessage: String = "Starting AR..."
    
    // Interaction State
    @Published var shouldAutoPlace: Bool = false
    @Published var requestSnapshot: Bool = false
    @Published var lastCapture: UIImage? = nil
    @Published var capturedImages: [UIImage] = []
    @Published var isObjectPlaced: Bool = false
    @Published var shouldConfirmPlacement: Bool = false
    
    // UI State
    @Published var navigationPath = NavigationPath()
    @Published var toastMessage: String? = nil
    @Published var isSaving: Bool = false
    @Published var showCoaching: Bool = true
    @Published var posterImage: UIImage? = nil
    @Published var trackingState: ARCamera.TrackingState = .notAvailable
    @Published var spatialMap: CapturedRoom? = nil
    @Published var isRoomScanned: Bool = false
    
    // Persistence
    private let worldMapKey = "com.arv.worldmap"
    private var _cachedARView: ARView? = nil
    
    @MainActor
    var sharedARView: ARView {
        if let view = _cachedARView {
            return view
        }
        let view = ARView(frame: .zero)
        #if !targetEnvironment(simulator)
        // Configuration will be handled by ARViewContainer to ensure proper timing
        #endif
        _cachedARView = view
        AppLogger.log("Shared ARView initialized", category: .ar)
        return view
    }
    
    private init() {}
    
    /// Clears memory and resets session if called during memory pressure
    func handleMemoryPressure() {
        AppLogger.log("Memory pressure detected - Clearing model cache and resetting session", category: .performance, level: .default)
        ModelCacheService.shared.clearCache()
        resetARSession()
    }
    
    func configureSession(for arView: ARView) {
        guard ARWorldTrackingConfiguration.isSupported else {
            AppLogger.log("ARKit is not supported on this device", category: .ar, level: .fault)
            self.toastMessage = "AR is not supported on this device."
            return
        }

        // Avoid re-configuring if already active and running
        if isSessionActive && trackingState != .notAvailable {
            AppLogger.log("AR Session already active, skipping re-configuration", category: .ar)
            return
        }

        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal, .vertical]
        config.environmentTexturing = .automatic
        
        // Performance: Enable scene reconstruction if supported (Lidar Devices)
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            config.sceneReconstruction = .mesh
            AppLogger.log("Scene reconstruction (.mesh) enabled: LiDAR detected", category: .ar)
        }
        
        // Enable Auto Focus for better clarity
        config.isAutoFocusEnabled = true
        
        // Enable Person Occlusion if supported
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentationWithDepth) {
            config.frameSemantics.insert(.personSegmentationWithDepth)
            AppLogger.log("Person Occlusion (Depth) enabled", category: .ar)
        }
        
        arView.session.run(config, options: [.resetTracking, .removeExistingAnchors])
        
        // Use async to avoid "Publishing changes from within view updates" warning
        DispatchQueue.main.async {
            // Only start RoomPlan if not already scanning to avoid hardware conflicts
            if !SpatialIntelligenceService.shared.isScanning {
                SpatialIntelligenceService.shared.startRoomScan()
            }
            self.isSessionActive = true
            AppLogger.log("AR Session & RoomPlan started", category: .ar)
        }
    }
    
    // MARK: - Persistence (ARWorldMap)
    
    func saveWorldMap() {
        _cachedARView?.session.getCurrentWorldMap { worldMap, error in
            guard let map = worldMap else { 
                AppLogger.error("Failed to get world map", category: .ar, error: error)
                return 
            }
            do {
                let data = try NSKeyedArchiver.archivedData(withRootObject: map, requiringSecureCoding: true)
                UserDefaults.standard.set(data, forKey: self.worldMapKey)
                AppLogger.log("ARWorldMap saved successfully", category: .ar)
            } catch {
                AppLogger.error("Failed to archive world map", category: .ar, error: error)
            }
        }
    }
    
    func loadWorldMap() {
        guard let data = UserDefaults.standard.data(forKey: worldMapKey) else { return }
        do {
            if let worldMap = try NSKeyedUnarchiver.unarchivedObject(ofClass: ARWorldMap.self, from: data) {
                let config = ARWorldTrackingConfiguration()
                config.initialWorldMap = worldMap
                config.planeDetection = [.horizontal, .vertical]
                _cachedARView?.session.run(config, options: [.resetTracking, .removeExistingAnchors])
                AppLogger.log("ARWorldMap restored", category: .ar)
            }
        } catch {
            AppLogger.error("Failed to unarchive world map", category: .ar, error: error)
        }
    }
    
    func pauseSession() {
        _cachedARView?.session.pause()
        isSessionActive = false
        AppLogger.log("AR Session paused", category: .ar)
    }
    
    func resumeSession() {
        if let arView = _cachedARView {
            let config = ARWorldTrackingConfiguration()
            config.planeDetection = [.horizontal, .vertical]
            config.environmentTexturing = .automatic
            
            if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
                config.sceneReconstruction = .mesh
            }
            config.isAutoFocusEnabled = true
            
            // Re-enable Person Occlusion on resume
            if ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentationWithDepth) {
                config.frameSemantics.insert(.personSegmentationWithDepth)
            } else if ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentation) {
                config.frameSemantics.insert(.personSegmentation)
            }
            
            arView.session.run(config)
            isSessionActive = true
            AppLogger.log("AR Session resumed", category: .ar)
        }
    }
    
    func resetARSession() {
        _cachedARView?.session.pause()
        _cachedARView?.scene.anchors.removeAll()
        _cachedARView = nil
        isSessionActive = false
        isObjectPlaced = false
        AppLogger.log("AR Session reset", category: .ar)
    }
    
    func saveCaptureToBackend(image: UIImage) {
        guard let sessionID = currentSessionID else { 
            AppLogger.log("Failed to save capture: No session ID", category: .network, level: .error)
            return 
        }
        
        isSaving = true
        toastMessage = "Saving model..."
        
        Task {
            // Local optimization: Add to history immediately so user sees it in gallery
            await MainActor.run {
                self.capturedImages.append(image)
            }
            
            do {
                AppLogger.log("Uploading capture to backend for session \(sessionID)", category: .network)
                let success = try await APIService.shared.saveCapture(sessionId: sessionID, image: image)
                
                await MainActor.run {
                    self.isSaving = false
                    if success {
                        self.toastMessage = "Model saved!"
                        AppLogger.log("Capture upload successful", category: .network)
                        
                        // Clear success message after 3 seconds
                        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                            if self.toastMessage == "Model saved!" {
                                self.toastMessage = nil
                            }
                        }
                    } else {
                        self.toastMessage = "Model saved locally (Upload delayed)"
                    }
                }
                
                // ALSO save to local photo library for user benefit (as mentioned in permissions)
                UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
                AppLogger.log("Capture saved to local photo library", category: .lifecycle)
                
            } catch {
                await MainActor.run {
                    self.isSaving = false
                    self.toastMessage = "Error: \(error.localizedDescription)"
                    AppLogger.log("Capture upload error: \(error.localizedDescription)", category: .network, level: .error)
                }
            }
        }
    }
    
    func getProductFootprint() -> (width: Float, depth: Float)? {
        guard let product = activeProduct else { return nil }
        let dims = product.actualDimensions
        return (dims.x, dims.z)
    }

}
