# AutoContinue Android App

Android app that provides AutoContinue functionality using WebView + userscript injection.

## How it works

1. **WebView-based YouTube**: Uses Android WebView to display YouTube
2. **Userscript injection**: Injects the AutoContinue logic into the WebView
3. **Native UI**: Provides native Android interface for settings and statistics

## Features

- ✅ Auto-dismiss "Continue watching?" popup
- ✅ Works with YouTube and YouTube Music
- ✅ Native Android UI for settings
- ✅ Statistics tracking
- ✅ Background playback support
- ✅ Picture-in-picture mode

## Technical Implementation

- **Language**: Kotlin/Java
- **UI Framework**: Jetpack Compose
- **WebView**: Custom WebView with userscript injection
- **Storage**: Android SharedPreferences + Room database
- **Background**: WorkManager for background tasks

## Build Requirements

- Android Studio Arctic Fox or later
- Android SDK 24+ (Android 7.0)
- Kotlin 1.8+

## Development Status

🚧 **In Development** - This will be implemented after the browser extension is complete.

## Installation

1. Download APK from GitHub Releases
2. Enable "Install from unknown sources" in Android settings
3. Install the APK
4. Grant necessary permissions

## Permissions

- `INTERNET` - Access YouTube
- `WRITE_EXTERNAL_STORAGE` - Save statistics
- `SYSTEM_ALERT_WINDOW` - Picture-in-picture mode
