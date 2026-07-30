import Foundation
import os

enum LogCategory: String {
    case ar = "ARSession"
    case network = "Network"
    case model = "ModelLoading"
    case session = "SessionManager"
    case ui = "UI"
    case lifecycle = "AppLifecycle"
    case performance = "Performance"
}

struct AppLogger {
    private static let subsystem = Bundle.main.bundleIdentifier ?? "com.arvisualisation.app"
    
    // Static loggers for each category to improve performance
    private static let loggers: [LogCategory: Logger] = [
        .ar: Logger(subsystem: subsystem, category: LogCategory.ar.rawValue),
        .network: Logger(subsystem: subsystem, category: LogCategory.network.rawValue),
        .model: Logger(subsystem: subsystem, category: LogCategory.model.rawValue),
        .session: Logger(subsystem: subsystem, category: LogCategory.session.rawValue),
        .ui: Logger(subsystem: subsystem, category: LogCategory.ui.rawValue),
        .lifecycle: Logger(subsystem: subsystem, category: LogCategory.lifecycle.rawValue),
        .performance: Logger(subsystem: subsystem, category: LogCategory.performance.rawValue)
    ]
    
    static func log(_ message: String, category: LogCategory = .ui, level: OSLogType = .default) {
        guard let logger = loggers[category] else { return }
        
        switch level {
        case .debug:
            logger.debug("\(message, privacy: .public)")
        case .info:
            logger.info("\(message, privacy: .public)")
        case .error:
            logger.error("\(message, privacy: .public)")
        case .fault:
            logger.fault("\(message, privacy: .public)")
        default:
            logger.log(level: .default, "\(message, privacy: .public)")
        }
        
        #if DEBUG
        print("[\(category.rawValue.uppercased())] \(message)")
        #endif
    }
    
    static func error(_ message: String, category: LogCategory = .ui, error: Error? = nil) {
        let errorMessage: String
        if let err = error {
            errorMessage = "\(message): \(err.localizedDescription)"
        } else {
            errorMessage = message
        }
        log(errorMessage, category: category, level: .error)
    }

}
