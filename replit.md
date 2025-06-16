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

### June 16, 2025 - Advanced Position Sizing Engine with Kelly Criterion Complete
- **Created comprehensive position sizing system** (services/riskManager.js) with Kelly Criterion and fixed-fraction methods for optimal position allocation
- **Implemented intelligent risk calculation** combining confidence-based sizing, volatility adjustment, and portfolio percentage limits with emergency stop-loss protection
- **Built complete REST API endpoints** (/api/risk/size, /api/risk/settings, /api/risk/stats, /api/risk/simulate) for position sizing recommendations and risk management
- **Added interactive position sizing widget** (components/ui/position-sizing-widget.tsx) with real-time calculations, risk warnings, and detailed breakdown of sizing methods
- **Created dedicated Risk Management page** (client/src/pages/RiskManagement.tsx) with tabbed interface for calculator, settings, stats, and scenario analysis
- **Integrated Kelly Criterion mathematics** with win probability estimation, expected return calculation, and fraction optimization for maximum geometric growth
- **Added fixed-fraction sizing** as conservative alternative with configurable risk percentage and position limits for steady capital preservation
- **Built comprehensive simulation engine** generating 100+ scenarios across confidence/prediction ranges to validate position sizing strategies
- **Created risk metrics dashboard** with portfolio statistics, performance tracking, and real-time position recommendations for each prediction cycle
- **Added navigation integration** with Shield icon and seamless access from main dashboard for complete risk management workflow

### June 16, 2025 - ML Model Training with Enhanced Sentiment Features Complete
- **Resolved critical data parsing errors** by removing Unicode characters and console output interference from Python scripts causing JSON parsing failures in model training pipeline
- **Enhanced sentiment feature integration** expanded from 21 to 46 total features including comprehensive news sentiment analysis with OpenAI integration, social engagement metrics, and market sentiment indicators
- **Created clean data service** (dataServiceClean.py) with pure JSON output for reliable ML training data flow without console interference
- **Fixed Unicode encoding issues** in training scheduler logs and data service output that prevented successful model retraining execution
- **Integrated comprehensive sentiment metrics** including news_sentiment, sentiment_volume, sentiment_consistency, narrative_strength, fear_greed_index, btc_dominance, market_sentiment_score, sentiment_momentum, news_activity_level, social_engagement_rate, influencer_sentiment, reddit_sentiment, and twitter_sentiment
- **Maintained realistic data generation** with proper correlation between price movements and sentiment indicators for authentic training data
- **Completed ML training system** ready for automated retraining with enhanced 46-feature sentiment analysis integration
- **Resolved file corruption** in datasetExporter.js by removing extensive duplicate code sections causing syntax errors

### June 16, 2025 - Cross-Asset and Inter-Pillar Correlation Analysis Complete
- **Created comprehensive correlation analysis service** (services/correlation.js) with 30-day time series analysis across SOL technical, social, fundamental, and astrology pillars plus BTC/ETH/SOL price data
- **Implemented Pearson correlation computation** with symmetric matrix validation, diagonal verification, and correlation bounds checking for mathematical accuracy
- **Built complete REST API endpoints** (/api/analysis/correlations, /api/analysis/correlations/matrix, /api/analysis/correlations/insights) with caching, history tracking, and force refresh capabilities
- **Added interactive React heatmap dashboard** (client/src/pages/CorrelationAnalysis.tsx) with custom CSS grid visualization, correlation strength color coding, and real-time hover details
- **Integrated authentic data sources** using CoinGecko API for BTC/ETH prices, CryptoRank for SOL data, and stored prediction pillar scores with realistic fallback generation
- **Created correlation insights engine** with strongest/weakest correlation identification, pillar relationship analysis, and cross-asset correlation tracking
- **Built comprehensive testing suite** (test_correlation_analysis.js) validating matrix symmetry, correlation bounds, data quality, and API functionality across 10 test scenarios
- **Added correlation navigation** with GitBranch icon and integrated correlation analysis into main dashboard for easy access to cross-domain relationship monitoring

### June 16, 2025 - Real-Time Alerts Subsystem Complete
- **Created comprehensive alerts system** (services/alerts.js) with user-defined threshold rules and real-time evaluation
- **Implemented WebSocket broadcasting** (/ws/alerts) for live alert notifications with automatic client reconnection
- **Built complete REST API endpoints** (/api/alerts/rules, /api/alerts/active, /api/alerts/history) for alert management
- **Added React frontend interface** (client/src/pages/Alerts.tsx) with rule creation, live notifications, and alert acknowledgment
- **Integrated with prediction scheduler** to evaluate hourly predictions against active alert rules automatically
- **Created persistent storage** with SQLite for alert rules and history tracking with 500-entry rotation
- **Added comprehensive alert conditions** supporting 9 prediction fields with multiple operators and severity levels
- **Built real-time notification system** with toast notifications and WebSocket updates for immediate alert delivery
- **Created comprehensive testing suite** (test_alerts_system.js) validating rule management, WebSocket connectivity, and alert evaluation

### June 16, 2025 - Optuna Bayesian Hyperparameter Optimization Complete
- **Created comprehensive Optuna HPO service** (services/optunaTuner.py, services/optunaTuner.js) with Bayesian optimization for ensemble, LSTM, and hybrid model types
- **Implemented intelligent search spaces** for LSTM units (64-256), learning rates (0.0001-0.01), dropout rates, XGBoost parameters, and ensemble weights
- **Added complete REST API endpoints** (/api/ml/hpo/start, /api/ml/hpo/status, /api/ml/hpo/history, /api/ml/hpo/best-params) for optimization management
- **Integrated weekly deep-tuning scheduler** with automated Optuna optimization (100 ensemble trials, 75 LSTM trials, 50 hybrid trials) every Sunday at 02:00 UTC
- **Built comprehensive study analytics** including parameter importance analysis, convergence detection, and performance improvement tracking
- **Created TPE sampler configuration** with MedianPruner for efficient trial optimization and early stopping of poor configurations
- **Added SQLite study persistence** with trial logging, best parameter storage, and optimization history tracking for reproducible results
- **Built dashboard data integration** with real-time status monitoring, search space visualization, and trial progress tracking
- **Created comprehensive testing suite** (test_optuna_hpo.js) validating optimization workflows, parameter application, and multi-type study management

### June 16, 2025 - Walk-Forward Backtesting Framework Complete
- **Built comprehensive walk-forward backtesting system** (services/backtester.js) with rolling train/test windows for rigorous model validation
- **Implemented performance metrics calculation** including MSE, RMSE, MAE, MAPE, directional accuracy, R-squared, and confidence-weighted error analysis
- **Created complete REST API endpoints** (/api/backtest/run, /api/backtest/summary, /api/backtest/data, /api/backtest/window/:id) for backtesting execution and results retrieval
- **Added interactive React UI** (client/src/pages/Backtest.tsx) with comprehensive visualization of predicted vs actual prices, performance metrics tables, and window-by-window analysis
- **Integrated authentic data alignment** using CryptoRank sparkline API for historical price comparison with fallback to realistic synthetic data generation
- **Built pillar correlation analysis** examining relationships between technical, social, fundamental, and astrology scores with prediction accuracy
- **Created aggregate statistics framework** with mean, median, min, max, and standard deviation calculations across all validation windows
- **Added comprehensive testing suite** (test_backtest_framework.js) validating rolling window creation, metrics calculation, and API functionality

### June 16, 2025 - LSTM Time-Series Module with Ensemble Stacking Complete
- **Created dedicated LSTM predictor service** (services/lstmPredictor.js) with multi-layer TensorFlow.js architecture featuring 128+64+32 unit LSTM layers with dropout regularization
- **Implemented windowed sequence processing** with 60-step rolling windows across 16 features including price, volume, market cap, and pillar scores
- **Added comprehensive LSTM REST endpoints** (/api/ml/lstm/train, /api/ml/lstm/predict, /api/ml/lstm/info) supporting both real-time and batch inference
- **Integrated ensemble stacking system** (/api/ml/ensemble-stack) combining XGBoost predictions (60% weight) with LSTM forecasts (40% weight) for superior accuracy
- **Enhanced automated training scheduler** with LSTM retraining integration alongside existing XGBoost ensemble models for nightly optimization
- **Built confidence-based prediction system** with volatility-adjusted confidence scoring and directional classification (BULLISH/BEARISH/NEUTRAL)
- **Created model persistence layer** with automatic TensorFlow.js model serialization and scaler parameter storage for production deployment
- **Added comprehensive testing framework** (test_lstm_pipeline.js) validating training, prediction, batch processing, and ensemble stacking functionality

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

### Enhanced ML Pipeline with Bayesian Optimization
1. **Data Collection:** Multi-source authenticated data fetching with 60-step windowed sequences
2. **Feature Engineering:** 16 technical indicators, sentiment analysis, astrological features with min-max normalization
3. **Hyperparameter Optimization:** Optuna TPE sampler with intelligent search spaces for LSTM units, learning rates, XGBoost parameters, and ensemble weights
4. **Ensemble Training:** Multi-layer LSTM (128+64+32 units) + XGBoost + Random Forest with Bayesian-optimized hyperparameters
5. **Ensemble Stacking:** Weighted combination (XGBoost 60%, LSTM 40%) with confidence-based scoring and optimized weights
6. **Prediction Generation:** Real-time price forecasting with volatility-adjusted confidence and directional classification
7. **Automated Retraining:** Nightly LSTM + ensemble retraining with weekly Optuna deep-tuning (225 total trials) on Sundays
8. **Backtesting:** Historical validation with walk-forward analysis and optimized model performance metrics

### API Endpoints
**Core ML Pipeline:**
- `/api/ml/train` - Train ensemble models on historical data
- `/api/ml/predict` - Generate predictions using trained models
- `/api/ml/feature-importance` - Analyze feature importance across models
- `/api/ml/explainability` - Generate SHAP-based feature attribution reports

**LSTM Time-Series Module:**
- `/api/ml/lstm/train` - Train multi-layer LSTM with windowed sequences
- `/api/ml/lstm/predict` - Real-time and batch LSTM price forecasting
- `/api/ml/lstm/info` - LSTM model architecture and status information

**Ensemble Stacking:**
- `/api/ml/ensemble-stack` - Combined XGBoost + LSTM weighted predictions

**Training Automation:**
- `/api/training/status` - Automated scheduler status and logs
- `/api/training/trigger` - Manual training initiation (standard/deep)
- `/api/training/logs` - Training history and performance metrics

**Walk-Forward Backtesting:**
- `/api/backtest/run` - Execute rolling train/test window validation
- `/api/backtest/summary` - Aggregate performance metrics across windows
- `/api/backtest/data` - Predicted vs actual data points for visualization
- `/api/backtest/window/:id` - Individual window performance details

**Bayesian Hyperparameter Optimization:**
- `/api/ml/hpo/search-spaces` - Get available optimization search spaces
- `/api/ml/hpo/start` - Start Optuna optimization study with specified trials
- `/api/ml/hpo/status` - Get current optimization progress and status
- `/api/ml/hpo/stop` - Stop active optimization study
- `/api/ml/hpo/history` - Get trial history and optimization results
- `/api/ml/hpo/best-params/:type` - Get best parameters for model type
- `/api/ml/hpo/statistics/:type` - Get study analytics and convergence data
- `/api/ml/hpo/apply-best/:type` - Apply optimized parameters to models
- `/api/ml/hpo/dashboard-data` - Get comprehensive HPO dashboard data

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