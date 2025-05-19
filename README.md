# 🛡️ Sentinel MK2

![HackHazards Submission Banner](site/images/hackhazards-banner.png)

[![Hackathon Project](https://img.shields.io/badge/Hackathon-HackHazards%2025-blueviolet)](https://sentinel-cyber.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Demo Video](https://img.shields.io/badge/Demo-YouTube-red)](https://youtu.be/U0GpWONDVRU)

> **Sentinel MK2** is a next-gen browser extension for **real-time web security**, built with **AI-powered analysis** and visual indicators to enhance your online safety—developed during **HackHazards 25**, where it ranked in the **Top 100 projects** out of **8000+ submissions** from **17500+ participants**, representing **25+ countries** and **30+ universities**.

---

## 🌐 Live Project

* 🔗 **Website**: [sentinel-cyber.vercel.app](https://sentinel-cyber.vercel.app)
* 🎥 **Demo Video**: [Watch on YouTube](https://youtu.be/U0GpWONDVRU)
* 📄 **Privacy Policy**: [View Here](https://sentinel-cyber.vercel.app/privacy.html)

---

## 🌟 Key Features

* **🔒 Real-Time Security Scoring**: Instantly assess the security of any website you visit
* **🔐 SSL/TLS Certificate Insights**: View detailed certificate verification for HTTPS connections
* **🤖 AI Security Chat**: Ask AI-powered questions about the current site’s safety using the Groq API
* **🧭 Link Security Markers**: Get visual cues on link safety before clicking
* **🖥️ Screen Content Analysis** *(via Screenpipe)*: Detect potential phishing or risky content on-screen

---

## 🧰 Tech Stack

* **Chrome Extension APIs** — For deep browser integration
* **Groq API (LLaMA 3 70B)** — Powers the AI assistant
* **Screenpipe** — Enables real-time screen analysis
* **JavaScript + Webpack** — Core logic and bundling

---

## ⚙️ Installation Guide

### 🔗 Browser Extension Setup

1. **Download**:

   * Grab the unpacked extension from [Download Page](https://sentinel-cyber.vercel.app/download.html) or use the `dist` folder.

2. **Load in Chrome**:

   * Visit `chrome://extensions/`
   * Enable *Developer Mode*
   * Click **Load unpacked** and select the extension folder

3. **API Key Setup**:

   * Get your free Groq API key from [Groq Console](https://console.groq.com)
   * Open the extension → Settings → Paste your API key

4. ✅ You’re all set! The extension is now active.

### 🖥️ Screenpipe Setup *(Optional)*

1. Open PowerShell or CMD
2. Run:

   ```sh
   iwr get.screenpi.pe/cli.ps1 | iex
   screenpipe.exe
   ```
3. Keep this running in the background when using screen analysis features

---

## 🎯 Hackathon Purpose

Sentinel MK2 was built for **HackHazards 25**, a cybersecurity-focused hackathon. The goal:

> Empower users to **proactively identify and understand** security threats through a browser-native, AI-integrated tool.

### Project Highlights:

* Contextual AI explanations for non-technical users
* Proactive phishing and fake-site detection
* Real-time, privacy-first assessments

---

## 🤝 Contributing

Want to help improve Sentinel MK2? Follow these steps:

```bash
# Fork & clone the repo
git checkout -b feature-name
# Make your changes
git commit -m "Describe your changes"
git push origin feature-name
# Open a pull request!
```

---

## 📄 License

MIT License – see [LICENSE](LICENSE)

---

<p align="center">
  <a href="https://sentinel-cyber.vercel.app">
    <img src="site/images/sentinel-logo.png" alt="Sentinel Logo" width="80" height="80">
  </a>
  <br>
  <i>Created for HackHazards 25 – A project by Amaan Syed<br>
  🏅 Top 100 Project | Among 8000+ projects | 17500+ participants</i>
</p>

---
