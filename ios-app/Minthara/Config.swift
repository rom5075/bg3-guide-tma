import Foundation

enum Config {
    // MARK: - API
    /// Базовый URL VPS-сервера. Меняй здесь при смене хоста.
    static let baseURL = "https://your-vps-domain.com"

    /// API-ключ для авторизации запросов. Задаётся на бэкенде.
    /// В production — выноси в xcconfig / Info.plist, не хардкодь.
    static let apiKey = "REPLACE_WITH_YOUR_API_KEY"

    // MARK: - User
    /// Уникальный ID устройства — генерируется один раз и хранится в UserDefaults.
    static var userId: String {
        let key = "minthara_user_id"
        if let existing = UserDefaults.standard.string(forKey: key) {
            return existing
        }
        let new = UUID().uuidString
        UserDefaults.standard.set(new, forKey: key)
        return new
    }

    // MARK: - UI
    static let botName = "Минтара"
    static let botSubtitle = "дроу • Oathbreaker Paladin"
}
