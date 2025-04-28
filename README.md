# 🛡️ Sentinel MK2
![github-submission-banner](site/images/hackhazards-banner.png)
[![Hackathon Project](https://img.shields.io/badge/Hackathon-HackHazards%2025-blueviolet)](https://sentinel-cyber.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Demo Video](https://img.shields.io/badge/Demo-YouTube-red)](https://youtu.be/U0GpWONDVRU)

A next-generation web security browser extension with AI-powered analysis, created for the HackHazards 25 hackathon.

## 🌟 Features

- **Real-time Security Scoring**: Get instant security assessments of any website you visit
- **Certificate Analysis**: Detailed SSL/TLS certificate verification for secure connections
- **AI Security Chat**: Ask questions about website security and get AI-powered insights via Groq API
- **Link Security Markers**: Visual indicators show the security level of links before you click them
- **Screen Content Analysis**: Monitor screen content for potential security risks with Screenpipe

## 🚀 Demo & Links

- **Website**: [sentinel-cyber.vercel.app](https://sentinel-cyber.vercel.app)
- **Demo Video**: [Watch on YouTube](https://youtu.be/U0GpWONDVRU)
- **Privacy Policy**: [View Privacy Policy](https://sentinel-cyber.vercel.app/privacy.html)

## 📋 Setup Guide

### Extension Setup

1. **Download the Extension**
   - Download the unpacked extension from [our website](https://sentinel-cyber.vercel.app/download.html) or use the files in the `dist` folder of this repo

2. **Enable Developer Mode**
   - Open Chrome and navigate to `chrome://extensions/` 
   - Toggle on "Developer mode" in the top-right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked" and select the folder containing the extension files

4. **Configure API Key**
   - Get a free API key from [Groq](https://console.groq.com/)
   - Click the Sentinel MK2 icon in your browser toolbar
   - Go to Settings and add your Groq API key

5. **You're Ready to Go!**
   - The extension is now active and protecting your browsing

### Screenpipe Setup (Optional)

For enhanced screen content analysis:

1. Open Windows PowerShell or Command Prompt
2. Run: `iwr get.screenpi.pe/cli.ps1 | iex`
3. Then type: `screenpipe.exe`
4. Always run this before using the extension's screen analysis features

## 🛠️ Technology Stack

- **Chrome Extension APIs**: For browser integration and site analysis
- **Groq API**: Powers the AI security insights using LLaMA 3 70B model
- **Screenpipe**: Enables screen content analysis
- **JavaScript**: Core functionality and browser interaction
- **Webpack**: Build system for the extension

## 🎬 Hackathon Project Context

Sentinel MK2 was created during the HackHazards 25 hackathon. This project demonstrates how browser extensions can leverage AI to enhance online security through:

- Automated security analysis of websites
- Context-aware AI assistant for security questions
- Visual phishing detection using screen content analysis
- Proactive link safety indicators

## 📝 Contributing

As this was a hackathon project, we're open to contributions! Feel free to:

1. Fork the repository
2. Create a feature branch: `git checkout -b new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">
  <a href="https://sentinel-cyber.vercel.app">
    <img src="site/images/sentinel-logo.png" alt="Sentinel Logo" width="80" height="80">
  </a>
  <br>
  <i>Created for HackHazards 25 - A project by Team RedLine</i>
</p>
