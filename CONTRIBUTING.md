# Contributing to Sentinel-Mk2

Thank you for your interest in contributing to Sentinel-Mk2! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 16+
- npm or yarn

### Local Development Environment

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

4. For development with hot reloading:
   ```bash
   npm run watch
   ```

5. Load the `dist` directory as an unpacked extension in Chrome

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Coding Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## Reporting Bugs

Please use the GitHub Issues page to report bugs, specifying:

- Browser version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## Feature Requests

Feature requests are welcome! Please use GitHub Issues and clearly describe:

- The problem your feature would solve
- How your feature would work
- Any alternatives you've considered

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
