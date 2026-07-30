import SwiftUI

struct ProductDetailView: View {
    let product: Product
    @StateObject private var viewModel: ProductDetailViewModel
    @ObservedObject var sessionManager = ARSessionManager.shared
    @Environment(\.dismiss) var dismiss

    init(product: Product) {
        self.product = product
        _viewModel = StateObject(wrappedValue: ProductDetailViewModel(product: product))
    }

    var body: some View {
        ZStack {
            Color(red: 13/255, green: 27/255, blue: 42/255)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Top Bar
                HStack {
                    Button(action: { dismiss() }) {
                        Image(systemName: "chevron.left")
                            .foregroundColor(.white)
                            .font(.headline)
                    }
                    Spacer()
                    Text("Product Details")
                        .font(.headline)
                        .foregroundColor(.white)
                    Spacer()
                    Spacer().frame(width: 24) // Balance the back button
                }
                .padding()

                VStack(spacing: 0) {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 24) {
                            // Product Image
                            ZStack {
                                Color.white.opacity(0.1)
                                if let imageURL = product.imageURL, let url = URL(string: imageURL) {
                                    AsyncImage(url: url) { image in
                                        image.resizable()
                                    } placeholder: {
                                        ProgressView()
                                    }
                                    .scaledToFit()
                                } else if product.name.contains("Chair") {
                                    Image("Chair")
                                        .resizable()
                                        .scaledToFit()
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 250)
                                } else {
                                    Image(systemName: "cube.box.fill")
                                        .resizable()
                                        .scaledToFit()
                                        .foregroundColor(.blue.opacity(0.8))
                                        .frame(height: 160)
                                        .padding(40)
                                }
                            }

                            .cornerRadius(12)
                            .padding(.top)

                            // Product Name & Description
                            VStack(alignment: .leading, spacing: 8) {
                                Text(product.name)
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)

                                Text(product.description)
                                    .font(.body)
                                    .foregroundColor(.gray)
                            }

                            Divider().background(Color.gray.opacity(0.5))

                            // Info Grid (2 Columns)
                            VStack(spacing: 20) {
                                HStack {
                                    SpectItem(title: "Material", value: product.material)
                                    Spacer()
                                    SpectItem(title: "Dimensions", value: product.dimensions)
                                }
                                
                                Divider().background(Color.gray.opacity(0.3))

                                HStack {
                                    SpectItem(title: "Weight", value: product.weight)
                                    Spacer()
                                    SpectItem(title: "Assembly", value: product.assembly)
                                }
                            }
                            .padding(.vertical)

                            Spacer(minLength: 20)
                        }
                        .padding(.horizontal)
                    }

                    // Fixed Action Button at Bottom
                    VStack {
                        Button(action: {
                            Task {
                                await viewModel.startARSession()
                            }
                        }) {
                            if viewModel.isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                HStack {
                                    Image(systemName: "arkit")
                                    Text("View in your space")
                                        .fontWeight(.bold)
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.vertical, 18)
                        .background(
                            LinearGradient(colors: [Color.blue, Color(red: 0/255, green: 119/255, blue: 255/255)], startPoint: .top, endPoint: .bottom)
                        )
                        .foregroundColor(.white)
                        .cornerRadius(16)
                        .shadow(color: Color.blue.opacity(0.3), radius: 10, x: 0, y: 5)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 10)
                    .background(Color(red: 13/255, green: 27/255, blue: 42/255))
                }
            }
        }
        .navigationBarHidden(true)
        .alert("Session Error", isPresented: Binding(get: { viewModel.errorMessage != nil }, set: { if !$0 { viewModel.errorMessage = nil } })) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }
}

struct SpectItem: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    ProductDetailView(product: Product(productID: "chair_exec_001", name: "Ergonomic Office Chair", description: "Design for comfort.", material: "Mesh", dimensions: "27\"W x 25\"D x 45\"H", weight: "35 lbs", assembly: "Required", imageURL: nil, modelURL: "https://developer.apple.com/augmented-reality/quick-look/models/pancakes/pancakes_photogrammetry.usdz", scale: 1.0, surfaceType: .floor))
}
