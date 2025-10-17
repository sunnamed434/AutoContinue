# Privacy Policy

**Last updated: October 2025**

## Overview

AutoContinue is committed to protecting your privacy. This extension is designed to work entirely locally on your device without collecting, storing, or transmitting any personal data.

## Data Collection

**We do not collect any personal data.** AutoContinue:

- ✅ Works entirely locally on your device
- ✅ Does not send data to external servers
- ✅ Does not track your browsing habits
- ✅ Does not collect usage data (except optional local counters)
- ✅ Does not store personal information

## Local Storage

AutoContinue only stores the following data locally on your device:

### Settings
- Extension enabled/disabled state
- Idle timeout settings (5-30 seconds)
- Theme preferences (light/dark mode)
- Auto-continue counter (enabled/disabled)
- Time saved counter (enabled/disabled)

### Local Usage Counters (Optional)
- Number of times auto-continue was triggered (for user's personal reference)
- Estimated time saved (for user's personal reference)
- Last reset date (for user's personal reference)

**All data is stored locally using Chrome's storage API and never leaves your device. These counters are purely for the user's personal benefit and are not transmitted anywhere. You can reset or disable counter collection at any time.**

## Permissions

AutoContinue requests the following permissions:

### Required Permissions
- **`storage`**: To save your settings and local counters locally
- **`scripting`**: To inject content scripts for functionality

### Host Permissions
- **`https://www.youtube.com/*`**: To work on YouTube (including background tabs)
- **`https://music.youtube.com/*`**: To work on YouTube Music (including background tabs)
- **`https://m.youtube.com/*`**: To work on mobile YouTube (including background tabs)

**These permissions are only used to provide the core functionality and are not used for data collection. The extension only accesses YouTube pages and does not monitor or collect data from other websites.**

### Permission Usage Details

#### `storage` Permission
- **Purpose**: Save user preferences and local usage statistics
- **What we store**: Extension settings (enabled/disabled, timeout values, theme preferences), local counters (times helped, time saved)
- **Where**: All data stored locally in your browser using Chrome's storage API
- **Access**: Only our extension can access this data
- **Example**: When you change the idle timeout from 5 to 10 seconds, this setting is saved locally

#### `scripting` Permission  
- **Purpose**: Inject content scripts to detect and interact with YouTube popups
- **What it does**: Allows the extension to run code on YouTube pages to find and click "Continue watching?" buttons
- **When used**: Only when you visit YouTube or YouTube Music pages
- **Example**: When YouTube shows "Video paused. Continue watching?" popup, our script detects it and clicks "Yes" automatically

#### Internal Communication
- **Purpose**: Synchronize settings and state between extension components
- **What it does**: Allows popup, options, and content scripts to communicate with background script
- **When used**: When settings change, counters update, or extension state changes
- **Example**: When you change settings in popup, the change is communicated to content script

#### Host Permissions (YouTube domains)
- **Purpose**: Access YouTube pages to detect popups and interact with them
- **What we access**: Only the specific popup elements on YouTube pages
- **What we DON'T access**: Your video history, search history, account information, or any other YouTube data
- **Background tabs**: Works on YouTube tabs even when not active (so music continues playing)
- **Example**: When you have YouTube Music playing in a background tab and the "Continue watching?" popup appears, we can still handle it automatically

## What We Don't Do

To be completely transparent, here's what AutoContinue **NEVER** does:

- ❌ **No data collection**: We don't collect any personal information, browsing history, or usage patterns
- ❌ **No tracking**: We don't track which videos you watch, how long you watch them, or any viewing habits  
- ❌ **No external communication**: We don't send any data to external servers or third-party services
- ❌ **No account access**: We don't access your YouTube account, login information, or profile data
- ❌ **No video data**: We don't read video titles, descriptions, comments, or any video metadata
- ❌ **No search history**: We don't access or store your YouTube search history
- ❌ **No analytics**: We don't use analytics tools, tracking pixels, or any monitoring services
- ❌ **No advertising**: We don't show ads or collect data for advertising purposes
- ❌ **No social features**: We don't access your social connections or sharing activity

## Third-Party Services

AutoContinue does not integrate with any third-party services or analytics platforms. The extension works entirely independently and does not communicate with external servers.

## Functionality

AutoContinue provides the following features:

### Core Features
- **Auto-continue**: Automatically dismisses YouTube's "Continue watching?" popups
- **Background support**: Works on YouTube tabs even when not active
- **YouTube Music support**: Works on YouTube Music platform
- **Idle detection**: Only triggers when user has been inactive for a specified time

## Data Sharing

We do not share, sell, or distribute any data because we don't collect any data in the first place. All data remains on your device and is never transmitted to external servers.

## Children's Privacy

AutoContinue does not collect any data from anyone, including children under 13.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date.

## Contact

If you have any questions about this privacy policy, please contact us:

- **GitHub Issues**: [Create an issue](https://github.com/sunnamed434/AutoContinue/issues)
- **GitHub Discussions**: [Join discussions](https://github.com/sunnamed434/AutoContinue/discussions)

## Compliance

This privacy policy complies with:
- **GDPR** (General Data Protection Regulation)
- **CCPA** (California Consumer Privacy Act)
- **Chrome Web Store Developer Program Policies**
- **Chrome Extension Manifest V3** requirements

---

**Your privacy is important to us. AutoContinue is designed to enhance your YouTube experience without compromising your privacy.**