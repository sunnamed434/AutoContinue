# AutoContinue

<div align="center">
  <img src="images/icon128.png" alt="AutoContinue Logo" width="128" height="128">
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Under%20Review-orange)](https://chrome.google.com/webstore/detail/autocontinue)
[![GitHub release](https://img.shields.io/github/release/sunnamed434/AutoContinue.svg)](https://github.com/sunnamed434/AutoContinue/releases)
[![Build Status](https://github.com/sunnamed434/AutoContinue/workflows/CI%2FCD/badge.svg)](https://github.com/sunnamed434/AutoContinue/actions)

Ever been watching a YouTube video and that annoying "Continue watching?" popup keeps interrupting you? AutoContinue fixes that by automatically clicking the continue button so you can watch without interruptions.

## What it does

- Automatically clicks "Continue watching?" on YouTube so you don't have to
- Works on both YouTube and YouTube Music
- You can adjust how long it waits before clicking (idle timeout)
- Shows how many times it's helped you
- Has a test mode so you can see it working
- Available in multiple languages
- Doesn't collect any of your data - everything stays on your computer

## Getting started

### Install it

**Chrome Web Store (Coming Soon):**
The extension is currently under review by Google and will be available in the Chrome Web Store soon.

**Manual install (Recommended for now):**
1. Download the latest release from [GitHub Releases](https://github.com/sunnamed434/AutoContinue/releases)
2. Unzip the downloaded file
3. Open Chrome and go to `chrome://extensions/`
4. Turn on "Developer mode" (toggle in the top right corner)
5. Click "Load unpacked" and select the unzipped folder
6. The extension will be installed and ready to use!

### How to use it

Once installed, it just works automatically. But you can also:
- Click the extension icon to see how many times it's helped you
- Right-click the icon and pick "Options" to change settings
- Use the test mode to see it in action

## For developers

If you want to build this yourself or contribute:

**You'll need:**
- Node.js 16 or newer
- npm (comes with Node.js)
- Git

**Setup:**
```bash
# Get the code
git clone https://github.com/sunnamed434/AutoContinue.git
cd AutoContinue

# Install stuff
npm install

# Build it
npm run build:chrome

# Run tests
npm test

# Watch for changes while developing
npm run build:watch
```

**Build for different browsers:**
```bash
npm run build:chrome    # Chrome (default)
npm run build:firefox   # Firefox
npm run build:safari    # Safari
```

**Code quality:**
```bash
npm run lint        # Check for issues
npm run lint:fix    # Fix issues automatically
npm run format      # Format code
npm run validate:locales  # Validate localization files
```

## Contributing

Want to help? Great! Check out [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## What's coming next

- [x] Auto-continue functionality
- [x] Chrome extension
- [x] Settings and stats
- [x] Test mode
- [ ] Firefox extension
- [ ] Edge extension
- [ ] Opera extension
- [ ] Safari extension
- [ ] (?) YouTube Vanced integration
- [ ] Better statistics
- [ ] Custom popup detection

## Credits

- Inspired by [YoutubeNonStop](https://github.com/lawfx/YoutubeNonStop)
- Built with modern web tech
- Thanks to everyone who's contributed!

---

[⭐ Star us on GitHub](https://github.com/sunnamed434/AutoContinue) | [🐛 Report Issues](https://github.com/sunnamed434/AutoContinue/issues) | [💬 Join Discussions](https://github.com/sunnamed434/AutoContinue/discussions)