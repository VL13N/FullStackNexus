# Continuous Integration Setup Guide

## Overview
Comprehensive CI/CD pipeline with GitHub Actions for automated testing, health checks, and code quality enforcement.

## GitHub Actions Workflow
**File**: `.github/workflows/ci.yml`

### Pipeline Stages
1. **Test Stage** - Unit tests, TypeScript checks, linting
2. **Health Check Stage** - Endpoint validation and service verification  
3. **Integration Stage** - End-to-end testing and ML pipeline validation
4. **Security Stage** - Vulnerability scanning and secret detection

### Supported Node.js Versions
- Node.js 18.x
- Node.js 20.x

## Test Configuration

### Jest Setup
- **Config**: `jest.config.js`
- **Setup**: `jest.setup.js`
- **Environment**: jsdom for React components
- **Coverage**: 80% threshold for branches, functions, lines, statements

### Babel Configuration
- **File**: `babel.config.js`
- **Presets**: env, react, typescript
- **Environment**: Separate test configuration

## Code Quality Tools

### ESLint
- **Config**: `.eslintrc.js`
- **Rules**: TypeScript, React, Prettier integration
- **Scope**: All .ts, .tsx, .js, .jsx files

### Prettier
- **Config**: `.prettierrc`
- **Settings**: 2-space indentation, single quotes, trailing commas

## Test Suites

### Service Tests
- `__tests__/services/riskManager.test.js` - Position sizing and Kelly Criterion
- `__tests__/services/correlation.test.js` - Correlation analysis and matrix operations

### Component Tests
- `__tests__/components/PositionSizingWidget.test.tsx` - React component testing

### API Tests
- `__tests__/api/riskRoutes.test.js` - REST endpoint validation

### Integration Tests
- `__tests__/integration/fullPlatform.test.js` - End-to-end workflows

## Health Check System
**Script**: `scripts/healthcheck.js`

### Validated Endpoints
- ML Prediction and Training (/api/ml/*)
- Risk Management (/api/risk/*)
- Correlation Analysis (/api/analysis/*)
- Alert System (/api/alerts/*)
- HPO System (/api/ml/hpo/*)
- Data Sources (CryptoRank, TAAPI, LunarCrush, Astrology)
- WebSocket Connections (/ws/alerts)

### Health Check Features
- Timeout handling (10 second limit)
- Retry mechanisms for failed requests
- Comprehensive reporting with success rates
- WebSocket connectivity testing

## Running Tests Locally

### Install Dependencies
```bash
npm ci
```

### Run All Tests
```bash
npm test
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run Integration Tests
```bash
npm run test:integration
```

### Health Check
```bash
npm run healthcheck
```

### Linting and Formatting
```bash
npm run lint
npm run format:check
```

## CI Pipeline Triggers
- Pull requests to main/develop branches
- Direct pushes to main/develop branches

## Expected Test Results
- **Unit Tests**: 80%+ code coverage
- **Health Check**: 95%+ endpoint success rate
- **Integration Tests**: All critical workflows passing
- **Security Scan**: No high-severity vulnerabilities

## Coverage Requirements
- **Services**: Complete coverage of risk management, correlation analysis, alerts
- **Components**: React component rendering, user interactions, API integration
- **API Routes**: Request validation, response formatting, error handling
- **Integration**: Cross-service functionality, end-to-end workflows

## Security Features
- NPM audit for dependency vulnerabilities
- TruffleHog secret scanning
- Environment variable validation
- API key protection

## Performance Validation
- Response time limits (5 second timeout)
- Concurrent request handling
- Memory usage monitoring
- WebSocket connection stability

## Troubleshooting

### Common Issues
1. **Test timeouts**: Increase timeout in Jest config
2. **API failures**: Check environment variables and network connectivity
3. **Coverage gaps**: Add tests for uncovered code paths
4. **Linting errors**: Run `npm run lint:fix` for auto-fixes

### Debug Commands
```bash
# Run specific test file
npm test __tests__/services/riskManager.test.js

# Run tests in watch mode
npm run test:watch

# Debug health check
node scripts/healthcheck.js

# Check TypeScript errors
npm run type-check
```

## Integration with Replit
- Workflow automatically restarts on package changes
- Environment variables managed through Replit secrets
- Health checks validate all platform endpoints
- Tests run against live application instance