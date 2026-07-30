import SwiftUI

struct ProductListView: View {
    @StateObject private var viewModel = ProductListViewModel()
    @ObservedObject var sessionManager = ARSessionManager.shared
    
    var body: some View {
        ZStack {
            Color(red: 13/255, green: 27/255, blue: 42/255)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Spacer()
                    Text("Select Product")
                        .font(.headline)
                        .foregroundColor(.white)
                    Spacer()
                }
                .padding()
                .background(Color(red: 13/255, green: 27/255, blue: 42/255))
                
                if viewModel.isLoading {
                    Spacer()
                    ProgressView().tint(.white)
                    Spacer()
                } else if viewModel.products.isEmpty {
                    Spacer()
                    Text("No products available").foregroundColor(.gray)
                    Spacer()
                } else {
                    ScrollView {
                        VStack(spacing: 16) {
                            ForEach(viewModel.products, id: \.productID) { product in
                                ProductCardView(product: product)
                            }
                        }
                        .padding()
                    }
                }
            }
        }
        .task {
            await viewModel.fetchProducts()
        }
        .navigationBarHidden(true)
        .alert("Error", isPresented: Binding(get: { viewModel.errorMessage != nil }, set: { if !$0 { viewModel.errorMessage = nil } })) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }
}

struct ProductCardView: View {
    let product: Product
    @State private var navigateToDetail = false
    
    var body: some View {
        HStack(spacing: 16) {
            // Product Image
            ZStack {
                Color.white.opacity(0.1)
                if let imageURL = product.imageURL, let url = URL(string: imageURL) {
                    AsyncImage(url: url) { image in
                        image.resizable()
                    } placeholder: {
                        ProgressView()
                    }
                } else if product.name.contains("Chair") {
                    Image("Chair")
                        .resizable()
                        .scaledToFit()
                        .padding(8)
                } else {
                    Image(systemName: "cube.box.fill")
                        .resizable()
                        .scaledToFit()
                        .foregroundColor(.blue.opacity(0.8))
                        .padding(20)
                }
            }

            .frame(width: 100, height: 100)
            .cornerRadius(12)
            
            // Product Info
            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text(product.description)
                    .font(.caption)
                    .foregroundColor(.gray)
                    .lineLimit(2)
                
                Spacer()
                
                NavigationLink(value: AppRoute.productDetail(product)) {
                    Text("Select")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .cornerRadius(8)
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color(red: 27/255, green: 38/255, blue: 59/255))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.3), radius: 4, x: 0, y: 2)
    }
}

#Preview {
    NavigationStack {
        ProductListView()
    }
}
