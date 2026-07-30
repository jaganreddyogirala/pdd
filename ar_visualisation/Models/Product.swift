import Foundation

struct Product: Codable, Hashable {
    let productID: String
    let name: String
    let description: String
    let material: String
    let dimensions: String
    let weight: String
    let assembly: String
    let imageURL: String?
    let modelURL: String
    let scale: Float

    enum SurfaceType: String, Codable {
        case floor, wall, tabletop
    }
    
    let surfaceType: SurfaceType?

    var actualDimensions: SIMD3<Float> {
        let pattern = #"([0-9]+(?:\.[0-9]+)?)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [0.5, 0.5, 0.5] }
        let range = NSRange(dimensions.startIndex..<dimensions.endIndex, in: dimensions)
        let matches = regex.matches(in: dimensions, options: [], range: range)
        
        let parts = matches.compactMap { match -> Float? in
            if let r = Range(match.range(at: 1), in: dimensions) {
                return Float(dimensions[r])
            }
            return nil
        }
        
        let isInches = dimensions.lowercased().contains("in") || dimensions.contains("\"")
        let conversion: Float = isInches ? 0.0254 : 0.01 // inches or cm to meters
        
        guard parts.count >= 3 else {
            if parts.count == 2 {
                return [parts[0] * conversion, 0.5, parts[1] * conversion]
            }
            return [0.5, 0.5, 0.5]
        }
        
        return [parts[0] * conversion, parts[1] * conversion, parts[2] * conversion]
    }


    enum CodingKeys: String, CodingKey {
        case productID = "product_id"
        case name
        case description
        case material
        case dimensions
        case weight
        case assembly
        case imageURL = "image_url"
        case modelURL = "model_url"
        case scale
        case surfaceType = "surface_type"
    }
}
