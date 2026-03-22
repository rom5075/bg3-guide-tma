import Foundation

enum MessageRole: String, Codable {
    case user
    case assistant
}

struct Message: Identifiable, Equatable {
    let id: UUID
    let role: MessageRole
    let text: String
    let timestamp: Date

    init(role: MessageRole, text: String) {
        self.id = UUID()
        self.role = role
        self.text = text
        self.timestamp = Date()
    }
}

// MARK: - API DTOs

struct ChatRequest: Encodable {
    let userId: String
    let message: String
    let apiKey: String
}

struct ChatResponse: Decodable {
    let reply: String
}

struct APIError: Decodable {
    let error: String
}
