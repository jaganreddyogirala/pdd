import XCTest
@testable import ar_visualisation

final class ProductDimensionTests: XCTestCase {
    
    func testInchesDimensionParsing() {
        let product = Product(
            productID: "test_001",
            name: "Test Chair",
            description: "Test",
            material: "Wood",
            dimensions: "27.5\"W x 25.0\"D x 45.5\"H",
            weight: "30 lbs",
            assembly: "None",
            imageURL: nil,
            modelURL: "http://example.com/model.usdz",
            scale: 1.0,
            surfaceType: .floor
        )
        
        let dims = product.actualDimensions
        XCTAssertEqual(dims.x, Float(27.5 * 0.0254), accuracy: 0.001)
        XCTAssertEqual(dims.y, Float(25.0 * 0.0254), accuracy: 0.001)
        XCTAssertEqual(dims.z, Float(45.5 * 0.0254), accuracy: 0.001)
    }
    
    func testCentimeterDimensionParsing() {
        let product = Product(
            productID: "test_002",
            name: "Test Table",
            description: "Test",
            material: "Glass",
            dimensions: "70.5 x 60 x 100.2 cm",
            weight: "15 kg",
            assembly: "Required",
            imageURL: nil,
            modelURL: "http://example.com/model.usdz",
            scale: 1.0,
            surfaceType: .floor
        )
        
        let dims = product.actualDimensions
        XCTAssertEqual(dims.x, Float(70.5 * 0.01), accuracy: 0.001)
        XCTAssertEqual(dims.y, Float(60.0 * 0.01), accuracy: 0.001)
        XCTAssertEqual(dims.z, Float(100.2 * 0.01), accuracy: 0.001)
    }
}
