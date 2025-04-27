# Sentinel MK2 - Advanced Web Security Assistant

<p align="center">
  <img src="site/images/sentinel-logo.png" alt="Sentinel MK2 Logo" width="200">
</p>

<p align="center">
  <a href="https://github.com/yourusername/sentinel-mk2/releases">
    <img alt="Version" src="https://img.shields.io/github/v/release/yourusername/sentinel-mk2?include_prereleases">
  </a>
  <a href="https://github.com/yourusername/sentinel-mk2/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/yourusername/sentinel-mk2">
  </a>
  <a href="https://github.com/yourusername/sentinel-mk2/issues">
    <img alt="Issues" src="https://img.shields.io/github/issues/yourusername/sentinel-mk2">
  </a>
</p>

> Advanced web security extension with AI-powered insights and real-time protection
> 
> This project was created during the Hackhazards 25 hackathon organized by the Name Space community.

## ✨ Features

- **Real-time Security Scanning**: Automatic website security analysis
- **Visual Link Protection**: Identifies and marks potentially malicious links
- **AI Security Analysis**: Groq API integration for intelligent security insights
- **URL & Domain Analysis**: Deep inspection of website properties and certificates
- **Screen Content Analysis**: Optional integration with Screenpipe for enhanced protection

## 🚀 Installation

Since the extension is not currently available on the Chrome Web Store, you can install it directly:

1. Download the latest release from our [website](https://sentinel-security.example.com/download)
2. Extract the ZIP file to a folder on your computer
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top-right corner
5. Click "Load unpacked" and select the extracted folder
6. Sentinel MK2 is now installed and ready to use

## ⚙️ Configuration

### Auto-Scan Settings

- **Enable Automatic Scanning**: Toggle automatic security scanning
- **Scan Interval**: Set how frequently scans should run
- **Enable Notifications**: Toggle security notifications
- **Notification Threshold**: Set the risk level for notifications

### Visual Indicators

- **Enable Link Markers**: Toggle visual security indicators for links
- **Marker Style**: Choose between icons, colors, or both

### API Configuration

Sentinel uses the Groq API for AI-powered security analysis. To use this feature:
1. Obtain an API key from [Groq](https://console.groq.com/)
2. Enter your key in the extension settings

### Data Retention

Configure how long Sentinel retains your security scan history:
- 7 days
- 30 days
- 90 days
- Forever

## 💻 Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sentinel-mk2.git
   cd sentinel-mk2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the `dist` directory as an unpacked extension in Chrome

### Project Structure

```
sentinel-mk2/
├── icons/                # Extension icons
├── popup.html            # Main extension popup
├── popup.js              # Popup functionality
├── popup.css             # Popup styling
├── background.js         # Background script
├── content.js            # Content script
├── linkMarkers.js        # Link marking functionality
├── config.js             # Configuration
├── manifest.json         # Extension manifest
└── site/                 # Companion website
```

## License

MIT License - See [LICENSE](LICENSE) for details

## Privacy Policy

Sentinel MK2 respects your privacy. See our [Privacy Policy](https://sentinel-security.example.com/privacy) for details on what information we collect and how we use it.

## Support

For support, please visit [our website](https://sentinel-security.example.com/support) or create an issue on our GitHub repository.
