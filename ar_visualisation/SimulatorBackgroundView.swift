import SwiftUI

struct SimulatorBackgroundView: View {
    var body: some View {
        ZStack {
            // A more realistic room-like gradient for simulation
            LinearGradient(
                gradient: Gradient(colors: [Color(white: 0.1), Color(white: 0.35), Color(white: 0.1)]),
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            // Floor Grid Visualizer
            VStack(spacing: 40) {
                ForEach(0..<15) { _ in
                    Divider().background(Color.white.opacity(0.1))
                }
            }
            .padding(.top, 200)
            
            HStack(spacing: 40) {
                ForEach(0..<10) { _ in
                    Divider().background(Color.white.opacity(0.1))
                }
            }
            .padding(.vertical, 100)
            
            VStack {
                Spacer()
                Text("Simulator Mode: Camera simulated")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
                    .padding(.bottom, 120)
            }
        }
    }
}
