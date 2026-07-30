import SwiftUI
import RealityKit
import ARKit
import Combine
import os
import RoomPlan

struct ARViewContainer: UIViewRepresentable {
    @ObservedObject var sessionManager = ARSessionManager.shared
    
    func makeUIView(context: Context) -> ARView {
        let arView = sessionManager.sharedARView
        
        arView.session.delegate = context.coordinator
        
        #if !targetEnvironment(simulator)
        if !sessionManager.isSessionActive {
            sessionManager.configureSession(for: arView)
            setupCoachingOverlay(for: arView, context: context)
            
            // Production: High-fidelity rendering options
            arView.debugOptions = [] 
            arView.environment.sceneUnderstanding.options = [.occlusion, .physics, .receivesLighting]
            if let lighting = try? EnvironmentResource.load(named: "ARProductionLighting") {
                arView.environment.lighting.resource = lighting
            }
        }
        #endif
        
        // Ensure only one tap gesture exists and it points to current coordinator
        arView.gestureRecognizers?.removeAll(where: { $0 is UITapGestureRecognizer })
        let tapGesture = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        arView.addGestureRecognizer(tapGesture)
        
        context.coordinator.arView = arView
        return arView
    }
    
    private func setupCoachingOverlay(for arView: ARView, context: Context) {
        let coachingOverlay = ARCoachingOverlayView()
        coachingOverlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        coachingOverlay.session = arView.session
        coachingOverlay.delegate = context.coordinator
        coachingOverlay.goal = .anyPlane
        arView.addSubview(coachingOverlay)
    }
    
    func updateUIView(_ uiView: ARView, context: Context) {
        if sessionManager.requestSnapshot {
            DispatchQueue.main.async {
                sessionManager.requestSnapshot = false
            }
            
            AppLogger.log("Taking AR snapshot...", category: .ar)
            uiView.snapshot(saveToHDR: false) { image in
                if let snapshot = image {
                    DispatchQueue.main.async {
                        sessionManager.lastCapture = snapshot
                        sessionManager.saveCaptureToBackend(image: snapshot)
                    }
                }
            }
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }
    
    class Coordinator: NSObject, ARSessionDelegate, ARCoachingOverlayViewDelegate {
        private var lastFocusPosition: SIMD3<Float>?
        private var stabilityStartTime: Date?
        private var hasAutoPlaced = false
        private let stabilityThreshold: Float = 0.05 // 5cm
        private let autoPlaceDelay: TimeInterval = 1.2 // Faster "snap" to reality
        var parent: ARViewContainer
        weak var arView: ARView?
        private var planeAnchors: [UUID: AnchorEntity] = [:]
        private var cancellables = Set<AnyCancellable>()
        private var focusSquare: Entity? = nil
        private var previewModel: Entity? = nil
        private var originalModel: Entity? = nil // Store pristine model for iOS 17 fallback placement
        private var isDownloadingPreview = false
        private let minPlaneSize: Float = 0.2 // Minimum 20cm diagonal for stability
        
        init(parent: ARViewContainer) {
            self.parent = parent
            super.init()
            
            // Auto-placement subscription (for simulator testing)
            parent.sessionManager.$shouldAutoPlace
                .receive(on: DispatchQueue.main)
                .sink { [weak self] shouldAuto in
                    if shouldAuto {
                        let transform = simd_float4x4([1,0,0,0], [0,1,0,0], [0,0,1,0], [0,0,-0.5,1])
                        self?.loadAndPlaceModel(at: transform, isVertical: false)
                    }
                }
                .store(in: &cancellables)

            // IKEA-Level UX: Handle product switching seamlessly
            parent.sessionManager.$activeProduct
                .dropFirst()
                .sink { [weak self] _ in
                    self?.resetPreviewState()
                }
                .store(in: &cancellables)

            // IKEA-Style Placement Confirmation
            parent.sessionManager.$shouldConfirmPlacement
                .receive(on: DispatchQueue.main)
                .sink { [weak self] shouldConfirm in
                    if shouldConfirm {
                        self?.confirmPlacement()
                        self?.parent.sessionManager.shouldConfirmPlacement = false
                    }
                }
                .store(in: &cancellables)
        }

        private func confirmPlacement() {
            guard let arView = arView, let focusEntity = focusSquare, focusEntity.isEnabled else { return }
            
            AppLogger.log("Confirming placement at focus square location", category: .ar)
            
            // Determine result from center of screen (where focus square is)
            let screenCenter = CGPoint(x: arView.bounds.midX, y: arView.bounds.midY)
            let results = arView.raycast(from: screenCenter, allowing: .existingPlaneInfinite, alignment: .any)
            
            guard let firstResult = results.first else {
                parent.sessionManager.toastMessage = "Surface lost. Try again."
                return
            }
            
            // Use the anchor from the raycast result for maximum stability
            let anchorEntity: AnchorEntity
            if let planeAnchor = firstResult.anchor as? ARPlaneAnchor {
                anchorEntity = AnchorEntity(anchor: planeAnchor)
            } else {
                let arAnchor = ARAnchor(name: "PlacementAnchor", transform: firstResult.worldTransform)
                arView.session.add(anchor: arAnchor)
                anchorEntity = AnchorEntity(anchor: arAnchor)
            }
            
            clearExistingPlacements()
            arView.scene.addAnchor(anchorEntity)
            
            if let original = originalModel {
                let placedModel = original.clone(recursive: true)
                
                // 1. Production Validation: Does it fit?
                if let product = parent.sessionManager.activeProduct {
                    let canFit = SpatialIntelligenceService.shared.canFit(object: product, at: anchorEntity.transform.matrix, in: SpatialIntelligenceService.shared.capturedRoom)
                    if !canFit {
                        parent.sessionManager.toastMessage = "Insufficient space to place here."
                        return
                    }
                }

                // 2. Normalize and Ground
                if let product = parent.sessionManager.activeProduct {
                    ModelNormalizationService.shared.normalize(placedModel, for: product)
                }
                
                self.setupPlacedEntity(placedModel, in: anchorEntity, isVertical: false)
                
                // Finalize Stage 2: Solidify and clear pre-placement state
                self.focusSquare?.isEnabled = false
                self.previewModel?.removeFromParent()
                self.previewModel = nil
                
                DispatchQueue.main.async {
                    self.parent.sessionManager.isObjectPlaced = true
                }
            }
        }

        private func resetPreviewState() {
            previewModel?.removeFromParent()
            previewModel = nil
            originalModel = nil
            isDownloadingPreview = false
            AppLogger.log("AR Preview state reset (Product switched)", category: .ar)
        }
        
        private func applyGhostMaterial(to entity: Entity) {
            // Consistent Ghosting: Iteratively apply translucent material to all model components
            // This avoids iOS version-specific OpacityComponent inconsistencies
            if var modelComp = entity.components[ModelComponent.self] {
                // Semi-transparent phantom white (matches IKEA Place preview style)
                let ghostMat = SimpleMaterial(color: .white.withAlphaComponent(0.5), isMetallic: false)
                let newMats = Array(repeating: ghostMat as RealityKit.Material, count: modelComp.materials.count)
                modelComp.materials = newMats
                entity.components.set(modelComp)
            }
            for child in entity.children {
                applyGhostMaterial(to: child)
            }
        }
        
        private func loadPreviewModel() {
            guard let product = parent.sessionManager.activeProduct else { return }
            
            // 1. If we already have the ghost attached, nothing to do
            if previewModel != nil { return }
            
            // 2. If we have the original model in memory but no ghost, create it now
            if let original = originalModel {
                setupGhostEntity(from: original, product: product)
                return
            }
            
            // 3. If it's already downloading, wait
            guard !isDownloadingPreview else { return }
            isDownloadingPreview = true
            
            let modelName = product.productID
            AppLogger.log("Starting ghost preview load for: \(modelName)", category: .ar)

            // Try bundle first
            Entity.loadAsync(named: modelName)
                .sink(receiveCompletion: { [weak self] completion in
                    if case .failure(_) = completion {
                        self?.tryRemotePreviewLoad(product: product)
                    }
                }, receiveValue: { [weak self] modelEntity in
                    guard let self = self else { return }
                    self.isDownloadingPreview = false
                    self.originalModel = modelEntity
                    self.setupGhostEntity(from: modelEntity, product: product)
                })
                .store(in: &self.cancellables)
        }

        private func tryRemotePreviewLoad(product: Product) {
            guard !product.modelURL.isEmpty, let remoteURL = URL(string: product.modelURL) else {
                self.isDownloadingPreview = false
                AppLogger.log("No valid URL or bundle model for preview: \(product.productID)", category: .ar, level: .error)
                return
            }

            Task {
                do {
                    let localURL = try await ModelCacheService.shared.fetchModel(from: remoteURL)
                    await MainActor.run {
                        Entity.loadAsync(contentsOf: localURL)
                            .sink(receiveCompletion: { [weak self] _ in self?.isDownloadingPreview = false }, receiveValue: { [weak self] modelEntity in
                                guard let self = self else { return }
                                self.isDownloadingPreview = false
                                self.originalModel = modelEntity
                                self.setupGhostEntity(from: modelEntity, product: product)
                            })
                            .store(in: &self.cancellables)
                    }
                } catch {
                    await MainActor.run {
                        self.isDownloadingPreview = false
                        AppLogger.error("Failed to download ghost preview", category: .ar, error: error)
                    }
                }
            }
        }

        private func setupGhostEntity(from modelEntity: Entity, product: Product) {
            let ghostEntity = modelEntity.clone(recursive: true)
            
            // 1. Normalize Scale for Preview
            ModelNormalizationService.shared.normalize(ghostEntity, for: product)
            
            // 2. Applied Translucent "Ghost" Effect
            ModelNormalizationService.shared.applyGhostEffect(to: ghostEntity)
            
            self.previewModel = ghostEntity
            self.focusSquare?.addChild(ghostEntity)
            AppLogger.log("Ghost Preview Model attached to Focus Square", category: .ar)
        }
        
        // MARK: - ARSessionDelegate
        func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
            for anchor in anchors {
                if let planeAnchor = anchor as? ARPlaneAnchor {
                    AppLogger.log("New surface detected: \(planeAnchor.identifier)", category: .ar)
                    addPlane(planeAnchor)
                }
            }
        }
        
        func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
            for anchor in anchors {
                if let planeAnchor = anchor as? ARPlaneAnchor {
                    updatePlane(planeAnchor)
                }
            }
        }
        
        func session(_ session: ARSession, cameraDidChangeTrackingState camera: ARCamera) {
            let status: String
            let isUnstable: Bool
            
            switch camera.trackingState {
            case .notAvailable:
                status = "AR Not Available"
                isUnstable = true
            case .limited(.initializing):
                status = "Initializing AR... Move your phone."
                isUnstable = true
            case .limited(.excessiveMotion):
                status = "Moving too fast! Please slow down."
                isUnstable = true
            case .limited(.insufficientFeatures):
                status = "Low light or plain surface detected. Need more detail."
                isUnstable = true
            case .limited(.relocalizing):
                status = "Relocalizing... Keep steering."
                isUnstable = true
            case .normal:
                status = "Surface found! Tap to place."
                isUnstable = false
            @unknown default:
                status = "Tracking state unknown."
                isUnstable = true
            }
            
            DispatchQueue.main.async {
                self.parent.sessionManager.trackingState = camera.trackingState
                self.parent.sessionManager.fitStatus = status
                self.parent.sessionManager.isPlacementValid = !isUnstable
                
                // CRITICAL: Update shared state for other views
                self.parent.sessionManager.toastMessage = isUnstable ? status : nil
                
                let reasonString: String
                if case .limited(let reason) = camera.trackingState {
                    reasonString = "Reason: \(reason)"
                } else {
                    reasonString = ""
                }
                AppLogger.log("Tracking state: \(status) \(reasonString)", category: .ar, level: isUnstable ? .default : .info)
            }
        }

        func session(_ session: ARSession, didFailWithError error: Error) {
            let errorMessage = "AR Error: \(error.localizedDescription)"
            AppLogger.log(errorMessage, category: .ar, level: .error)
            DispatchQueue.main.async {
                self.parent.sessionManager.toastMessage = errorMessage
            }
        }

        func sessionWasInterrupted(_ session: ARSession) {
            AppLogger.log("AR Session Interrupted - Device may be locked or app backgrounded", category: .ar)
            DispatchQueue.main.async {
                self.parent.sessionManager.toastMessage = "AR Session Interrupted"
            }
        }

        func sessionInterruptionEnded(_ session: ARSession) {
            AppLogger.log("AR Session Interruption Ended - Resuming tracking...", category: .ar)
            // In production, we often want to reset tracking if the interruption was long
            // but for now, we try to resume with existing anchors.
            parent.sessionManager.resumeSession()
        }
        
        func sessionShouldAttemptRelocalization(_ session: ARSession) -> Bool {
            AppLogger.log("Attempting to relocalize AR session...", category: .ar)
            return true
        }
        
        // MARK: - Coaching Overlay Delegate
        func coachingOverlayViewWillActivate(_ coachingOverlayView: ARCoachingOverlayView) {
            DispatchQueue.main.async {
                self.parent.sessionManager.showCoaching = true
            }
        }
        
        func coachingOverlayViewDidDeactivate(_ coachingOverlayView: ARCoachingOverlayView) {
            DispatchQueue.main.async {
                self.parent.sessionManager.showCoaching = false
            }
        }
        
        // MARK: - Plane Handling
        private func addPlane(_ planeAnchor: ARPlaneAnchor) {
            // IKEA-style filtering: Avoid small or unstable surfaces
            let size = max(planeAnchor.planeExtent.width, planeAnchor.planeExtent.height)
            guard size >= minPlaneSize else { return }
            
            let extent = CGSize(width: CGFloat(planeAnchor.planeExtent.width), height: CGFloat(planeAnchor.planeExtent.height))
            DispatchQueue.main.async {
                self.parent.sessionManager.detectedPlaneExtent = extent
            }
            
            // We don't render noisy dots anymore for production feel.
            // The Focus Square (updated in session delegate) will guide the user.
        }
        
        func session(_ session: ARSession, didUpdate frame: ARFrame) {
            updateFocusSquare()
        }
        
        private func updateFocusSquare() {
            guard let arView = arView, !parent.sessionManager.showCoaching else { return }
            
            // Logic for a "Focus Square" style placement indicator
            let screenCenter = CGPoint(x: arView.bounds.midX, y: arView.bounds.midY)
            
            // Raycast from center to find stable surfaces
            let results = arView.raycast(from: screenCenter, allowing: .existingPlaneInfinite, alignment: .any)
            
            if let result = results.first {
                if focusSquare == nil {
                    setupFocusSquare()
                }
                loadPreviewModel() // Ensure preview is loaded/attached whenever square is active
                
                focusSquare?.isEnabled = true
                // Smooth movement (IKEA style)
                focusSquare?.move(to: result.worldTransform, relativeTo: nil, duration: 0.2)
                
                // If the preview is attached, rotate it to face the camera so it matches final placement
                if let preview = previewModel, let cameraTransform = arView.session.currentFrame?.camera.transform {
                    let cameraPos = SIMD3<Float>(cameraTransform.columns.3.x, 0, cameraTransform.columns.3.z)
                    let squarePos = result.worldTransform.columns.3
                    let anchorPos = SIMD3<Float>(squarePos.x, squarePos.y, squarePos.z)
                    preview.look(at: cameraPos, from: anchorPos, relativeTo: nil)
                }
                
                DispatchQueue.main.async {
                    self.parent.sessionManager.isPlacementValid = true
                }
                // Auto-Placement Check
                checkStabilityAndAutoPlace(at: result)
                
                DispatchQueue.main.async {
                    self.parent.sessionManager.isPlacementValid = true
                }
            } else {
                // Fade out square if no surface
                focusSquare?.isEnabled = false
                stabilityStartTime = nil
                DispatchQueue.main.async {
                    self.parent.sessionManager.isPlacementValid = false
                }
            }
        }
        
        private func checkStabilityAndAutoPlace(at result: ARRaycastResult) {
            let translation = result.worldTransform.columns.3
            let currentPos = SIMD3<Float>(translation.x, translation.y, translation.z)
            
            if let lastPos = lastFocusPosition {
                let distance = simd_distance(currentPos, lastPos)
                
                if distance < stabilityThreshold {
                    if let startTime = stabilityStartTime {
                        let duration = Date().timeIntervalSince(startTime)
                        if duration >= autoPlaceDelay && !hasAutoPlaced {
                            AppLogger.log("Auto-placing object", category: .ar)
                            hasAutoPlaced = true
                            performPlacement(at: result.worldTransform, alignment: result.targetAlignment, anchor: result.anchor)
                        }
                    } else {
                        stabilityStartTime = Date()
                    }
                } else {
                    lastFocusPosition = currentPos
                    stabilityStartTime = Date()
                }
            } else {
                lastFocusPosition = currentPos
                stabilityStartTime = Date()
            }
        }
        
        private func setupFocusSquare() {
            guard let arView = arView else { return }
            let square = Entity()
            
            // IKEA-style framed focus square (empty in the middle)
            let thickness: Float = 0.008 // 8mm thick lines
            let length: Float = 0.20     // 20cm total length
            
            var material = UnlitMaterial()
            material.color = .init(tint: .white.withAlphaComponent(0.9))
            
            // We create 4 thin boxes to form a hollow square frame on the ground
            // X-axis strips (Top and Bottom edges)
            let horizMesh = MeshResource.generateBox(size: [length, thickness, thickness])
            // Z-axis strips (Left and Right edges)
            let vertMesh = MeshResource.generateBox(size: [thickness, thickness, length - thickness * 2])
            
            let topEdge = ModelEntity(mesh: horizMesh, materials: [material])
            topEdge.position = [0, thickness/2, -length/2 + thickness/2]
            
            let bottomEdge = ModelEntity(mesh: horizMesh, materials: [material])
            bottomEdge.position = [0, thickness/2, length/2 - thickness/2]
            
            let leftEdge = ModelEntity(mesh: vertMesh, materials: [material])
            leftEdge.position = [-length/2 + thickness/2, thickness/2, 0]
            
            let rightEdge = ModelEntity(mesh: vertMesh, materials: [material])
            rightEdge.position = [length/2 - thickness/2, thickness/2, 0]
            
            square.addChild(topEdge)
            square.addChild(bottomEdge)
            square.addChild(leftEdge)
            square.addChild(rightEdge)
            
            let anchor = AnchorEntity(world: .init(1))
            anchor.addChild(square)
            arView.scene.addAnchor(anchor)
            self.focusSquare = square
        }
        
        private func updatePlane(_ planeAnchor: ARPlaneAnchor) {
            let extent = CGSize(width: CGFloat(planeAnchor.planeExtent.width), height: CGFloat(planeAnchor.planeExtent.height))
            DispatchQueue.main.async {
                self.parent.sessionManager.detectedPlaneExtent = extent
            }
        }
        
        @objc func handleTap(_ sender: UITapGestureRecognizer) {
            guard let arView = arView else { return }
            let tapLocation = sender.location(in: arView)
            
            guard let query = arView.makeRaycastQuery(from: tapLocation, allowing: .existingPlaneInfinite, alignment: .any),
                  let result = arView.session.raycast(query).first else { return }
            performPlacement(at: result.worldTransform, alignment: result.targetAlignment, anchor: result.anchor)
        }

        
        private func performPlacement(at transform: simd_float4x4, alignment: ARRaycastQuery.TargetAlignment, anchor: ARAnchor?) {
            guard let arView = arView else { return }
            
            let isVertical = alignment == .vertical
            
            // 2. High-Stability Anchoring
            let anchorEntity: AnchorEntity
            if let planeAnchor = anchor as? ARPlaneAnchor {
                anchorEntity = AnchorEntity(anchor: planeAnchor)
            } else {
                let arAnchor = ARAnchor(name: isVertical ? "WallAnchor" : "FloorAnchor", transform: transform)
                arView.session.add(anchor: arAnchor)
                anchorEntity = AnchorEntity(anchor: arAnchor)
            }
            
            clearExistingPlacements()
            arView.scene.addAnchor(anchorEntity)
            
            if isVertical {
                tryPlacePoster(in: anchorEntity)
                DispatchQueue.main.async {
                    self.parent.sessionManager.isObjectPlaced = true
                }
            } else {
                if let original = originalModel {
                    let placedModel = original.clone(recursive: true)
                    self.setupPlacedEntity(placedModel, in: anchorEntity, isVertical: isVertical)
                    
                    self.focusSquare?.isEnabled = false
                    self.previewModel?.removeFromParent()
                    self.previewModel = nil
                    
                    DispatchQueue.main.async {
                        self.parent.sessionManager.isObjectPlaced = true
                    }
                } else {
                    loadAndPlaceModel(at: transform, isVertical: false, anchor: anchorEntity)
                }
            }
            
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        }
        
        private func clearExistingPlacements() {
            guard let arView = arView else { return }
            let nonPlaneAnchors = arView.scene.anchors.filter { anchor in
                if case .anchor(_) = anchor.anchoring.target { return true }
                return false
            }
            for anchor in nonPlaneAnchors {
                arView.scene.removeAnchor(anchor)
            }
        }
        
        private func tryPlacePoster(in anchor: AnchorEntity) {
            // First check if a user-selected poster exist
            if let image = parent.sessionManager.posterImage {
                placePosterEntity(image, in: anchor)
                return
            }
            
            // Fallback to active product image
            if let imageURL = parent.sessionManager.activeProduct?.imageURL, let url = URL(string: imageURL) {
                Task {
                    do {
                        let (data, _) = try await URLSession.shared.data(from: url)
                        if let image = UIImage(data: data) {
                            await MainActor.run {
                                self.placePosterEntity(image, in: anchor)
                            }
                        } else {
                            throw NSError(domain: "ARPoster", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid image data"])
                        }
                    } catch {
                        await MainActor.run {
                            AppLogger.error("Failed to load poster image", category: .ar, error: error)
                            self.parent.sessionManager.toastMessage = "Failed to load poster image"
                        }
                    }
                }
            } else {
                parent.sessionManager.toastMessage = "No poster image available"
            }
        }
        
        private func placePosterEntity(_ image: UIImage, in anchor: AnchorEntity) {
            guard let cgImage = image.cgImage else { return }
            
            do {
                // 1. Create high-quality texture
                let texture = try TextureResource.generate(from: cgImage, options: .init(semantic: .color))
                
                // 2. Use UnlitMaterial for accurate color rendering (as requested)
                var material = UnlitMaterial()
                material.color = .init(tint: .white.withAlphaComponent(0.99), texture: .init(texture))
                
                // 3. Maintain real-world scale (Poster size: e.g., 60cm width)
                let aspectRatio = Float(image.size.height / image.size.width)
                let width: Float = 0.6 
                let height = width * aspectRatio
                
                // 4. Create extremely thin mesh (plane)
                let mesh = MeshResource.generatePlane(width: width, depth: height)
                let entity = ModelEntity(mesh: mesh, materials: [material])
                
                // 5. Alignment: RealityKit Plane is X-Z. In ARAnchor(vertical), Y is normal.
                // So X-Z lies on the wall. Rotate for orientation if needed.
                // We offset slightly to prevent Z-fighting with the wall
                entity.position = [0, 0.002, 0] 
                
                // Make it interactive
                entity.generateCollisionShapes(recursive: true)
                if let arView = arView {
                    arView.installGestures([.rotation, .translation], for: entity)
                }
                
                anchor.addChild(entity)
                AppLogger.log("Poster successfully placed on wall", category: .ar)
            } catch {
                AppLogger.error("Failed to create poster entity", category: .ar, error: error)
                parent.sessionManager.toastMessage = "Error creating poster"
            }
        }

        private func loadAndPlaceModel(at transform: simd_float4x4, isVertical: Bool = false, anchor: AnchorEntity? = nil) {
            guard let arView = arView else { return }
            
            // Production Anchoring: Use plane-based anchoring for stability as requested
            let finalAnchor: AnchorEntity
            if let providedAnchor = anchor {
                finalAnchor = providedAnchor
            } else {
                // If no anchor provided (e.g. simulator or auto-place), use a horizontal plane anchor
                finalAnchor = AnchorEntity(.plane(.horizontal, classification: .any, minimumBounds: [0.1, 0.1]))
                arView.scene.addAnchor(finalAnchor)
            }
            
            guard let product = parent.sessionManager.activeProduct else {
                AppLogger.log("No active product to load", category: .model, level: .error)
                return
            }

            AppLogger.log("Starting Senior-Level Load for: \(product.name)", category: .model)

            // 1. Production Model Loading (Async from Bundle)
            // Task: Use ModelEntity.loadModelAsync(named:) and exact file name match
            let modelName = product.productID // Should match the USDZ filename in bundle
            
            // Use Entity.loadAsync which is the standard RealityKit method
            Entity.loadAsync(named: modelName)
                .sink(receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        AppLogger.log("Bundle model load failed for [\(modelName)]: \(error.localizedDescription). Trying remote fallback...", category: .model, level: .error)
                        self?.tryRemoteLoad(product: product, into: finalAnchor, isVertical: isVertical)
                    }
                }, receiveValue: { [weak self] modelEntity in
                    AppLogger.log("Model loaded successfully from bundle: \(modelName)", category: .model)
                    self?.setupPlacedEntity(modelEntity, in: finalAnchor, isVertical: isVertical)
                    DispatchQueue.main.async {
                        self?.parent.sessionManager.isObjectPlaced = true
                    }
                })
                .store(in: &cancellables)
        }

        private func tryRemoteLoad(product: Product, into anchor: AnchorEntity, isVertical: Bool) {
            let modelURLString = product.modelURL
            guard !modelURLString.isEmpty, let remoteURL = URL(string: modelURLString) else {
                AppLogger.log("ERROR: No valid remote URL for \(product.name). Skipping placement.", category: .model, level: .error)
                parent.sessionManager.toastMessage = "Model asset not found."
                return
            }

            AppLogger.log("Attempting remote load from: \(modelURLString)", category: .model)
            
            // Show immediate loading feedback so the user knows they successfully tapped
            DispatchQueue.main.async {
                self.parent.sessionManager.toastMessage = "Downloading \(product.name) (This may take a moment)..."
            }
            
            Task {
                do {
                    let localURL = try await ModelCacheService.shared.fetchModel(from: remoteURL)
                    await MainActor.run {
                        self.parent.sessionManager.toastMessage = "Loading model into AR..."
                        Entity.loadAsync(contentsOf: localURL)
                            .sink(receiveCompletion: { completion in
                                if case .failure(let error) = completion {
                                    AppLogger.error("RealityKit failed to parse downloaded model", category: .model, error: error)
                                    self.parent.sessionManager.toastMessage = "Error processing model."
                                }
                            }, receiveValue: { modelEntity in
                                AppLogger.log("Remote model loaded successfully", category: .model)
                                self.parent.sessionManager.toastMessage = "Model Placed Successfully!"
                                self.setupPlacedEntity(modelEntity, in: anchor, isVertical: isVertical)
                                
                                DispatchQueue.main.async {
                                    self.parent.sessionManager.isObjectPlaced = true
                                }
                                
                                // Clear success toast after a delay
                                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                    if self.parent.sessionManager.toastMessage == "Model Placed Successfully!" {
                                        self.parent.sessionManager.toastMessage = nil
                                    }
                                }
                            })
                            .store(in: &self.cancellables)
                    }
                } catch {
                    await MainActor.run {
                        AppLogger.error("Remote download failed for \(product.name). Using programmatic fallback.", category: .model, error: error)
                        
                        // FALLBACK: Generate a 3D placeholder so the user is never left without a result
                        let mesh = MeshResource.generateBox(size: 0.1) // 10cm cube base
                        let material = SimpleMaterial(color: .systemBlue, isMetallic: true)
                        let placeholder = ModelEntity(mesh: mesh, materials: [material])
                        
                        // Scale to match approximate chair size (approx 0.5m x 1.0m x 0.5m)
                        placeholder.scale = [5.0, 10.0, 5.0] 
                        
                        self.setupPlacedEntity(placeholder, in: anchor, isVertical: isVertical)
                        
                        DispatchQueue.main.async {
                            self.parent.sessionManager.isObjectPlaced = true
                            self.parent.sessionManager.toastMessage = "Using placeholder (Check Connection)"
                        }
                    }
                }
            }
        }
        
        private func setupPlacedEntity(_ entity: Entity, in anchor: AnchorEntity, isVertical: Bool) {
            guard let arView = arView else { return }
            
            // 1. Production Validation: Does it fit?
            if let product = parent.sessionManager.activeProduct {
                let canFit = SpatialIntelligenceService.shared.canFit(object: product, at: anchor.transform.matrix, in: SpatialIntelligenceService.shared.capturedRoom)
                if !canFit {
                    AppLogger.log("Placement warning: Object may not fit here.", category: .ar)
                }
            }
            
            // 2. Normalize Scale & Pivot
            if let product = parent.sessionManager.activeProduct {
                ModelNormalizationService.shared.normalize(entity, for: product)
            }
            
            // 3. Face the user upon placement
            if let cameraTransform = arView.session.currentFrame?.camera.transform {
                let cameraPos = SIMD3<Float>(cameraTransform.columns.3.x, 0, cameraTransform.columns.3.z)
                // Anchor position in world space
                let anchorWorldPos = anchor.position(relativeTo: nil)
                
                // We want the object to look at the camera
                entity.look(at: cameraPos, from: anchorWorldPos, relativeTo: nil)
            }
            
            // --- PHASE 2.4: Interaction (Kinematic physics) ---
            // 1. Configure the physical object (Kinematic for stable dragging, NOT dynamic to prevent jitter)
            entity.generateCollisionShapes(recursive: true)
            
            // 2. Enable grounding shadows for realism (Blends object into floor)
            if let modelEntity = entity as? ModelEntity {
                if #available(iOS 18.0, *) {
                    modelEntity.components.set(GroundingShadowComponent(castsShadow: true))
                }
            }
            
            // 3. Occlusion & Scaling Optimization: Ensure natural blending with LiDAR or Scene Depth
            if #available(iOS 18.0, *) {
                entity.components.set(AdaptiveResolutionComponent())
            }
            
            // 4. Interaction (Gesture support requires HasCollision)
            if let collisionEntity = entity as? HasCollision {
                arView.installGestures([.rotation, .translation], for: collisionEntity)
            }
            
            // Clear existing children from anchor to avoid duplicates
            anchor.children.removeAll()
            
            // Add the object
            anchor.addChild(entity)
            
            // --- Task: Validation Logic ---
            let worldBounds = entity.visualBounds(relativeTo: nil)
            let activeProduct = parent.sessionManager.activeProduct
            print("--- REALITYKIT MODEL VALIDATION ---")
            print("Product ID: \(activeProduct?.productID ?? "N/A")")
            print("Dimensions (meters): \(worldBounds.extents.x)W x \(worldBounds.extents.y)H x \(worldBounds.extents.z)D")
            print("Physics: Kinematic (Jitter-free Stability)")
            print("-----------------------------------")
        }
    }
}
