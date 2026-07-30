import Foundation
import RealityKit
import Combine

class ModelCacheService {
    static let shared = ModelCacheService()
    
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    private let session: URLSession
    
    init(session: URLSession = .shared) {
        self.session = session
        let paths = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)
        cacheDirectory = paths[0].appendingPathComponent("ARModels", isDirectory: true)
        
        if !fileManager.fileExists(atPath: cacheDirectory.path) {
            try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
        }
    }
    
    func getLocalURL(for remoteURL: URL) -> URL {
        let fileName = remoteURL.lastPathComponent
        return cacheDirectory.appendingPathComponent(fileName)
    }
    
    func isModelCached(for remoteURL: URL) -> Bool {
        let localURL = getLocalURL(for: remoteURL)
        return fileManager.fileExists(atPath: localURL.path)
    }
    
    func fetchModel(from remoteURL: URL) async throws -> URL {
        let localURL = getLocalURL(for: remoteURL)
        
        if fileManager.fileExists(atPath: localURL.path) {
            AppLogger.log("Using cached model: \(localURL.lastPathComponent)", category: .network)
            return localURL
        }
        
        AppLogger.log("Downloading model: \(remoteURL.absoluteString)", category: .network)
        let (tempURL, response) = try await session.download(from: remoteURL)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
        
        // Move to cache directory
        if fileManager.fileExists(atPath: localURL.path) {
            try? fileManager.removeItem(at: localURL)
        }
        try fileManager.moveItem(at: tempURL, to: localURL)
        
        AppLogger.log("Model downloaded and cached: \(localURL.lastPathComponent)", category: .network)
        return localURL
    }
    
    func clearCache() {
        try? fileManager.removeItem(at: cacheDirectory)
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
}
