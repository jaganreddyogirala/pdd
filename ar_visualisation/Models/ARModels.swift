import Foundation

struct StartSessionResponse: Codable {
    let sessionID: String
    let status: String

    enum CodingKeys: String, CodingKey {
        case sessionID = "session_id"
        case status
    }
}

struct ModelData: Codable {
    let modelURL: String
    let scale: Float
    let rotation: Float

    enum CodingKeys: String, CodingKey {
        case modelURL = "model_url"
        case scale
        case rotation
    }
}

enum AppRoute: Hashable {
    case productList
    case productDetail(Product)
    case permission
    case placement
}
