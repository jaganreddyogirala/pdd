 import SwiftUI
import AVFoundation
import Photos
import os

struct PermissionView: View {
    @ObservedObject var sessionManager = ARSessionManager.shared

    var body: some View {
        ZStack {
            Color(red: 13/255, green: 27/255, blue: 42/255)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                // Top Bar with Back Button
                HStack {
                    Button(action: {
                        sessionManager.navigationPath.removeLast()
                    }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color.white.opacity(0.1))
                            .clipShape(Circle())
                    }
                    .padding(.leading, 20)
                    .padding(.top, 20)
                    
                    Spacer()
                }

                // Illustration
                VStack {
                    Image(systemName: "iphone.badge.play")
                        .resizable()
                        .scaledToFit()
                        .frame(height: 180)
                        .foregroundColor(.blue)
                        .padding(.top, 40)
                    
                    Text("Enhance Your Experience")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.top, 20)
                    
                    Text("To fully utilize our AR features, we need access to your camera and storage.")
                        .font(.body)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                        .padding(.top, 8)
                }
                
                Spacer()
                
                // Permission items
                VStack(spacing: 20) {
                    PermissionItemView(icon: "camera.fill", title: "Camera Access", subtitle: "Allows you to visualize products in your space.")
                    PermissionItemView(icon: "photo.on.rectangle.fill", title: "Storage Access", subtitle: "Enables saving and sharing your AR captures.")
                }
                .padding(.horizontal, 20)
                
                Spacer()
                
                // Bottom Button
                Button(action: {
                    requestPermissions()
                }) {
                    Text("Allow Camera & Storage")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
        }
        .statusBar(hidden: true)
        .navigationBarHidden(true)
    }
    
    private func requestPermissions() {
        Task {
            let status = AVCaptureDevice.authorizationStatus(for: .video)
            
            if status == .denied || status == .restricted {
                await MainActor.run {
                    AppLogger.log("Camera permission previously denied - showing settings prompt", category: .ui)
                    sessionManager.toastMessage = "Please enable camera access in Settings."
                    PermissionService.shared.openAppSettings()
                }
                return
            }
            
            let cameraGranted = await PermissionService.shared.requestCameraPermission()
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { _ in }
            
            await MainActor.run {
                if cameraGranted {
                    AppLogger.log("Camera permission granted", category: .ui)
                    sessionManager.navigationPath.append(AppRoute.placement)
                } else {
                    AppLogger.log("Camera permission denied", category: .ui, level: .error)
                    sessionManager.toastMessage = "Camera access is required for AR."
                }
            }
        }
    }
}

struct PermissionItemView: View {
    let icon: String
    let title: String
    let subtitle: String
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(red: 27/255, green: 38/255, blue: 59/255))
                    .frame(width: 56, height: 56)
                Image(systemName: icon)
                    .foregroundColor(.blue)
                    .font(.title2)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
        }
        .padding()
        .background(Color(red: 27/255, green: 38/255, blue: 59/255).opacity(0.5))
        .cornerRadius(16)
    }
}

#Preview {
    PermissionView()
}
