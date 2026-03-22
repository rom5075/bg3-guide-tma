import Foundation

enum APIServiceError: LocalizedError {
    case invalidURL
    case serverError(String)
    case decodingError
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:        return "Неверный URL сервера"
        case .serverError(let msg): return "Ошибка сервера: \(msg)"
        case .decodingError:     return "Не удалось прочитать ответ"
        case .networkError(let e): return e.localizedDescription
        }
    }
}

final class APIService {
    static let shared = APIService()
    private let session = URLSession.shared
    private let decoder = JSONDecoder()

    private init() {}

    func sendMessage(_ text: String) async throws -> String {
        guard let url = URL(string: "\(Config.baseURL)/api/chat") else {
            throw APIServiceError.invalidURL
        }

        let body = ChatRequest(
            userId: Config.userId,
            message: text,
            apiKey: Config.apiKey
        )

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        request.timeoutInterval = 60

        let (data, response) = try await session.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw APIServiceError.decodingError
        }

        guard (200..<300).contains(http.statusCode) else {
            let msg = (try? decoder.decode(APIError.self, from: data))?.error
                ?? "HTTP \(http.statusCode)"
            throw APIServiceError.serverError(msg)
        }

        guard let parsed = try? decoder.decode(ChatResponse.self, from: data) else {
            throw APIServiceError.decodingError
        }

        return parsed.reply
    }
}
