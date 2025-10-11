# AutoContinue

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen)](https://chrome.google.com/webstore/detail/autocontinue)
[![GitHub release](https://img.shields.io/github/release/sunnamed434/AutoContinue.svg)](https://github.com/sunnamed434/AutoContinue/releases)
[![Build Status](https://github.com/sunnamed434/AutoContinue/workflows/CI/badge.svg)](https://github.com/sunnamed434/AutoContinue/actions)

**AutoContinue** automatically dismisses YouTube's "Continue watching?" popup to ensure uninterrupted video playback. Never be interrupted by YouTube's pause prompts again!

## ✨ Features

- **🚀 Automatic Dismissal**: Instantly dismisses YouTube's "Continue watching?" popup
- **🎵 YouTube Music Support**: Works on both YouTube and YouTube Music
- **⚙️ Customizable Settings**: Adjust idle timeout, auto-click delay, and more
- **📊 Statistics Tracking**: See how many times AutoContinue has helped you
- **🔧 Advanced Options**: Fine-tune behavior with detailed settings
- **🧪 Test Mode**: Test the functionality with a built-in test popup
- **🌍 Multi-language Support**: Available in multiple languages
- **🔒 Privacy Focused**: No data collection, works entirely locally

## 🚀 Quick Start

### Installation

#### Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/autocontinue)
2. Click "Add to Chrome"
3. The extension will automatically work on YouTube!

#### Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/sunnamed434/AutoContinue/releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the extracted folder

### Usage

1. **Automatic**: AutoContinue works automatically once installed
2. **Test**: Click the extension icon and use "Test Popup" to see it in action
3. **Configure**: Right-click the extension icon and select "Options" for advanced settings

## ⚙️ Configuration

### Basic Settings
- **Enable/Disable**: Toggle AutoContinue on or off
- **Show Notifications**: Display notifications when auto-continuing
- **YouTube Music**: Enable support for YouTube Music

### Advanced Settings
- **Idle Timeout**: How long to wait before considering user idle (1-60 seconds)
- **Auto-click Delay**: Delay before auto-clicking continue button (0-5000ms)
- **Statistics**: View and reset usage statistics

## 🛠️ Development

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/sunnamed434/AutoContinue.git
cd AutoContinue

# Install dependencies
npm install

# Build the extension
npm run build:chrome

# Run tests
npm test

# Start development mode
npm run build:watch
```

### Project Structure
```
AutoContinue/
├── src/                    # Source code
│   ├── background.ts       # Background script
│   ├── content.ts          # Content script
│   ├── autoconfirm-simple.ts # Core auto-continue logic
│   ├── popup/              # Extension popup
│   └── options/            # Options page
├── _locales/               # Internationalization
├── images/                 # Extension icons
├── test/                   # Unit tests
├── .github/workflows/      # CI/CD workflows
└── dist/                   # Built extension
```

### Building for Different Browsers
```bash
# Chrome (default)
npm run build:chrome

# Firefox
npm run build:firefox

# Safari
npm run build:safari
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📋 Roadmap

### Current Version (1.0.0)
- ✅ Core auto-continue functionality
- ✅ Chrome extension
- ✅ Basic settings and statistics
- ✅ Test mode

### Upcoming Features
- 🔄 Firefox extension
- 🔄 Safari extension
- 🔄 Android app (WebView + userscript)
- 🔄 iOS app (WebView + userscript)
- 🔄 MPV integration
- 🔄 Kodi addon
- 🔄 Chromecast support
- 🔄 Advanced statistics and analytics
- 🔄 Custom popup detection rules

## 🐛 Troubleshooting

### Common Issues

**Extension not working on YouTube**
- Ensure the extension is enabled
- Check if you're on a supported YouTube page
- Try refreshing the page
- Check the browser console for errors

**Test popup not appearing**
- Make sure you're on a YouTube video page
- Check if the extension has proper permissions
- Try reloading the extension

**Settings not saving**
- Check if you have sufficient storage permissions
- Try resetting the extension settings
- Clear browser cache and reload

### Getting Help
- 📖 Check the [FAQ](https://github.com/sunnamed434/AutoContinue/wiki/FAQ)
- 🐛 Report bugs on [GitHub Issues](https://github.com/sunnamed434/AutoContinue/issues)
- 💬 Join discussions on [GitHub Discussions](https://github.com/sunnamed434/AutoContinue/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [YoutubeNonStop](https://github.com/lawfx/YoutubeNonStop)
- Built with modern web technologies
- Community feedback and contributions

## 📊 Statistics

- **Downloads**: [Chrome Web Store Stats](https://chrome.google.com/webstore/detail/autocontinue)
- **GitHub Stars**: ![GitHub stars](https://img.shields.io/github/stars/sunnamed434/AutoContinue?style=social)
- **Contributors**: ![GitHub contributors](https://img.shields.io/github/contributors/sunnamed434/AutoContinue)

---

**Made with ❤️ by the AutoContinue team**

[⭐ Star us on GitHub](https://github.com/sunnamed434/AutoContinue) | [🐛 Report Issues](https://github.com/sunnamed434/AutoContinue/issues) | [💬 Join Discussions](https://github.com/sunnamed434/AutoContinue/discussions)