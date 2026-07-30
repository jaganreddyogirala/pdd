import Foundation
import SwiftUI
import ARKit
import Combine

class ARViewModel: ObservableObject {
    @Published var scanningProgress: Float = 0.0
    @Published var isSurfaceDetected: Bool = false
    @Published var statusMessage: String = "Scanning environment..."
    @Published var showCoachingOverlay: Bool = true
    
    private let sessionManager = ARSessionManager.shared
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupBindings()
    }
    
    private func setupBindings() {
        sessionManager.$detectedPlaneExtent
            .receive(on: DispatchQueue.main)
            .sink { [weak self] extent in
                if extent != nil {
                    self?.isSurfaceDetected = true
                    self?.statusMessage = "Surface found! Tap to place."
                    self?.scanningProgress = 1.0
                }
            }
            .store(in: &cancellables)
            
        sessionManager.$fitStatus
            .receive(on: DispatchQueue.main)
            .sink { [weak self] status in
                self?.statusMessage = status
            }
            .store(in: &cancellables)

            
        #if targetEnvironment(simulator)
        // Simulator Mock: Detect placement confirmation since ARViewContainer is bypasssed
        sessionManager.$shouldConfirmPlacement
            .receive(on: DispatchQueue.main)
            .sink { [weak self] shouldConfirm in
                if shouldConfirm {
                    self?.sessionManager.isObjectPlaced = true
                    self?.sessionManager.shouldConfirmPlacement = false
                    AppLogger.log("Simulator: Object placement confirmed", category: .ar)
                }
            }
            .store(in: &cancellables)
        #endif
    }
    
    func startCapture() {
        sessionManager.requestSnapshot = true
        
        #if targetEnvironment(simulator)
        // Reset the snapshot flag after a delay to clear the white flash in simulator
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            self.sessionManager.requestSnapshot = false
        }
        #endif
    }
    
    func resetSession() {
        sessionManager.resetARSession()
    }
    
    #if targetEnvironment(simulator)
    func runSimulatorMock() {
        // Auto-detect surface in simulator after delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.sessionManager.detectedPlaneExtent = CGSize(width: 1.0, height: 1.0)
            self.sessionManager.isPlacementValid = true
            self.sessionManager.fitStatus = "Simulator: Surface mock detected"
        }
    }
    #endif
}
