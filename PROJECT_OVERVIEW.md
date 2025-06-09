# Astrological Cryptocurrency Analytics Platform

## Overview
An advanced AI-powered trading prediction system combining astronomical insights with comprehensive market intelligence. The platform uses multi-domain data normalization to provide real-time cryptocurrency analysis with confidence tracking and user feedback loops.

## Key Features Implemented

### 🎯 Dynamic Prediction Engine
- **Real-time ML predictions** with confidence levels ranging 53-68%
- **Four-pillar analysis**: Technical, Social, Fundamental, and Astrological scoring
- **Automated generation** every 15 minutes with fault tolerance
- **Historical tracking** and trend analysis

### 🔄 Enhanced Data Refresh System
- **Configurable intervals**: Dashboard (30s), Predictions (15m), Health checks (15m)
- **Robust error handling** with exponential backoff retry logic
- **Automatic recovery** from API failures without stopping predictions
- **Real-time monitoring** of system health and API status

### 📊 Advanced Analytics & Visualization
- **Confidence trend sparklines** showing prediction evolution
- **Backtest analytics** for 7-day performance analysis
- **Pillar contribution tracking** with weighted scoring
- **Category distribution** analysis (Bullish/Bearish/Neutral)

### ⚙️ Configuration Management
- **Settings interface** for real-time parameter adjustment
- **Environment variable support** for production deployments
- **Performance tuning** without redeployment
- **Error threshold management**

### 👥 User Experience Features
- **Feedback collection system** for prediction helpfulness
- **Interactive dashboards** with 30-second auto-refresh
- **Manual refresh controls** for immediate updates
- **Error state handling** with user-friendly messages

## Technical Architecture

### Backend Stack
- **Express.js** server with TypeScript support
- **Supabase PostgreSQL** for data persistence
- **TensorFlow.js** for machine learning predictions
- **Node-cron** for automated scheduling
- **Multiple API integrations**: LunarCrush, TAAPI, CryptoRank, Astronomy Engine

### Frontend Stack
- **React** with TypeScript
- **Tailwind CSS** with shadcn/ui components
- **Recharts** for data visualization
- **TanStack Query** for state management
- **Wouter** for routing

### Key Services
- **Prediction Service**: ML-based price movement forecasting
- **Scheduler Service**: Automated prediction generation with error recovery
- **Error Handler**: Centralized fault tolerance with retry logic
- **Data Fetchers**: Multi-source market data aggregation
- **Normalization Engine**: Cross-domain data standardization

## Project Structure

```
├── api/                          # Backend API integrations
│   ├── astrology.js             # Astronomy Engine integration
│   ├── cryptorank.js            # CryptoRank API service
│   ├── lunarcrush.js            # LunarCrush social metrics
│   ├── onchain.js               # Solana blockchain data
│   └── taapi.js                 # Technical analysis indicators
├── client/src/                   # React frontend
│   ├── components/              # Reusable UI components
│   │   ├── ConfidenceSparkline.tsx
│   │   └── FeedbackWidget.tsx
│   └── pages/                   # Main application pages
│       ├── dashboard.tsx        # Primary analytics dashboard
│       └── settings.tsx         # Configuration interface
├── components/                   # Legacy React components
│   ├── AstrologyDemo.tsx
│   ├── CryptoRankDemo.tsx
│   └── PredictionWidget.tsx
├── server/                      # Express backend
│   ├── index.ts                 # Main server entry point
│   ├── routes.js                # API route definitions
│   └── vite.ts                  # Vite development setup
├── services/                    # Core business logic
│   ├── prediction.js            # ML prediction engine
│   ├── scheduler.js             # Automated task scheduling
│   ├── fetchAndNormalize.js     # Data aggregation
│   └── scorers.js               # Pillar scoring algorithms
├── scripts/                     # Utility scripts
│   ├── generatePrediction.js    # Manual prediction generation
│   └── trainModel.js            # ML model training
└── utils/                       # Helper utilities
    ├── cache.js                 # Caching mechanisms
    └── errorHandler.js          # Error recovery system
```

## Recent Enhancements

### Problem Solved: Stale Data Issue
- **Before**: Predictions showed static 65% confidence repeatedly
- **After**: Dynamic predictions with varied confidence (53-68%) and different percentage forecasts
- **Solution**: Fixed TypeScript syntax errors, implemented fresh data generation, enhanced scheduler frequency

### New Capabilities Added
1. **Confidence Visualization**: Sparkline charts showing prediction confidence trends over time
2. **Error Recovery**: Robust retry logic with exponential backoff for API failures
3. **Configurable Settings**: Real-time adjustment of refresh intervals and system parameters
4. **Performance Analytics**: Backtest functionality for model accuracy assessment
5. **User Feedback Loop**: Rating system for prediction helpfulness with comment collection

## API Endpoints

### Prediction Management
- `GET /api/predictions/latest` - Get most recent prediction
- `GET /api/predictions/history` - Historical prediction data
- `POST /api/predictions/generate` - Trigger manual prediction

### System Configuration
- `GET /api/config/scheduler` - Current system settings
- `POST /api/config/scheduler` - Update configuration
- `GET /api/system/errors` - Error monitoring data

### Analytics & Insights
- `GET /api/analytics/backtest` - Performance analysis
- `POST /api/feedback/prediction` - User feedback submission

### Data Sources
- `GET /api/cryptorank/data` - Fundamental market data
- `GET /api/lunarcrush/metrics` - Social sentiment metrics
- `GET /api/astrology/moon-phase` - Astronomical data
- `GET /api/taapi/indicators` - Technical analysis data

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=...

# API Keys
TAAPI_API_KEY=...
LUNARCRUSH_API_KEY=...
CRYPTORANK_API_KEY=...
OPENAI_API_KEY=...

# Configuration (Optional)
PREDICTION_INTERVAL_MINUTES=15
DASHBOARD_REFRESH_SECONDS=30
MAX_RETRY_ATTEMPTS=3
```

## Installation & Setup

1. **Clone repository and install dependencies**
2. **Set up environment variables** in Replit Secrets or .env file
3. **Initialize database** - Supabase tables created automatically
4. **Start development server** - `npm run dev`
5. **Access dashboard** at provided URL

## Key Innovations

### Multi-Domain Intelligence
- **Technical Analysis**: RSI, MACD, EMA indicators from TAAPI
- **Social Sentiment**: Galaxy Score, AltRank from LunarCrush  
- **Fundamental Data**: Market cap, volume, supply metrics from CryptoRank
- **Astrological Factors**: Moon phases, planetary positions from Astronomy Engine

### Adaptive Confidence System
- **Score Alignment**: Higher confidence when all pillars agree
- **Extreme Detection**: Increased confidence for strong directional signals
- **Variance Analysis**: Lower confidence when pillar scores diverge significantly

### Production-Ready Features
- **Fault Tolerance**: Automatic recovery from individual API failures
- **Scalable Architecture**: Modular services with clean separation
- **Monitoring**: Comprehensive error tracking and performance metrics
- **User Experience**: Responsive UI with real-time updates

This represents a complete transformation from a static demo to a living, breathing AI forecasting engine with enterprise-grade reliability and user experience features.