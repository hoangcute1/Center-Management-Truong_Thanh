# Giáo dục Trường Thành - Mobile App

React Native (Expo) mobile application for the education center management system.

## 📱 Features

- **Authentication**: Login/logout with JWT tokens
- **Dashboard**: Overview of classes, schedule, and notifications
- **Schedule**: View weekly class schedule
- **Classes**: Browse and manage enrolled classes
- **Notifications**: Real-time notifications
- **Profile**: User profile management

## 🛠️ Tech Stack

- **Framework**: React Native with Expo SDK 52
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: @expo/vector-icons (Ionicons)
- **Storage**: expo-secure-store

## 📁 Project Structure

```
mobile/
├── app/                    # App screens (Expo Router)
│   ├── (auth)/            # Authentication screens
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # Home screen
│   │   ├── schedule.tsx   # Schedule screen
│   │   ├── classes.tsx    # Classes screen
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── components/            # Reusable components
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── lib/                   # Utilities and stores
│   ├── api.ts            # Axios instance
│   ├── constants/
│   │   └── subjects.ts
│   └── stores/           # Zustand stores
│       ├── auth-store.ts
│       ├── classes-store.ts
│       ├── notifications-store.ts
│       ├── schedule-store.ts
│       └── attendance-store.ts
├── assets/               # Images and fonts
├── app.json             # Expo config
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)

### Installation

1. Navigate to mobile directory:

   ```bash
   cd mobile
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Run on device/simulator:
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

### Environment Configuration

Update the API URL in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://your-backend-url:3000"
    }
  }
}
```

For local development with physical device, use your machine's local IP address.

## 📦 Build

### Development Build

```bash
npx expo prebuild
```

### Production Build

```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

### EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 🔗 API Integration

The mobile app connects to the same NestJS backend as the web app. All API calls go through the configured `apiUrl` in `app.json`.

### Authentication Flow

1. User enters credentials on login screen
2. App calls `/auth/login` endpoint
3. Tokens are stored securely using `expo-secure-store`
4. All subsequent API calls include the JWT token in headers
5. Token refresh is handled automatically

## 📄 License

This project is part of the Giáo dục Trường Thành education management system.
