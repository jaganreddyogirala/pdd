import Foundation
import SwiftUI
import Combine

class ProductDetailViewModel: ObservableObject {
    let product: Product
    @Published var isLoading = false
    @Published var errorMessage: String? = nil
    
    private let apiService = APIService.shared
    private let sessionManager = ARSessionManager.shared
    
    init(product: Product) {
        self.product = product
    }
    
    @MainActor
    func startARSession() async {
        isLoading = true
        errorMessage = nil
        
        // Immediately navigate to the AR experience for maximum responsiveness
        sessionManager.currentSessionID = "demo_session_\(UUID().uuidString.prefix(4))"
        sessionManager.activeProduct = product
        sessionManager.navigationPath.append(AppRoute.permission)
        isLoading = false
        
        // Inform the backend in the background so no loading lag occurs
        Task.detached {
            do {
                let sessionID = try await self.apiService.startSession(
                    hostAppId: "ar_ios_app",
                    productId: self.product.productID,
                    productName: self.product.name,
                    modelURL: self.product.modelURL,
                    scale: self.product.scale
                )
                // Optionally update to the real session ID later
                await MainActor.run {
                    self.sessionManager.currentSessionID = sessionID
                }
            } catch {
                print("Failed to start session in background: \(error)")
            }
        }
    }
}
