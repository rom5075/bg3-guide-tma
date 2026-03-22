import SwiftUI

struct ChatView: View {
    @StateObject private var vm = ChatViewModel()
    @FocusState private var inputFocused: Bool
    @State private var showClearAlert = false

    var body: some View {
        ZStack {
            // Фон
            Color(hex: "0a050f").ignoresSafeArea()

            VStack(spacing: 0) {
                header
                Divider().background(Color(hex: "c9a84c").opacity(0.2))

                // Список сообщений
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            if vm.messages.isEmpty {
                                emptyState
                            }

                            ForEach(vm.messages) { msg in
                                MessageBubble(message: msg)
                                    .id(msg.id)
                            }

                            if vm.isTyping {
                                TypingIndicator()
                                    .id("typing")
                            }
                        }
                        .padding(.vertical, 16)
                    }
                    .onChange(of: vm.messages.count) { _ in
                        scrollToBottom(proxy: proxy)
                    }
                    .onChange(of: vm.isTyping) { typing in
                        if typing { scrollToBottom(proxy: proxy, id: "typing") }
                    }
                }

                // Ошибка
                if let error = vm.errorMessage {
                    errorBanner(error)
                }

                Divider().background(Color(hex: "c9a84c").opacity(0.2))
                inputBar
            }
        }
        .alert("Очистить историю?", isPresented: $showClearAlert) {
            Button("Очистить", role: .destructive) { vm.clearHistory() }
            Button("Отмена", role: .cancel) {}
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 12) {
            // Аватар
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "3e1460"), Color(hex: "7a1225")],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 42, height: 42)
                Text("⚔️")
                    .font(.system(size: 22))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(Config.botName)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(Color(hex: "c9a84c"))
                Text(Config.botSubtitle)
                    .font(.system(size: 12))
                    .foregroundColor(Color.white.opacity(0.45))
            }

            Spacer()

            Button {
                showClearAlert = true
            } label: {
                Image(systemName: "trash")
                    .foregroundColor(Color.white.opacity(0.35))
                    .font(.system(size: 16))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    // MARK: - Input bar

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Напиши...", text: $vm.inputText, axis: .vertical)
                .lineLimit(1...5)
                .font(.system(size: 15))
                .foregroundColor(.white)
                .tint(Color(hex: "c9a84c"))
                .focused($inputFocused)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color(hex: "1a0d2e"))
                .clipShape(RoundedRectangle(cornerRadius: 22))
                .overlay(
                    RoundedRectangle(cornerRadius: 22)
                        .strokeBorder(Color(hex: "c9a84c").opacity(inputFocused ? 0.5 : 0.2), lineWidth: 1)
                )
                .onSubmit {
                    Task { await vm.sendMessage() }
                }

            Button {
                Task { await vm.sendMessage() }
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 34))
                    .foregroundStyle(
                        vm.inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || vm.isTyping
                            ? Color.white.opacity(0.2)
                            : Color(hex: "c42040")
                    )
            }
            .disabled(vm.inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || vm.isTyping)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color(hex: "0f0819"))
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Text("⚔️")
                .font(.system(size: 56))
            Text("Минтара ждёт")
                .font(.system(size: 20, weight: .semibold))
                .foregroundColor(Color(hex: "c9a84c"))
            Text("Дроу-командир, Oathbreaker Paladin.\nГовори. Или молчи. Выбор за тобой.")
                .font(.system(size: 14))
                .foregroundColor(Color.white.opacity(0.4))
                .multilineTextAlignment(.center)
        }
        .padding(.top, 80)
        .padding(.horizontal, 32)
    }

    // MARK: - Error banner

    private func errorBanner(_ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(Color(hex: "c42040"))
            Text(text)
                .font(.system(size: 13))
                .foregroundColor(Color.white.opacity(0.8))
            Spacer()
            Button {
                vm.errorMessage = nil
            } label: {
                Image(systemName: "xmark")
                    .foregroundColor(Color.white.opacity(0.5))
                    .font(.system(size: 12))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(Color(hex: "7a1225").opacity(0.8))
    }

    // MARK: - Helpers

    private func scrollToBottom(proxy: ScrollViewProxy, id: AnyHashable? = nil) {
        withAnimation(.easeOut(duration: 0.2)) {
            if let id { proxy.scrollTo(id, anchor: .bottom) }
            else if let last = vm.messages.last { proxy.scrollTo(last.id, anchor: .bottom) }
        }
    }
}

#Preview {
    ChatView()
}
