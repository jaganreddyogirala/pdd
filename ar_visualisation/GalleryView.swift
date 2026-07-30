import SwiftUI

struct GalleryView: View {
    @ObservedObject var sessionManager = ARSessionManager.shared
    @Environment(\.dismiss) var dismiss
    
    let columns = [
        GridItem(.adaptive(minimum: 150), spacing: 16)
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 13/255, green: 27/255, blue: 42/255)
                    .ignoresSafeArea()
                
                if sessionManager.capturedImages.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "photo.on.rectangle.angled")
                            .font(.system(size: 60))
                            .foregroundColor(.white.opacity(0.3))
                        
                        Text("No snapshots captured yet")
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.5))
                    }
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 16) {
                            ForEach(Array(sessionManager.capturedImages.enumerated()), id: \.offset) { _, image in
                                NavigationLink {
                                    FullScreenImageView(image: image)
                                } label: {
                                    Image(uiImage: image)
                                        .resizable()
                                        .scaledToFill()
                                        .frame(height: 150)
                                        .cornerRadius(12)
                                        .clipped()
                                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 1))
                                }
                            }
                        }

                        .padding()
                    }
                }
            }
            .navigationTitle("Captured Images")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "chevron.left")
                            .foregroundColor(.white)
                            .font(.headline)
                    }
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarBackground(Color(red: 13/255, green: 27/255, blue: 42/255), for: .navigationBar)
        }
    }
}

struct FullScreenImageView: View {
    let image: UIImage
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .ignoresSafeArea()
            
            VStack {
                HStack {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding()
                            .background(Circle().fill(Color.black.opacity(0.4)))
                    }
                    .padding()
                    Spacer()
                }
                Spacer()
            }
        }
        .navigationBarHidden(true)
    }
}

#Preview {
    GalleryView()
}
