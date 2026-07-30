import SwiftUI
import ARKit

struct ARPlacementView: View {
    @StateObject private var viewModel = ARViewModel()
    @ObservedObject var sessionManager = ARSessionManager.shared
    @State private var showInitialToast = true
    @State private var objectPlaced = false
    @State private var isFinalized = false
    
    // NAVIGATION STATES
    @State private var show3DViewer = false
    @State private var showGallery = false
    
    var isSimulator: Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }

    var body: some View {
        ZStack {
            // 1. Live AR Camera View (Full Screen)
            Group {
                if !isSimulator {
                    ARViewContainer()
                } else {
                    SimulatorBackgroundView()
                        .onTapGesture {
                            withAnimation(.spring()) {
                                objectPlaced = true
                            }
                        }
                    
                    if objectPlaced {
                        // Visual placeholder for simulator
                        VStack {
                            Spacer()
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white, lineWidth: 5)
                                .frame(width: 160, height: 80)
                                .rotation3DEffect(Angle(degrees: 75), axis: (x: 1, y: 0, z: 0))
                                .offset(y: 140)
                                .overlay(
                                    Image(systemName: "cube.fill")
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 120, height: 120)
                                        .foregroundColor(.white.opacity(0.8))
                                        .offset(y: -60)
                                )
                                .padding(.bottom, 250)
                                .shadow(color: .black.opacity(0.3), radius: 20, y: 10)
                        }
                    }
                }
            }
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // 2. Top Navigation Bar
                HStack {
                    Button(action: {
                        viewModel.resetSession()
                        sessionManager.navigationPath = NavigationPath()
                    }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .padding(12)
                            .background(Circle().fill(Color.black.opacity(0.35)))
                    }
                    
                    Spacer()
                    
                    if objectPlaced && !showGallery && !isFinalized {
                        // "Done" button to show the save footer (New production workflow)
                        Button(action: {
                            withAnimation(.spring()) {
                                isFinalized = true
                            }
                        }) {
                            Text("Done")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Capsule().fill(Color.blue))
                        }
                    } else if !isFinalized {
                        Button(action: { }) {
                            Image(systemName: "ellipsis")
                                .rotationEffect(.degrees(90))
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.white)
                                .padding(12)
                                .background(Circle().fill(Color.black.opacity(0.3)))
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                
                if !objectPlaced {
                    // 2.5 Scanning Instructions (Center-aligned as per screenshot)
                    VStack {
                        Spacer()
                        Text("Point your phone down at an empty space and move it around slowly")
                            .font(.system(size: 24, weight: .medium))
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                            .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)
                        Spacer()
                    }
                    .frame(maxWidth: .infinity)
                }
                
                Spacer()
                
                // 3. Middle Feedback (Tracking Alerts)
                if let msg = sessionManager.toastMessage {
                    let isSuccess = msg.contains("saved") || msg.contains("Success")
                    HStack {
                        Image(systemName: isSuccess ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                            .foregroundColor(isSuccess ? .blue : .yellow)
                        Text(msg)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(isSuccess ? Color.blue : (sessionManager.trackingState == .normal ? Color.blue : Color.yellow), lineWidth: 1))
                    .padding(.bottom, 20)
                }

                if isFinalized {
                    // FOOTER: Confirmation State
                    VStack(spacing: 12) {
                        Button(action: {
                            viewModel.startCapture()
                        }) {
                            Text("Save")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 18)
                                .background(RoundedRectangle(cornerRadius: 18).fill(Color.blue))
                        }
                        
                        Button(action: {
                            viewModel.resetSession()
                            sessionManager.navigationPath = NavigationPath()
                        }) {
                            Text("Back to Placement")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 18)
                                .background(RoundedRectangle(cornerRadius: 18).fill(Color(white: 0.15)))
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 24)
                    .padding(.bottom, 40)
                    .background(Color(red: 0.05, green: 0.07, blue: 0.1).ignoresSafeArea())
                    .transition(.move(edge: .bottom))
                } else {
                    // 4. Bottom Controls
                    HStack(spacing: 0) {
                        // LEFT: Product Selector
                        Button(action: { show3DViewer = true }) {
                            ZStack {
                                Circle()
                                    .fill(Color.black.opacity(0.4))
                                    .frame(width: 56, height: 56)
                                Image(systemName: "cube.transparent")
                                    .font(.system(size: 24))
                                    .foregroundColor(.white)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    
                    // CENTER: Shutter Control (Only visible after placement)
                    Group {
                        if objectPlaced {
                            Button(action: { handleShutterTap() }) {
                                ZStack {
                                    Circle()
                                        .stroke(Color.white, lineWidth: 4)
                                        .frame(width: 84, height: 84)
                                    Circle()
                                        .fill(Color.white)
                                        .frame(width: 70, height: 70)
                                        .scaleEffect(sessionManager.requestSnapshot ? 0.9 : 1.0)
                                }
                            }
                            .transition(.scale.combined(with: .opacity))
                        } else {
                            // Empty spacer to maintain layout
                            Spacer()
                                .frame(width: 84)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    
                    // RIGHT: Gallery
                    Button(action: { showGallery = true }) {
                        ZStack {
                            Circle()
                                .fill(Color.black.opacity(0.4))
                                .frame(width: 56, height: 56)
                            if let lastImage = sessionManager.capturedImages.last {
                                Image(uiImage: lastImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 52, height: 52)
                                    .clipShape(Circle())
                                    .overlay(Circle().stroke(Color.white, lineWidth: 1.5))
                            } else {
                                Image(systemName: "photo.on.rectangle")
                                    .font(.system(size: 22))
                                    .foregroundColor(.white)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .trailing)
                }
                .padding(.horizontal, 30)
                .padding(.bottom, 40)
                .transition(.opacity)
                }
            }
            
            // 5. Flash Effect Overlay
            if sessionManager.requestSnapshot {
                Color.white
                    .ignoresSafeArea()
                    .opacity(0.8)
                    .transition(.opacity)
            }
        }
        .statusBar(hidden: true)
        .navigationBarHidden(true)
        .onAppear {
            if sessionManager.isObjectPlaced {
                objectPlaced = true
            }
        }
        .onChange(of: sessionManager.isObjectPlaced) { _, placed in
            withAnimation(.spring()) {
                self.objectPlaced = placed
                if !placed {
                    self.isFinalized = false
                }
            }
        }
        .fullScreenCover(isPresented: $show3DViewer) {
            Product3DPreview()
        }
        .fullScreenCover(isPresented: $showGallery) {
            GalleryView()
        }
    }
    
    private func handleShutterTap() {
        // Center button: Unified Capture Behavior
        // As requested: Always save the image to captured images/history
        AppLogger.log("Shutter tapped: Capturing photo", category: .ar)
        viewModel.startCapture()
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
}

#Preview {
    ARPlacementView()
}
