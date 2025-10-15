# Contributing to AutoContinue

Thank you for your interest in contributing to AutoContinue! This document provides guidelines for contributing to the project.

## Development Workflow

### Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/AutoContinue.git
   cd AutoContinue
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Create a branch**:
   ```bash
   git checkout -b your-branch-name
   ```

5. **Make your changes and test**:
   ```bash
   npm run test
   npm run lint
   npm run validate:locales
   npm run build
   ```

6. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add your feature"
   ```

7. **Push and create a Pull Request**:
   ```bash
   git push origin your-branch-name
   ```

## Release Process

### Creating a New Release

1. **Update version in code** (if needed)
2. **Create and push a tag**:
   ```bash
   git tag 1.0.1
   git push origin 1.0.1
   ```

3. **GitHub Actions will automatically**:
   - Run tests
   - Build all browser extensions
   - Create a GitHub Release
   - Upload ZIP files for manual installation

### Version Numbering

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes (backward compatible)

## Development Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Build for development
npm run build:dev

# Build for production
npm run build

# Build for specific browser
npm run build:chrome
npm run build:firefox
npm run build:safari

# Watch for changes
npm run build:watch

# Clean build directory
npm run clean

# Validate localization files
npm run validate:locales
```

## Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** and **Prettier** configurations
- Write **unit tests** for new features
- Use **meaningful commit messages**

## Testing

- Write tests in the `test/` directory
- Use **Jest** for unit testing
- Test all browser compatibility

## Pull Request Guidelines

1. **Keep PRs small and focused**
2. **Write clear descriptions**
3. **Include tests for new features**
4. **Update documentation if needed**
5. **Ensure all checks pass**

## Questions?

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/sunnamed434/AutoContinue/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/sunnamed434/AutoContinue/discussions)
- 📧 **Contact**: Open an issue for questions

Thank you for contributing! 🚀
