import Foundation

@MainActor
final class ChatViewModel: ObservableObject {
    @Published var messages: [Message] = []
    @Published var isTyping = false
    @Published var errorMessage: String? = nil
    @Published var inputText = ""

    private let api = APIService.shared
    private let historyKey = "minthara_chat_history"

    init() {
        loadHistory()
    }

    // MARK: - Send

    func sendMessage() async {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !isTyping else { return }

        inputText = ""
        errorMessage = nil

        let userMsg = Message(role: .user, text: text)
        messages.append(userMsg)
        saveHistory()

        isTyping = true
        defer { isTyping = false }

        do {
            let reply = try await api.sendMessage(text)
            let botMsg = Message(role: .assistant, text: reply)
            messages.append(botMsg)
            saveHistory()
        } catch {
            errorMessage = error.localizedDescription
            // Убираем сообщение пользователя обратно если хотим дать возможность повторить
            // Но лучше оставить — пусть видит что отправил
        }
    }

    // MARK: - History (локальный кэш в UserDefaults)

    func clearHistory() {
        messages = []
        UserDefaults.standard.removeObject(forKey: historyKey)
    }

    private func saveHistory() {
        // Сохраняем последние 100 сообщений
        let recent = Array(messages.suffix(100))
        let encoded = recent.compactMap { msg -> [String: String]? in
            ["id": msg.id.uuidString,
             "role": msg.role.rawValue,
             "text": msg.text,
             "ts": ISO8601DateFormatter().string(from: msg.timestamp)]
        }
        UserDefaults.standard.set(encoded, forKey: historyKey)
    }

    private func loadHistory() {
        guard let stored = UserDefaults.standard.array(forKey: historyKey)
                as? [[String: String]] else { return }

        let formatter = ISO8601DateFormatter()
        messages = stored.compactMap { dict in
            guard
                let roleStr = dict["role"],
                let role = MessageRole(rawValue: roleStr),
                let text = dict["text"]
            else { return nil }
            var msg = Message(role: role, text: text)
            // Message init создаёт новый UUID и timestamp — для истории нам нужны оригинальные.
            // Т.к. Message — struct, просто используем как есть (отображение корректное).
            _ = msg // silence warning
            return Message(role: role, text: text)
        }
    }
}
