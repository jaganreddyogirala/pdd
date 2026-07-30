import SwiftUI
import RealityKit
import Combine
import os

struct Product3DPreview: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var sessionManager = ARSessionManager.shared
    
    var body: some View {
        ZStack {
            // Premium Dark Background
            Color(white: 0.05).ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Combined Header: Modern Icons + Preserved Title
                HStack {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 20, weight: .light))
                            .foregroundColor(.white)
                            .padding(10)
                            .background(Circle().fill(Color.white.opacity(0.1)))
                    }
                    
                    Spacer()
                    
                    Text(sessionManager.activeProduct?.name ?? "3D Preview")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Button {
                        // Options menu
                    } label: {
                        Image(systemName: "ellipsis")
                            .font(.system(size: 20, weight: .light))
                            .foregroundColor(.white)
                            .padding(10)
                            .background(Circle().fill(Color.white.opacity(0.1)))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                
                Spacer()
                
                // 3D Model Renderer
                Simple3DView()
                    .edgesIgnoringSafeArea(.all)
                
                Spacer()
                
                // Interaction Instruction
                Text("Pinch to zoom • Drag to rotate")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white.opacity(0.4))
                    .padding(.bottom, 24)
                
                // "View in your space" button: Glassmorphic refinement
                Button {
                    dismiss() 
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "arkit")
                            .font(.system(size: 22))
                        Text("View in your space")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundColor(.blue)
                    .padding(.horizontal, 28)
                    .padding(.vertical, 14)
                    .background(
                        Capsule()
                            .fill(Color.black.opacity(0.4))
                            .overlay(
                                Capsule()
                                    .stroke(Color.blue.opacity(0.5), lineWidth: 1.5)
                            )
                    )
                    .shadow(color: Color.blue.opacity(0.3), radius: 15)
                }
                .padding(.bottom, 50)
            }
        }
        .navigationBarHidden(true)
    }
}

struct Simple3DView: UIViewRepresentable {
    @ObservedObject var sessionManager = ARSessionManager.shared
    
    class Coordinator {
        var cancellables = Set<AnyCancellable>()
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero, cameraMode: .nonAR, automaticallyConfigureSession: false)
        arView.backgroundColor = .clear // Transparent background to show the SwiftUI Color
        
        // 1. Setup Lighting
        let lighting = AnchorEntity(world: [2, 2, 2])
        lighting.addChild(DirectionalLight())
        arView.scene.addAnchor(lighting)
        
        let ambient = AnchorEntity(world: [0, 0, 0])
        let light = PointLight()
        light.light.intensity = 1000
        ambient.addChild(light)
        arView.scene.addAnchor(ambient)
        
        // 2. Load Model
        loadModel(into: arView, coordinator: context.coordinator)
        
        return arView
    }
    
    private func loadModel(into arView: ARView, coordinator: Coordinator) {
        guard let product = sessionManager.activeProduct else { return }
        
        let modelName = product.productID
        AppLogger.log("Previewing model: \(modelName)", category: .model)
        
        // Use Entity.loadAsync which is the standard RealityKit method
        Entity.loadAsync(named: modelName)
            .sink(receiveCompletion: { completion in
                if case .failure(let error) = completion {
                    AppLogger.log("Preview load failed: \(error.localizedDescription)", category: .model, level: .error)
                    // If bundle fails, try remote
                    self.tryRemoteLoad(product: product, into: arView, coordinator: coordinator)
                }
            }, receiveValue: { entity in
                self.setupPreviewEntity(entity, in: arView)
            })
            .store(in: &coordinator.cancellables)
    }
    
    private func tryRemoteLoad(product: Product, into arView: ARView, coordinator: Coordinator) {
        guard let url = URL(string: product.modelURL) else { return }
        
        Entity.loadAsync(contentsOf: url)
            .sink(receiveCompletion: { _ in }, receiveValue: { entity in
                self.setupPreviewEntity(entity, in: arView)
            })
            .store(in: &coordinator.cancellables)
    }
    
    private func setupPreviewEntity(_ entity: Entity, in arView: ARView) {
        let anchor = AnchorEntity(world: [0, 0, 0])
        
        // Pivot Correction
        let bounds = entity.visualBounds(relativeTo: entity)
        entity.position.y -= bounds.min.y
        
        // Uniform Scale
        let scale = sessionManager.activeProduct?.scale ?? 1.0
        entity.scale = [scale, scale, scale]
        
        anchor.addChild(entity)
        arView.scene.addAnchor(anchor)
        
        entity.generateCollisionShapes(recursive: true)
        if let collisionEntity = entity as? HasCollision {
            arView.installGestures([.rotation, .scale], for: collisionEntity)
        }
        
        AppLogger.log("Preview model placed and grounded", category: .model)
    }
    
    func updateUIView(_ uiView: ARView, context: Context) {}
}

#Preview {
    Product3DPreview()
}
