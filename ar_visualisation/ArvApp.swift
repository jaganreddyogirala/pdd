import SwiftUI

@main
struct ar_visualisationApp: App {
    @ObservedObject var sessionManager = ARSessionManager.shared
    @Environment(\.scenePhase) var scenePhase
    
    var body: some Scene {
        WindowGroup {
            NavigationStack(path: $sessionManager.navigationPath) {
                ProductListView()
                    .navigationDestination(for: AppRoute.self) { route in
                        switch route {
                        case .productList:
                            ProductListView()
                        case .productDetail(let product):
                            ProductDetailView(product: product)
                        case .permission:
                            PermissionView()
                        case .placement:
                            ARPlacementView()
                        }
                    }
                    .onReceive(NotificationCenter.default.publisher(for: UIApplication.didReceiveMemoryWarningNotification)) { _ in
                        sessionManager.handleMemoryPressure()
                    }
            }
            .onOpenURL { url in
                handleDeepLink(url)
            }
        }
        .onChange(of: scenePhase) { _, newPhase in
            switch newPhase {
            case .active:
                sessionManager.resumeSession()
                sessionManager.loadWorldMap() // Persistence: Restore world map
            case .background, .inactive:
                sessionManager.saveWorldMap() // Persistence: Save state
                sessionManager.pauseSession()
            @unknown default:
                break
            }
        }
    }
    
    private func handleDeepLink(_ url: URL) {
        print("Deep link received: \(url.absoluteString)")
        
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true),
              let host = url.host, host == "open" else {
            print("Invalid deep link scheme or host.")
            return
        }
        
        // Parse parameters
        let queryItems = components.queryItems ?? []
        let name = queryItems.first(where: { $0.name == "name" })?.value ?? "Unknown Product"
        let widthStr = queryItems.first(where: { $0.name == "width" })?.value ?? "0"
        let heightStr = queryItems.first(where: { $0.name == "height" })?.value ?? "0"
        let depthStr = queryItems.first(where: { $0.name == "depth" })?.value ?? "0"
        let modelURL = queryItems.first(where: { $0.name == "model_url" })?.value ?? ""
        
        // Convert numeric values safely
        let width = Double(widthStr) ?? 0.0
        let height = Double(heightStr) ?? 0.0
        let depth = Double(depthStr) ?? 0.0
        
        let p = Product(
            productID: "external_\(UUID().uuidString.prefix(6))",
            name: name,
            description: "Product imported from deep link.",
            material: "Imported Material",
            dimensions: "\(width) x \(height) x \(depth) cm",
            weight: "N/A",
            assembly: "N/A",
            imageURL: nil,
            modelURL: modelURL,
            scale: 1.0,
            surfaceType: nil
        )
        
        DispatchQueue.main.async {
            sessionManager.activeProduct = p
            // Directly push to scanning via path
            sessionManager.navigationPath.append(AppRoute.permission)
        }
    }
}
