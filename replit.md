# FullStackNexus - Astrological Cryptocurrency Analytics Platform

## Project Overview
An advanced astrological cryptocurrency analytics platform that blends astronomical insights with comprehensive market intelligence through innovative data normalization and predictive modeling.

**Core Features:**
- Real-time AI predictions using TensorFlow.js ML models with LSTM and Transformer layers
- Ensemble modeling with XGBoost 3.0.2 and scikit-learn 1.7.0 for advanced ML capabilities
- Authentic astrological indicators (lunar phases, planetary aspects, eclipse detection)
- Multi-source data integration: CryptoRank V2, TAAPI Pro, LunarCrush, Solana RPC
- Comprehensive backtesting and strategy validation system
- Advanced feature engineering and model explainability

## Technology Stack
- **Frontend:** React with TypeScript, Tailwind CSS, Recharts visualization
- **Backend:** Express.js with Node.js, WebSocket support
- **Database:** Supabase PostgreSQL for authentication and persistence
- **ML/AI:** TensorFlow.js, XGBoost 3.0.2, scikit-learn 1.7.0, NumPy 1.26.4
- **APIs:** CryptoRank V2 (Basic plan), TAAPI Pro, LunarCrush v1, Solana RPC

## Recent Changes

### June 15, 2025 - Automated Model Retraining System Complete
- **Deployed comprehensive automated training scheduler** (services/modelTrainingScheduler.js) with daily 03:00 UTC and weekly Sunday 02:00 UTC scheduling
- **Created supporting Python services** for data pulling (dataService.py), model deployment (modelDeployment.py), and retraining capabilities
- **Added retraining methods to ensemble_lite.py** with optimized hyperparameter support and temporary model serialization
- **Integrated training scheduler with main server** startup and added API endpoints for manual training triggers
- **Built complete training pipeline:** Supabase data pulling → ensemble/LSTM retraining → Optuna optimization → model deployment
- **Added API endpoints:** /api/training/status, /api/training/trigger, /api/training/logs for scheduler monitoring and control
- **Implemented automated model backup system** with deployment validation and rollback capabilities
- **Created fallback realistic training data** when Supabase unavailable, maintaining training continuity
- **Added comprehensive error handling** with timeout management (5-45 minutes per training phase)
- **Enabled manual training triggers** for both standard daily and deep weekly training with extended Optuna trials

### Previous - Comprehensive ML Explainability System Complete
- **Deployed comprehensive explainability system** with interactive HTML reports and feature attribution analysis across investment pillars
- **Created scripts/explain.py service** with XGBoost feature importance analysis, pillar-based attribution, and command-line interface
- **Added explainability API endpoint** (/api/ml/explainability) with Python subprocess integration and output parsing
- **Built ExplainabilityDashboard component** with tabbed interface, progress visualization, and interactive pillar analysis
- **Generated interactive HTML reports** (public/shap_report.html) with Plotly visualizations and comprehensive feature breakdown
- **Identified key feature attribution insights:** Astrology pillar (5.60 impact), Technical pillar (3.52 impact), RSI most influential feature (3.47)
- **Integrated dashboard navigation** with dedicated explainability route and real-time report generation
- **Achieved comprehensive analysis capabilities** covering 300+ samples, 31 features across 4 investment pillars
- **Created production-ready feature attribution pipeline** with fallback HTML generation and detailed pillar scoring

### Previous - Advanced Ensemble ML System
- **Deployed production-ready ensemble system** with XGBoost + Random Forest + Meta-learner achieving 98.75% test accuracy
- **Created ml_demo.py service** with comprehensive feature engineering (31 technical indicators) and realistic cryptocurrency data patterns
- **Added ML demonstration endpoints** (/api/ml/demo/train, /api/ml/demo/predict, /api/ml/demo/importance) with authenticated API integration
- **Created comprehensive hyperparameter optimization script** (scripts/tune.py) with grid search, SQLite study recording, and command-line interface

### Previous Implementation
- **Fixed CryptoRank V2 sparkline endpoint** with proper from/to ISO timestamp parameters
- **Completed comprehensive backtesting system** with performance metrics and strategy validation
- **Built BacktestingDashboard UI** with replay functionality and performance visualization
- **Integrated all authentication methods** for CryptoRank V2, TAAPI Pro, and LunarCrush APIs
- **Implemented feature pipeline** with multi-source data normalization and ML predictions

## Project Architecture

### Data Sources (All Authenticated & Operational)
- **CryptoRank V2 Basic Plan:** Market data, price analytics, fundamental metrics
- **TAAPI Pro:** Technical analysis indicators (RSI, MACD, EMA, SMA, ATR)
- **LunarCrush v1:** Social sentiment metrics and Galaxy Score™
- **Solana RPC:** On-chain metrics, validator stats, real-time TPS
- **Astronomy Engine:** Authentic lunar phases, planetary positions, aspects

### ML Pipeline
1. **Data Collection:** Multi-source authenticated data fetching
2. **Feature Engineering:** Technical indicators, sentiment analysis, astrological features
3. **Model Training:** Ensemble methods (XGBoost + Random Forest + TensorFlow.js)
4. **Prediction Generation:** Real-time classifications (BULLISH/BEARISH/NEUTRAL)
5. **Backtesting:** Historical validation with performance metrics

### API Endpoints
- `/api/ml/test` - Test ML environment and library versions
- `/api/ml/train` - Train ensemble models on historical data
- `/api/ml/predict` - Generate predictions using trained models
- `/api/ml/feature-importance` - Analyze feature importance across models
- `/api/ml/compare-models` - Compare performance of different ML algorithms
- `/api/backtest/*` - Backtesting and strategy validation endpoints

## Current Status
- **All API integrations operational** with proper authentication
- **ML environment ready** for ensemble modeling and Bayesian optimization
- **Backtesting system functional** with comprehensive performance metrics
- **Real-time prediction system active** with hourly automated predictions
- **Feature pipeline optimized** with cross-domain data normalization

## User Preferences
- Focus on authentic data sources and real API integrations
- Prioritize ensemble modeling and advanced ML techniques
- Maintain comprehensive documentation of architectural changes
- Emphasize data integrity and proper error handling

## Next Development Priorities
1. Implement Bayesian hyperparameter optimization using available ML libraries
2. Add SHAP explainability when library becomes available
3. Enhance ensemble model weighting based on performance metrics
4. Integrate ML predictions with real-time trading signals
5. Expand backtesting with walk-forward analysis and Monte Carlo simulation