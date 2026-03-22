import SwiftUI

struct MessageBubble: View {
    let message: Message

    private var isUser: Bool { message.role == .user }

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if isUser { Spacer(minLength: 48) }

            if !isUser {
                // Аватар Минтары
                ZStack {
                    Circle()
                        .fill(Color(hex: "3e1460"))
                        .frame(width: 32, height: 32)
                    Text("⚔️")
                        .font(.system(size: 16))
                }
            }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                Text(message.text)
                    .font(.system(size: 15))
                    .foregroundColor(isUser ? .white : Color(hex: "f0e6d3"))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(bubbleBackground)
                    .clipShape(BubbleShape(isUser: isUser))

                Text(message.timestamp, style: .time)
                    .font(.system(size: 11))
                    .foregroundColor(Color.white.opacity(0.3))
                    .padding(.horizontal, 4)
            }

            if !isUser { Spacer(minLength: 48) }
        }
        .padding(.horizontal, 12)
    }

    @ViewBuilder
    private var bubbleBackground: some View {
        if isUser {
            LinearGradient(
                colors: [Color(hex: "7a1225"), Color(hex: "c42040")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else {
            Color(hex: "1a0d2e")
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .strokeBorder(Color(hex: "c9a84c").opacity(0.25), lineWidth: 1)
                )
        }
    }
}

// MARK: - Bubble shape с заострённым углом

struct BubbleShape: Shape {
    let isUser: Bool

    func path(in rect: CGRect) -> Path {
        let r: CGFloat = 18
        let tail: CGFloat = 0 // без хвоста — чисто скруглённый прямоугольник
        var path = Path()
        path.addRoundedRect(in: rect, cornerSize: CGSize(width: r, height: r))
        return path
    }
}

// MARK: - Color from hex

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
