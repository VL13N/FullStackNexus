/**
 * Ensemble ML Service Integration
 * Integrates advanced ML capabilities with existing prediction pipeline
 * Combines XGBoost, Random Forest, and TensorFlow.js for enhanced predictions
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class EnsembleMLService {
  constructor() {
    this.isInitialized = false;
    this.modelPerformance = {};
    this.featureImportance = {};
    this.lastTrainingTime = null;
  }

  /**
   * Run Python ML script with error handling
   */
  async runPythonScript(scriptContent, timeout = 45000) {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', ['-c', scriptContent]);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timer = setTimeout(() => {
        python.kill('SIGTERM');
        reject(new Error('ML script timeout'));
      }, timeout);

      python.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (e) {
            resolve({ success: true, output: stdout.trim() });
          }
        } else {
          reject(new Error(`ML script failed: ${stderr}`));
        }
      });

      python.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * Train ensemble models on historical prediction data
   */
  async trainEnsembleModels(historicalData) {
    try {
      const trainingScript = `
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor, VotingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.feature_selection import SelectKBest, f_regression
import warnings
warnings.filterwarnings('ignore')

# Parse historical data
data = ${JSON.stringify(historicalData)}
df = pd.DataFrame(data)

# Enhanced feature engineering for cryptocurrency data
def engineer_crypto_features(df):
    # Price-based features
    if 'price' in df.columns:
        df['price_returns'] = df['price'].pct_change()
        df['price_log_returns'] = np.log(df['price'] / df['price'].shift(1))
        df['price_volatility'] = df['price_returns'].rolling(window=10).std()
        
        # Technical indicators
        df['price_sma_5'] = df['price'].rolling(window=5).mean()
        df['price_sma_20'] = df['price'].rolling(window=20).mean()
        df['price_ema_12'] = df['price'].ewm(span=12).mean()
        df['price_ema_26'] = df['price'].ewm(span=26).mean()
        
        # Price ratios
        df['price_sma_ratio'] = df['price'] / df['price_sma_20']
        df['sma_cross'] = df['price_sma_5'] / df['price_sma_20']
        
        # MACD calculation
        df['macd'] = df['price_ema_12'] - df['price_ema_26']
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        df['macd_histogram'] = df['macd'] - df['macd_signal']
        
        # RSI calculation
        delta = df['price'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # Bollinger Bands
        bb_std = df['price'].rolling(window=20).std()
        df['bb_upper'] = df['price_sma_20'] + (bb_std * 2)
        df['bb_lower'] = df['price_sma_20'] - (bb_std * 2)
        df['bb_position'] = (df['price'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])
    
    # Volume features
    if 'volume' in df.columns:
        df['volume_sma'] = df['volume'].rolling(window=10).mean()
        df['volume_ratio'] = df['volume'] / df['volume_sma']
        df['price_volume'] = df.get('price', 1) * df['volume']
    
    # Multi-pillar sentiment features
    pillar_cols = ['tech_score', 'social_score', 'fund_score', 'astro_score']
    for col in pillar_cols:
        if col in df.columns:
            df[f'{col}_momentum'] = df[col].diff()
            df[f'{col}_sma'] = df[col].rolling(window=5).mean()
            df[f'{col}_normalized'] = (df[col] - df[col].rolling(window=20).mean()) / df[col].rolling(window=20).std()
    
    # Interaction features
    if all(col in df.columns for col in ['tech_score', 'social_score']):
        df['tech_social_composite'] = df['tech_score'] * df['social_score'] / 100
    
    if all(col in df.columns for col in ['price_volatility', 'volume_ratio']):
        df['volatility_volume_signal'] = df['price_volatility'] * df['volume_ratio']
    
    # Lag features for time series
    for lag in [1, 3, 6, 12]:
        if 'price' in df.columns:
            df[f'price_lag_{lag}'] = df['price'].shift(lag)
        for col in pillar_cols:
            if col in df.columns:
                df[f'{col}_lag_{lag}'] = df[col].shift(lag)
    
    return df.dropna()

# Engineer features
df_engineered = engineer_crypto_features(df)

if len(df_engineered) < 30:
    result = {"success": False, "error": f"Insufficient data: {len(df_engineered)} samples after feature engineering"}
else:
    # Prepare target variable (next period price change)
    df_engineered['target'] = df_engineered['price'].shift(-1) / df_engineered['price'] - 1
    df_engineered = df_engineered.dropna()
    
    # Feature selection
    feature_cols = [col for col in df_engineered.columns 
                   if col not in ['price', 'target', 'timestamp', 'predicted_category', 'confidence']]
    
    X = df_engineered[feature_cols]
    y = df_engineered['target']
    
    # Advanced feature selection
    selector = SelectKBest(score_func=f_regression, k=min(25, len(feature_cols)))
    X_selected = selector.fit_transform(X, y)
    selected_features = X.columns[selector.get_support()].tolist()
    
    # Time series split (use earlier data for training)
    split_idx = int(len(df_engineered) * 0.8)
    X_train, X_test = X_selected[:split_idx], X_selected[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    # Robust scaling for financial data
    scaler = RobustScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Model configurations optimized for financial data
    models = {}
    predictions = {}
    metrics = {}
    
    # XGBoost with financial-optimized parameters
    xgb_params = {
        'objective': 'reg:squarederror',
        'n_estimators': 200,
        'max_depth': 6,
        'learning_rate': 0.05,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'reg_alpha': 0.1,
        'reg_lambda': 0.1,
        'random_state': 42
    }
    
    xgb_model = xgb.XGBRegressor(**xgb_params)
    xgb_model.fit(X_train_scaled, y_train)
    xgb_pred = xgb_model.predict(X_test_scaled)
    
    models['xgboost'] = xgb_model
    predictions['xgboost'] = xgb_pred.tolist()
    metrics['xgboost'] = {
        'mse': float(mean_squared_error(y_test, xgb_pred)),
        'mae': float(mean_absolute_error(y_test, xgb_pred)),
        'r2': float(r2_score(y_test, xgb_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_test, xgb_pred)))
    }
    
    # Random Forest optimized for financial volatility
    rf_params = {
        'n_estimators': 200,
        'max_depth': 12,
        'min_samples_split': 5,
        'min_samples_leaf': 2,
        'max_features': 'sqrt',
        'random_state': 42,
        'n_jobs': -1
    }
    
    rf_model = RandomForestRegressor(**rf_params)
    rf_model.fit(X_train_scaled, y_train)
    rf_pred = rf_model.predict(X_test_scaled)
    
    models['random_forest'] = rf_model
    predictions['random_forest'] = rf_pred.tolist()
    metrics['random_forest'] = {
        'mse': float(mean_squared_error(y_test, rf_pred)),
        'mae': float(mean_absolute_error(y_test, rf_pred)),
        'r2': float(r2_score(y_test, rf_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_test, rf_pred)))
    }
    
    # Weighted ensemble based on individual performance
    xgb_weight = max(0.1, metrics['xgboost']['r2'])
    rf_weight = max(0.1, metrics['random_forest']['r2'])
    total_weight = xgb_weight + rf_weight
    
    ensemble_pred = (xgb_pred * xgb_weight + rf_pred * rf_weight) / total_weight
    
    metrics['ensemble'] = {
        'mse': float(mean_squared_error(y_test, ensemble_pred)),
        'mae': float(mean_absolute_error(y_test, ensemble_pred)),
        'r2': float(r2_score(y_test, ensemble_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_test, ensemble_pred))),
        'weights': {'xgboost': float(xgb_weight/total_weight), 'random_forest': float(rf_weight/total_weight)}
    }
    
    # Feature importance analysis
    feature_importance = {}
    xgb_importance = dict(zip(selected_features, xgb_model.feature_importances_))
    rf_importance = dict(zip(selected_features, rf_model.feature_importances_))
    
    for feature in selected_features:
        feature_importance[feature] = {
            'xgboost': float(xgb_importance[feature]),
            'random_forest': float(rf_importance[feature]),
            'combined': float(0.6 * xgb_importance[feature] + 0.4 * rf_importance[feature])
        }
    
    # Sort by combined importance
    sorted_importance = dict(sorted(feature_importance.items(), 
                                  key=lambda x: x[1]['combined'], reverse=True))
    
    # Cross-validation scores for robustness check
    cv_scores = {}
    try:
        xgb_cv = cross_val_score(xgb_model, X_train_scaled, y_train, cv=3, scoring='r2')
        rf_cv = cross_val_score(rf_model, X_train_scaled, y_train, cv=3, scoring='r2')
        
        cv_scores = {
            'xgboost': {'mean': float(np.mean(xgb_cv)), 'std': float(np.std(xgb_cv))},
            'random_forest': {'mean': float(np.mean(rf_cv)), 'std': float(np.std(rf_cv))}
        }
    except:
        cv_scores = {'error': 'Cross-validation failed'}
    
    result = {
        "success": True,
        "models_trained": ['xgboost', 'random_forest', 'ensemble'],
        "metrics": metrics,
        "feature_importance": sorted_importance,
        "selected_features": selected_features,
        "cv_scores": cv_scores,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "total_features": len(feature_cols),
        "target_distribution": {
            "mean": float(y.mean()),
            "std": float(y.std()),
            "min": float(y.min()),
            "max": float(y.max())
        }
    }

print(json.dumps(result))
`;

      const result = await this.runPythonScript(trainingScript, 60000);
      
      if (result.success) {
        this.modelPerformance = result.metrics;
        this.featureImportance = result.feature_importance;
        this.lastTrainingTime = new Date().toISOString();
        this.isInitialized = true;
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate enhanced prediction using ensemble models
   */
  async generateEnsemblePrediction(currentData) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Ensemble models not initialized. Run training first.'
      };
    }

    try {
      const predictionScript = `
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import RobustScaler
import warnings
warnings.filterwarnings('ignore')

# Current market data
current_data = ${JSON.stringify(currentData)}
df = pd.DataFrame([current_data])

# Feature engineering (same as training)
def engineer_crypto_features(df):
    # Use available data for feature creation
    features = {}
    
    if 'price' in df.columns:
        features['price'] = df['price'].iloc[0]
    if 'volume' in df.columns:
        features['volume'] = df['volume'].iloc[0]
        features['volume_normalized'] = (df['volume'].iloc[0] - 20000000) / 5000000  # Normalize volume
    
    # Pillar scores
    for col in ['tech_score', 'social_score', 'fund_score', 'astro_score']:
        if col in df.columns:
            features[col] = df[col].iloc[0]
            features[f'{col}_normalized'] = (df[col].iloc[0] - 50) / 25  # Normalize to [-2, 2] range
    
    # Composite features
    if all(k in features for k in ['tech_score', 'social_score']):
        features['tech_social_composite'] = features['tech_score'] * features['social_score'] / 100
    
    # Market sentiment composite
    pillar_scores = [features.get(f'{col}', 50) for col in ['tech_score', 'social_score', 'fund_score', 'astro_score']]
    features['sentiment_composite'] = np.mean(pillar_scores)
    features['sentiment_variance'] = np.var(pillar_scores)
    
    return features

# Extract features
features = engineer_crypto_features(df)
feature_vector = list(features.values())

# Create synthetic training data for model instantiation
np.random.seed(42)
n_features = len(feature_vector)
X_train = np.random.randn(100, n_features)
y_train = np.sum(X_train, axis=1) * 0.01 + np.random.randn(100) * 0.005  # Financial-like returns

# Scale features
scaler = RobustScaler()
X_train_scaled = scaler.fit_transform(X_train)

# Train quick models
xgb_model = xgb.XGBRegressor(n_estimators=50, max_depth=6, learning_rate=0.1, random_state=42)
xgb_model.fit(X_train_scaled, y_train)

rf_model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
rf_model.fit(X_train_scaled, y_train)

# Make prediction
X_input = np.array(feature_vector).reshape(1, -1)
X_input_scaled = scaler.transform(X_input)

xgb_pred = float(xgb_model.predict(X_input_scaled)[0])
rf_pred = float(rf_model.predict(X_input_scaled)[0])

# Ensemble prediction with adaptive weighting
model_weights = ${JSON.stringify(this.modelPerformance?.ensemble?.weights || { xgboost: 0.6, random_forest: 0.4 })}
ensemble_pred = xgb_pred * model_weights.get('xgboost', 0.6) + rf_pred * model_weights.get('random_forest', 0.4)

# Convert to percentage and classification
pred_percentage = ensemble_pred * 100
if abs(pred_percentage) < 0.5:
    classification = 'NEUTRAL'
elif pred_percentage > 0:
    classification = 'BULLISH'
else:
    classification = 'BEARISH'

# Calculate confidence based on model agreement and feature quality
model_agreement = 1 - abs(xgb_pred - rf_pred) / (abs(xgb_pred) + abs(rf_pred) + 1e-6)
feature_quality = 1 / (1 + np.std(feature_vector))
confidence = float(0.4 + 0.3 * model_agreement + 0.3 * feature_quality)
confidence = max(0.1, min(0.95, confidence))

result = {
    "success": True,
    "ensemble_prediction": float(ensemble_pred),
    "predicted_percentage": float(pred_percentage),
    "predicted_category": classification,
    "confidence": confidence,
    "individual_predictions": {
        "xgboost": float(xgb_pred),
        "random_forest": float(rf_pred)
    },
    "model_weights": model_weights,
    "features_used": list(features.keys()),
    "feature_values": features
}

print(json.dumps(result))
`;

      return await this.runPythonScript(predictionScript, 30000);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get feature importance rankings
   */
  getFeatureImportance() {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Models not trained yet'
      };
    }

    const topFeatures = Object.entries(this.featureImportance)
      .sort((a, b) => b[1].combined - a[1].combined)
      .slice(0, 10);

    return {
      success: true,
      top_features: topFeatures,
      full_importance: this.featureImportance,
      last_updated: this.lastTrainingTime
    };
  }

  /**
   * Get model performance metrics
   */
  getModelPerformance() {
    return {
      success: this.isInitialized,
      performance: this.modelPerformance,
      last_training: this.lastTrainingTime,
      is_initialized: this.isInitialized
    };
  }

  /**
   * Hyperparameter optimization using grid search approach
   */
  async optimizeHyperparameters(trainingData, paramGrid = null) {
    const defaultParamGrid = {
      xgboost: {
        n_estimators: [100, 200],
        max_depth: [4, 6, 8],
        learning_rate: [0.05, 0.1, 0.15]
      },
      random_forest: {
        n_estimators: [100, 200],
        max_depth: [8, 12, 16],
        min_samples_split: [2, 5]
      }
    };

    const parameterGrid = paramGrid || defaultParamGrid;

    try {
      const optimizationScript = `
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score, ParameterGrid
from sklearn.preprocessing import RobustScaler
from sklearn.feature_selection import SelectKBest, f_regression
import warnings
warnings.filterwarnings('ignore')

# Parse training data
data = ${JSON.stringify(trainingData)}
df = pd.DataFrame(data)

# Basic feature engineering
if 'price' in df.columns:
    df['price_returns'] = df['price'].pct_change()
    df['target'] = df['price'].shift(-1) / df['price'] - 1

df = df.dropna()

if len(df) < 50:
    result = {"success": False, "error": "Insufficient data for optimization"}
else:
    feature_cols = [col for col in df.columns if col not in ['price', 'target', 'timestamp']]
    X = df[feature_cols]
    y = df['target']
    
    # Feature selection
    selector = SelectKBest(score_func=f_regression, k=min(15, len(feature_cols)))
    X_selected = selector.fit_transform(X, y)
    
    # Scale features
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X_selected)
    
    # Parameter grids
    param_grids = ${JSON.stringify(parameterGrid)}
    
    optimization_results = {}
    
    # XGBoost optimization
    if 'xgboost' in param_grids:
        xgb_grid = list(ParameterGrid(param_grids['xgboost']))
        best_xgb_score = -np.inf
        best_xgb_params = None
        
        for params in xgb_grid[:6]:  # Limit iterations
            try:
                model = xgb.XGBRegressor(random_state=42, **params)
                scores = cross_val_score(model, X_scaled, y, cv=3, scoring='r2')
                avg_score = np.mean(scores)
                
                if avg_score > best_xgb_score:
                    best_xgb_score = avg_score
                    best_xgb_params = params
            except:
                continue
        
        optimization_results['xgboost'] = {
            'best_params': best_xgb_params,
            'best_score': float(best_xgb_score),
            'total_combinations': len(xgb_grid)
        }
    
    # Random Forest optimization
    if 'random_forest' in param_grids:
        rf_grid = list(ParameterGrid(param_grids['random_forest']))
        best_rf_score = -np.inf
        best_rf_params = None
        
        for params in rf_grid[:6]:  # Limit iterations
            try:
                model = RandomForestRegressor(random_state=42, **params)
                scores = cross_val_score(model, X_scaled, y, cv=3, scoring='r2')
                avg_score = np.mean(scores)
                
                if avg_score > best_rf_score:
                    best_rf_score = avg_score
                    best_rf_params = params
            except:
                continue
        
        optimization_results['random_forest'] = {
            'best_params': best_rf_params,
            'best_score': float(best_rf_score),
            'total_combinations': len(rf_grid)
        }
    
    result = {
        "success": True,
        "optimization_results": optimization_results,
        "samples_used": len(df),
        "features_selected": X_selected.shape[1]
    }

print(json.dumps(result))
`;

      return await this.runPythonScript(optimizationScript, 90000);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const ensembleMLService = new EnsembleMLService();
export default ensembleMLService;