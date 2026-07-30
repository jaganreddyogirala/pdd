import Foundation

enum AppEnvironment {
    case development
    case production
}

struct AppConfig {
    static let environment: AppEnvironment = {
        #if DEBUG
        return .development
        #else
        return .production
        #endif
    }()
    
    static var baseURL: String {
        // Priority 1: Environment variable (Set in Xcode Scheme -> Arguments -> Environment Variables)
        if let envURL = ProcessInfo.processInfo.environment["API_BASE_URL"] {
            return envURL
        }
        
        switch environment {
        case .development:
            // Fallback for local development - Ensure server is reachable from the device!
            return "http://172.25.83.230:8000/api"
            
        case .production:
            // CRITICAL: Production must always use HTTPS
            return "https://api.ar-visualisation.com/api"
        }
    }
    
    static var isProduction: Bool {
        return environment == .production
    }
    
    // Performance: Global timeout for network operations
    static let networkTimeout: TimeInterval = 30.0
}
