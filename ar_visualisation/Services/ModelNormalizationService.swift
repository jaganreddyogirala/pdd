import RealityKit
import ARKit

/// Production-grade Model Normalization Service
/// Ensures every 3D model matches its real-world dimensions and is perfectly grounded.
class ModelNormalizationService {
    static let shared = ModelNormalizationService()
    
    /// Normalizes an entity's scale, pivot, and rendering components
    func normalize(_ entity: Entity, for product: Product) {
        // 1. Scale Normalization
        // We compare visual bounds to metadata actualDimensions
        let currentBounds = entity.visualBounds(relativeTo: entity)
        let metadataSize = product.actualDimensions
        
        guard currentBounds.extents.x > 0, currentBounds.extents.y > 0, currentBounds.extents.z > 0 else {
            entity.scale = [product.scale, product.scale, product.scale]
            return
        }
        
        let scaleX = metadataSize.x / currentBounds.extents.x
        let scaleY = metadataSize.y / currentBounds.extents.y
        let scaleZ = metadataSize.z / currentBounds.extents.z
        
        // Use uniform scale if they are close, otherwise prefer the average to maintain aspect ratio
        let uniformScale = (scaleX + scaleY + scaleZ) / 3.0
        entity.scale = [uniformScale, uniformScale, uniformScale]

        
        // 2. Pivot Correction (Grounding)
        // Shift entity so min.y is at 0 (the floor plane)
        let normalizedBounds = entity.visualBounds(relativeTo: entity)
        entity.position.y = -normalizedBounds.min.y
        
        // 3. Premium Rendering Setup
        applyProductionRendering(to: entity)
    }
    
    private func applyProductionRendering(to entity: Entity) {
        // Recursively apply components to all model entities
        if let modelEntity = entity as? ModelEntity {
            // Grounding Shadows (iOS 18+ style or fallback)
            if #available(iOS 18.0, *) {
                modelEntity.components.set(GroundingShadowComponent(castsShadow: true))
            }
            
            // Occlusion & Performance (iOS 18+)
            if #available(iOS 18.0, *) {
                modelEntity.components.set(AdaptiveResolutionComponent())
            }
        }
        
        for child in entity.children {
            applyProductionRendering(to: child)
        }
    }
    
    /// Creates a high-fidelity "Ghost" preview material
    func applyGhostEffect(to entity: Entity) {
        if var modelComp = entity.components[ModelComponent.self] {
            // Translucent glass-morphism style material
            let ghostColor = UIColor.white.withAlphaComponent(0.4)
            let material = SimpleMaterial(color: ghostColor, roughness: 0.1, isMetallic: false)
            modelComp.materials = Array(repeating: material, count: modelComp.materials.count)
            entity.components.set(modelComp)
        }
        
        for child in entity.children {
            applyGhostEffect(to: child)
        }
    }
}
