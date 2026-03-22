# Как создать Xcode проект и запустить приложение

## Требования
- Mac с macOS 14+
- Xcode 15+
- iPhone или симулятор (iOS 16+)

---

## Шаг 1 — Создать проект в Xcode

1. Открыть Xcode → **Create New Project**
2. Выбрать **iOS → App**
3. Заполнить:
   - **Product Name:** `Minthara`
   - **Team:** твой Apple аккаунт
   - **Bundle Identifier:** `com.yourname.minthara`
   - **Interface:** SwiftUI
   - **Language:** Swift
   - **Use Core Data:** нет
   - **Include Tests:** по желанию
4. Сохранить проект в папку `ios-app/` (рядом с файлами из этого репо)

---

## Шаг 2 — Добавить файлы

Скопировать все файлы из `ios-app/Minthara/` в созданный Xcode-проект.

В Xcode: **правый клик на папку Minthara → Add Files to "Minthara"** → выбрать все `.swift` файлы.

Структура групп в проекте:
```
Minthara/
├── MintheraApp.swift
├── Config.swift
├── Models/
│   └── Message.swift
├── Services/
│   └── APIService.swift
├── ViewModels/
│   └── ChatViewModel.swift
└── Views/
    ├── ChatView.swift
    ├── MessageBubble.swift
    └── TypingIndicator.swift
```

Удалить `ContentView.swift` — он не нужен (есть `ChatView.swift`).

---

## Шаг 3 — Настроить Config.swift

```swift
static let baseURL = "https://твой-vps-домен.com"  // без слэша в конце
static let apiKey  = "твой_ios_api_key"             // из .env на VPS
```

---

## Шаг 4 — Запустить

**Cmd+R** — запустить в симуляторе.

Для запуска на реальном iPhone: подключить телефон, выбрать его в таргете, нажать Run.
При первом запуске Xcode попросит доверять разработчику на устройстве:
iPhone → **Настройки → Основные → VPN и управление устройством → Trust**.

---

## Шаг 5 — Распространение (опционально)

**TestFlight** (рекомендуется для личного/тестового использования):
1. Xcode → **Product → Archive**
2. Загрузить в App Store Connect
3. Разослать ссылку через TestFlight

Для публичного App Store нужен **Apple Developer Program ($99/год)**.

---

## Переменные для production

Не хардкодь `apiKey` в коде — используй `xcconfig`:

1. Создать файл `Config.xcconfig`:
   ```
   IOS_API_KEY = твой_ключ
   VPS_BASE_URL = https://твой-домен.com
   ```
2. В `Info.plist` добавить ключи `IOS_API_KEY` и `VPS_BASE_URL`
3. В `Config.swift` читать через `Bundle.main.infoDictionary`
