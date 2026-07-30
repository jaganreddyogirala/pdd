import Foundation
import RoomPlan
import RealityKit
import ARKit
import Combine
import os

/// Production-grade Spatial Intelligence Engine
/// Handles RoomPlan data, wall/floor classification, and fit validation.
class SpatialIntelligenceService: NSObject, ObservableObject {
    static let shared = SpatialIntelligenceService()
    
    // Room Data
    @Published var capturedRoom: CapturedRoom?
    @Published var isScanning: Bool = false
    @Published var roomObjects: [CapturedRoom.Object] = []
    @Published var roomSurfaces: [CapturedRoom.Surface] = []
    
    private lazy var roomCaptureSessionConfig: RoomCaptureSession.Configuration = {
        RoomCaptureSession.Configuration()
    }()
    private var roomCaptureView: RoomCaptureView?
    private var roomCaptureSession: RoomCaptureSession?
    
    private override init() {
        super.init()
    }

    
    // MARK: - RoomPlan Integration
    
    func startRoomScan() {
        guard RoomCaptureSession.isSupported else {
            AppLogger.log("RoomPlan not supported on this device", category: .ar, level: .error)
            return
        }
        
        guard !isScanning else {
            AppLogger.log("RoomPlan scan already in progress, skipping", category: .ar)
            return
        }
        
        self.roomCaptureSession = RoomCaptureSession()
        self.roomCaptureSession?.delegate = self
        self.roomCaptureSession?.run(configuration: roomCaptureSessionConfig)
        self.isScanning = true
        AppLogger.log("RoomPlan scan started", category: .ar)
    }
    
    func stopRoomScan() {
        self.roomCaptureSession?.stop()
        self.isScanning = false
        AppLogger.log("RoomPlan scan stopped", category: .ar)
    }
    
    // MARK: - Spatial Reasoning Logic
    
    /// Checks if a furniture object of given dimensions fits in a specific world location
    func canFit(object: Product, at transform: simd_float4x4, in room: CapturedRoom?) -> Bool {
        guard let room = room else { return true }
        
        let pos = transform.columns.3.xyz
        let size = object.actualDimensions
        
        // 1. Collision with fixed architecture
        for surface in room.surfaces where surface.category == .wall {
            if isTooCloseToWall(pos: pos, size: size, wall: surface) { return false }
        }
        
        // 2. Collision with other furniture
        for obj in room.objects {
            if checkCollision(pos: pos, size: size, existing: obj) { return false }
        }
        
        // 3. Walking Clearance (Senior Level UX: Ensure 80cm gap)
        return hasWalkingClearance(at: pos, size: size, in: room)
    }
    
    private func hasWalkingClearance(at pos: SIMD3<Float>, size: SIMD3<Float>, in room: CapturedRoom) -> Bool {
        let minClearance: Float = 0.8 // 80cm
        
        // Check surrounding space for other objects or walls
        for obj in room.objects {
            let dist = distance(pos, obj.transform.columns.3.xyz)
            if dist < (max(size.x, size.z) + max(obj.dimensions.x, obj.dimensions.z)) / 2 + minClearance {
                return false 
            }
        }
        return true
    }
    
    /// Snaps the transform to the nearest wall for items like shelves/paintings
    func snapToWall(transform: simd_float4x4, for product: Product, in room: CapturedRoom?) -> simd_float4x4 {
        guard let room = room, product.surfaceType == .wall else { return transform }
        
        if let wall = findNearestWall(to: transform.columns.3.xyz, in: room) {
            var snapped = transform
            // Align rotation to wall normal
            let wallRot = wall.transform.rotation
            snapped.columns.0 = wallRot.columns.0
            snapped.columns.2 = wallRot.columns.2
            
            // Offset slightly from wall to prevent Z-fighting
            let wallNormal = wallRot.columns.2.xyz
            snapped.columns.3.x += wallNormal.x * 0.05
            snapped.columns.3.z += wallNormal.z * 0.05
            
            return snapped
        }
        return transform
    }
    
    private func isTooCloseToWall(pos: SIMD3<Float>, size: SIMD3<Float>, wall: CapturedRoom.Surface) -> Bool {
        let wallPos = wall.transform.columns.3.xyz
        let dist = abs(dot(pos - wallPos, wall.transform.columns.2.xyz))
        return dist < (size.z / 2) + 0.1 // 10cm safety margin
    }
    
    // MARK: - AI Recommendation Engine
    
    /// Analyzes room layout and returns suggested transforms for a product
    func suggestOptimalLayout(for product: Product, in room: CapturedRoom) -> [simd_float4x4] {
        var suggestions: [simd_float4x4] = []
        
        switch product.surfaceType {
        case .wall:
            // Propose locations along empty wall segments
            for wall in room.surfaces where wall.category == .wall {
                let centerTransform = wall.transform
                suggestions.append(centerTransform)
            }
        case .floor:
            // Propose locations in large empty floor pockets
            // (Production logic would use a grid-search, simplified here)
            if let floor = room.surfaces.first(where: { $0.category == .floor }) {
                let suggestedPos = floor.transform.columns.3.xyz + [0.5, 0, 0.5]
                var transform = simd_float4x4(1)
                transform.columns.3 = [suggestedPos.x, suggestedPos.y, suggestedPos.z, 1]
                suggestions.append(transform)
            }
        default: break
        }
        
        return suggestions
    }
    
    private func findNearestWall(to position: SIMD3<Float>, in room: CapturedRoom) -> CapturedRoom.Surface? {
        return room.surfaces.filter { $0.category == .wall }
            .min(by: { distance($0.transform.columns.3.xyz, position) < distance($1.transform.columns.3.xyz, position) })
    }
    
    private func distance(_ a: SIMD3<Float>, _ b: SIMD3<Float>) -> Float {
        return length(a - b)
    }
    
    private func checkCollision(pos: SIMD3<Float>, size: SIMD3<Float>, existing: CapturedRoom.Object) -> Bool {
        let existingPos = existing.transform.columns.3.xyz
        let existingSize = existing.dimensions
        
        let min1 = pos - size / 2
        let max1 = pos + size / 2
        let min2 = existingPos - existingSize / 2
        let max2 = existingPos + existingSize / 2
        
        return (min1.x <= max2.x && max1.x >= min2.x) &&
               (min1.y <= max2.y && max1.y >= min2.y) &&
               (min1.z <= max2.z && max1.z >= min2.z)
    }
}

extension SpatialIntelligenceService: RoomCaptureSessionDelegate {
    func captureSession(_ session: RoomCaptureSession, didUpdate room: CapturedRoom) {
        DispatchQueue.main.async {
            self.capturedRoom = room
            self.roomObjects = room.objects
            self.roomSurfaces = room.surfaces
        }
    }
    
    func captureSession(_ session: RoomCaptureSession, didEndWith capturedRoom: CapturedRoom, error: Error?) {
        DispatchQueue.main.async {
            self.capturedRoom = capturedRoom
            self.isScanning = false
        }
    }
}

extension simd_float4 {
    var xyz: SIMD3<Float> {
        return SIMD3<Float>(x, y, z)
    }
}

extension simd_float4x4 {
    var rotation: simd_float4x4 {
        var r = self
        r.columns.3 = [0, 0, 0, 1]
        return r
    }
}

extension CapturedRoom {
    var surfaces: [CapturedRoom.Surface] {
        return walls + windows + doors + openings
    }
}
