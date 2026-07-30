import Foundation
import AVFoundation
import ARKit
import Combine

class PermissionService: ObservableObject {
    static let shared = PermissionService()
    
    @Published var cameraStatus: AVAuthorizationStatus = .notDetermined
    @Published var isARSupported: Bool = true
    
    init() {
        checkCameraPermission()
        checkARSupport()
    }
    
    func checkCameraPermission() {
        cameraStatus = AVCaptureDevice.authorizationStatus(for: .video)
    }
    
    func requestCameraPermission() async -> Bool {
        let granted = await AVCaptureDevice.requestAccess(for: .video)
        DispatchQueue.main.async {
            self.cameraStatus = granted ? .authorized : .denied
        }
        return granted
    }
    
    func checkARSupport() {
        isARSupported = ARWorldTrackingConfiguration.isSupported
    }
    
    func openAppSettings() {
        guard let url = URL(string: UIApplication.openSettingsURLString),
              UIApplication.shared.canOpenURL(url) else { return }
        UIApplication.shared.open(url)
    }
}
