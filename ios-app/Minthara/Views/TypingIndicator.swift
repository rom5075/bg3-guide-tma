import SwiftUI

struct TypingIndicator: View {
    @State private var phase = 0

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            // Аватар
            ZStack {
                Circle()
                    .fill(Color(hex: "3e1460"))
                    .frame(width: 32, height: 32)
                Text("⚔️")
                    .font(.system(size: 16))
            }

            HStack(spacing: 5) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(Color(hex: "c9a84c").opacity(phase == i ? 1.0 : 0.3))
                        .frame(width: 7, height: 7)
                        .scaleEffect(phase == i ? 1.2 : 1.0)
                        .animation(
                            .easeInOut(duration: 0.4).repeatForever().delay(Double(i) * 0.15),
                            value: phase
                        )
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color(hex: "1a0d2e"))
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .strokeBorder(Color(hex: "c9a84c").opacity(0.25), lineWidth: 1)
            )

            Spacer(minLength: 48)
        }
        .padding(.horizontal, 12)
        .onAppear {
            withAnimation(.linear(duration: 1.2).repeatForever(autoreverses: false)) {
                phase = 2
            }
        }
    }
}
