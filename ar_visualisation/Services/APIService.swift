import Foundation
import SwiftUI
import Combine
import os

class APIService {
    static let shared = APIService()
    
    private var baseURL: String { AppConfig.baseURL }
    private let maxRetries = 3
    private let initialDelay: TimeInterval = 1.0
    private let session: URLSession
    
    init(session: URLSession = .shared) {
        self.session = session
    }

    private func createRequest(for url: URL, method: String = "GET", timeout: TimeInterval = 30.0) -> URLRequest {
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = timeout
        return request
    }

    private func performRequest<T: Decodable>(for request: URLRequest, retryCount: Int = 0) async throws -> T {
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw URLError(.badServerResponse)
            }
            
            // Log response status for debugging
            AppLogger.log("API Response: \(httpResponse.statusCode) for \(request.url?.path ?? "unknown")", category: .network)
            
            if (200...299).contains(httpResponse.statusCode) {
                return try JSONDecoder().decode(T.self, from: data)
            } else if (500...599).contains(httpResponse.statusCode) && retryCount < maxRetries {
                // Retry only for server errors
                let delay = initialDelay * pow(2.0, Double(retryCount))
                AppLogger.log("Server error \(httpResponse.statusCode). Retrying in \(delay)s...", category: .network, level: .error)
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                return try await performRequest(for: request, retryCount: retryCount + 1)
            } else {
                throw URLError(.badServerResponse)
            }
        } catch {
            if (error as? URLError)?.code == .notConnectedToInternet {
                AppLogger.log("No internet connection detected", category: .network, level: .error)
                throw error
            }
            
            if retryCount < maxRetries {
                let delay = initialDelay * pow(2.0, Double(retryCount))
                AppLogger.log("Network request failed: \(error.localizedDescription). Retrying \(retryCount + 1)/\(maxRetries) in \(delay)s...", category: .network, level: .error)
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                return try await performRequest(for: request, retryCount: retryCount + 1)
            }
            throw error
        }
    }

    func fetchProducts() async throws -> [Product] {
        guard let url = URL(string: "\(baseURL)/products/") else { throw URLError(.badURL) }
        let request = createRequest(for: url)
        return try await performRequest(for: request)
    }

    func getProductDetails(productID: String) async throws -> Product {
        guard let url = URL(string: "\(baseURL)/product/\(productID)/") else { throw URLError(.badURL) }
        let request = createRequest(for: url)
        return try await performRequest(for: request)
    }


    func startSession(hostAppId: String, productId: String, productName: String, modelURL: String, scale: Float) async throws -> String {
        guard let url = URL(string: "\(baseURL)/session/start/") else { throw URLError(.badURL) }
        
        let parameters: [String: Any] = [
            "host_app_id": hostAppId,
            "product_id": productId,
            "product_name": productName,
            "model_url": modelURL,
            "scale": scale
        ]
        
        var request = createRequest(for: url, method: "POST")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: parameters)
        
        let decodedResponse: StartSessionResponse = try await performRequest(for: request)
        return decodedResponse.sessionID
    }
    
    func getModelData(sessionId: String) async throws -> ModelData {
        guard let url = URL(string: "\(baseURL)/model/load/") else { throw URLError(.badURL) }
        
        let parameters: [String: Any] = ["session_id": sessionId]
        var request = createRequest(for: url, method: "POST")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: parameters)
        
        return try await performRequest(for: request)
    }

    func saveCapture(sessionId: String, image: UIImage) async throws -> Bool {
        guard let url = URL(string: "\(baseURL)/capture/save/") else { throw URLError(.badURL) }
        guard let imageData = image.jpegData(compressionQuality: 0.8) else { return false }
        
        let base64Image = imageData.base64EncodedString()
        let capturedImageStr = "data:image/jpeg;base64,\(base64Image)"
        
        AppLogger.log("Uploading capture: \(imageData.count / 1024) KB", category: .network)
        
        let parameters: [String: Any] = [
            "session_id": sessionId,
            "captured_image": capturedImageStr
        ]
        
        var request = createRequest(for: url, method: "POST", timeout: 60.0) // Longer timeout for uploads
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: parameters)
        
        do {
            let (_, response) = try await session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else {
                AppLogger.log("Capture upload failed: No HTTP response", category: .network, level: .error)
                return false
            }
            
            if (200...299).contains(httpResponse.statusCode) {
                AppLogger.log("Capture upload successful (200 OK)", category: .network)
                return true
            } else {
                AppLogger.log("Capture upload failed with status: \(httpResponse.statusCode)", category: .network, level: .error)
                return false
            }
        } catch {
            if let urlError = error as? URLError {
                AppLogger.log("Capture upload network error (\(urlError.code.rawValue)): \(urlError.localizedDescription)", category: .network, level: .error)
            } else {
                AppLogger.error("Capture upload failed definitely", category: .network, error: error)
            }
            return false
        }
    }
}
