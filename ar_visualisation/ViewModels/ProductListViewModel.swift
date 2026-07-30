import Foundation
import SwiftUI
import Combine

class ProductListViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = false
    @Published var errorMessage: String? = nil
    
    private let apiService = APIService.shared
    
    func fetchProducts() async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            let fetchedProducts = try await apiService.fetchProducts()
            await MainActor.run {
                self.products = fetchedProducts
                self.isLoading = false
            }
        } catch {
            AppLogger.log("Failed to fetch live products (\(error.localizedDescription)). Using fallback products.", category: .network, level: .error)
            
            let mockProducts = [
                Product(productID: "chair_exec_001", name: "Ergonomic Office Chair", description: "Design for comfort and support.", material: "Mesh, Metal", dimensions: "27\"W x 25\"D x 45\"H", weight: "35 lbs", assembly: "Required", imageURL: nil, modelURL: "https://developer.apple.com/augmented-reality/quick-look/models/chair/chair.usdz", scale: 1.0, surfaceType: .floor)
            ]
            
            await MainActor.run {
                self.products = mockProducts
                self.isLoading = false
            }
        }
    }

}
