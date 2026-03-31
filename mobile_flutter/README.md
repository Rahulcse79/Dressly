# Dressly Flutter

AI-powered fashion styling app built with Flutter + Dart for iOS and Android.

## Getting Started

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.2.0+)
- Xcode 15+ (for iOS)
- Android Studio / Android SDK (for Android)

### Setup

```bash
cd mobile_flutter

flutter pub get

flutter run

flutter run -d ios

flutter run -d android

flutter build apk --release

flutter build ios --release
```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── constants/
│   └── constants.dart        # API config, theme colors, endpoints
├── models/
│   └── models.dart           # Data models (User, Wardrobe, AI, etc.)
├── providers/
│   ├── auth_provider.dart    # Auth state (Riverpod)
│   ├── theme_provider.dart   # Theme state (light/dark/system)
│   ├── notification_provider.dart  # Notification state
│   └── providers.dart        # Barrel export
├── router/
│   └── router.dart           # GoRouter navigation config
├── screens/
│   ├── auth/                 # Login, Register, Forgot Password
│   ├── tabs/                 # Home, Wardrobe, Generate, Notifications, Profile
│   ├── admin/                # Admin panel
│   └── shell/                # Bottom tab navigation shell
├── services/
│   ├── api_service.dart      # Dio HTTP client with JWT interceptor
│   └── websocket_service.dart # WebSocket with auto-reconnect
└── widgets/
    ├── ui/                   # Button, Card, Input, Modal, Loading, EmptyState
    └── layout/               # Screen wrapper
```

## Features

- 🔐 JWT authentication with auto-refresh
- 👕 Wardrobe management with image upload
- 🤖 AI outfit generation with style scoring
- 🔔 Real-time notifications via WebSocket
- 🎨 Light / Dark / System theme support
- 💳 Razorpay subscription payments
- 🛡️ Admin panel with analytics + config management
- 📱 iOS & Android support

## Tech Stack

- **Framework**: Flutter 3.2+
- **Language**: Dart 3.2+
- **State Management**: Riverpod (StateNotifier)
- **Navigation**: GoRouter
- **HTTP Client**: Dio
- **WebSocket**: web_socket_channel
- **Secure Storage**: flutter_secure_storage
- **Image Picker**: image_picker
- **Payments**: razorpay_flutter
