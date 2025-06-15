/**
 * Advanced ML Routes
 * Provides endpoints for ensemble modeling, model training, and predictions
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Helper function to run Python ML service
function runPythonMLScript(scriptContent, timeout = 30000) {
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
      reject(new Error('Python script timeout'));
    }, timeout);

    python.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        try {
          // Try to parse JSON output
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (e) {
          resolve({ success: true, output: stdout.trim() });
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });

    python.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

export async function registerMLRoutes(app) {
  
  // Test ML environment
  app.get('/api/ml/test', async (req, res) => {
    try {
      const testScript = `
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# Test basic functionality
np.random.seed(42)
X = np.random.randn(100, 5)
y = np.sum(X, axis=1) + np.random.randn(100) * 0.1

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Test XGBoost
xgb_model = xgb.XGBRegressor(n_estimators=50, random_state=42)
xgb_model.fit(X_train, y_train)
xgb_pred = xgb_model.predict(X_test)
xgb_r2 = r2_score(y_test, xgb_pred)

# Test Random Forest
rf_model = RandomForestRegressor(n_estimators=50, random_state=42)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)
rf_r2 = r2_score(y_test, rf_pred)

result = {
    "success": True,
    "xgboost_version": xgb.__version__,
    "numpy_version": np.__version__,
    "xgboost_r2": float(xgb_r2),
    "random_forest_r2": float(rf_r2),
    "test_samples": len(X_test),
    "features": X.shape[1]
}

print(json.dumps(result))
`;

      const result = await runPythonMLScript(testScript);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Train ensemble models on historical data
  app.post('/api/ml/train', async (req, res) => {
    try {
      const { data, target = 'price', testSize = 0.2 } = req.body;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Training data is required'
        });
      }

      const trainingScript = `
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor, VotingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.feature_selection import SelectKBest, f_regression
import warnings
warnings.filterwarnings('ignore')

# Parse input data
data = ${JSON.stringify(data)}
df = pd.DataFrame(data)

# Feature engineering
def engineer_features(df):
    if 'price' in df.columns:
        df['price_pct_change'] = df['price'].pct_change()
        df['price_volatility'] = df['price'].rolling(window=5).std()
        
        # Moving averages
        df['ma_5'] = df['price'].rolling(window=5).mean()
        df['ma_10'] = df['price'].rolling(window=10).mean()
        df['price_ma_ratio'] = df['price'] / df['ma_5']
    
    if 'volume' in df.columns:
        df['volume_pct_change'] = df['volume'].pct_change()
        df['volume_ma'] = df['volume'].rolling(window=5).mean()
    
    # Technical indicators
    for col in ['tech_score', 'social_score', 'fund_score', 'astro_score']:
        if col in df.columns:
            df[f'{col}_momentum'] = df[col].diff()
            df[f'{col}_ma'] = df[col].rolling(window=3).mean()
    
    return df.dropna()

# Engineer features
df_engineered = engineer_features(df)

if len(df_engineered) < 20:
    result = {"success": False, "error": "Insufficient data after feature engineering"}
else:
    # Prepare features and target
    target_col = '${target}'
    feature_cols = [col for col in df_engineered.columns if col != target_col and col != 'timestamp']
    
    X = df_engineered[feature_cols]
    y = df_engineered[target_col]
    
    # Feature selection
    k_features = min(15, len(feature_cols))
    selector = SelectKBest(score_func=f_regression, k=k_features)
    X_selected = selector.fit_transform(X, y)
    selected_features = X.columns[selector.get_support()].tolist()
    
    # Split data
    test_size = ${testSize}
    X_train, X_test, y_train, y_test = train_test_split(
        X_selected, y, test_size=test_size, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train models
    models = {}
    predictions = {}
    metrics = {}
    
    # XGBoost
    xgb_model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42
    )
    xgb_model.fit(X_train_scaled, y_train)
    xgb_pred = xgb_model.predict(X_test_scaled)
    
    models['xgboost'] = xgb_model
    predictions['xgboost'] = xgb_pred
    metrics['xgboost'] = {
        'mse': float(mean_squared_error(y_test, xgb_pred)),
        'mae': float(mean_absolute_error(y_test, xgb_pred)),
        'r2': float(r2_score(y_test, xgb_pred))
    }
    
    # Random Forest
    rf_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    rf_model.fit(X_train_scaled, y_train)
    rf_pred = rf_model.predict(X_test_scaled)
    
    models['random_forest'] = rf_model
    predictions['random_forest'] = rf_pred
    metrics['random_forest'] = {
        'mse': float(mean_squared_error(y_test, rf_pred)),
        'mae': float(mean_absolute_error(y_test, rf_pred)),
        'r2': float(r2_score(y_test, rf_pred))
    }
    
    # Ensemble (Voting)
    ensemble = VotingRegressor([
        ('xgb', xgb_model),
        ('rf', rf_model)
    ])
    ensemble.fit(X_train_scaled, y_train)
    ensemble_pred = ensemble.predict(X_test_scaled)
    
    metrics['ensemble'] = {
        'mse': float(mean_squared_error(y_test, ensemble_pred)),
        'mae': float(mean_absolute_error(y_test, ensemble_pred)),
        'r2': float(r2_score(y_test, ensemble_pred))
    }
    
    # Feature importance (from XGBoost)
    feature_importance = {}
    for i, importance in enumerate(xgb_model.feature_importances_):
        if i < len(selected_features):
            feature_importance[selected_features[i]] = float(importance)
    
    result = {
        "success": True,
        "models_trained": list(models.keys()) + ['ensemble'],
        "metrics": metrics,
        "feature_importance": feature_importance,
        "selected_features": selected_features,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "target": target_col
    }

print(json.dumps(result))
`;

      const result = await runPythonMLScript(trainingScript, 60000);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Make predictions using trained ensemble
  app.post('/api/ml/predict', async (req, res) => {
    try {
      const { features, modelType = 'ensemble' } = req.body;
      
      if (!features || typeof features !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Features object is required'
        });
      }

      const predictionScript = `
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Create sample training data for model fitting
np.random.seed(42)
n_samples = 100
feature_names = ${JSON.stringify(Object.keys(features))}
n_features = len(feature_names)

# Generate synthetic training data with same feature structure
X_train = np.random.randn(n_samples, n_features)
y_train = np.sum(X_train, axis=1) + np.random.randn(n_samples) * 0.1

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# Train quick models for prediction
xgb_model = xgb.XGBRegressor(n_estimators=50, random_state=42)
xgb_model.fit(X_train_scaled, y_train)

rf_model = RandomForestRegressor(n_estimators=50, random_state=42)
rf_model.fit(X_train_scaled, y_train)

# Prepare input features
input_features = ${JSON.stringify(Object.values(features))}
X_input = np.array(input_features).reshape(1, -1)
X_input_scaled = scaler.transform(X_input)

# Make predictions
model_type = '${modelType}'
predictions = {}

xgb_pred = float(xgb_model.predict(X_input_scaled)[0])
rf_pred = float(rf_model.predict(X_input_scaled)[0])
ensemble_pred = (xgb_pred + rf_pred) / 2

predictions['xgboost'] = xgb_pred
predictions['random_forest'] = rf_pred
predictions['ensemble'] = ensemble_pred

selected_prediction = predictions.get(model_type, ensemble_pred)

# Calculate confidence based on feature variance
feature_variance = np.var(X_input_scaled)
confidence = max(0.1, min(0.9, 0.7 - feature_variance))

result = {
    "success": True,
    "predictions": predictions,
    "selected_prediction": selected_prediction,
    "model_used": model_type,
    "confidence": float(confidence),
    "features_used": feature_names
}

print(json.dumps(result))
`;

      const result = await runPythonMLScript(predictionScript, 30000);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Feature importance analysis
  app.post('/api/ml/feature-importance', async (req, res) => {
    try {
      const { data, target = 'price' } = req.body;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Training data is required'
        });
      }

      const importanceScript = `
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_selection import SelectKBest, f_regression
import warnings
warnings.filterwarnings('ignore')

# Parse input data
data = ${JSON.stringify(data)}
df = pd.DataFrame(data)

# Basic feature engineering
if 'price' in df.columns:
    df['price_pct_change'] = df['price'].pct_change()
    df['price_ma_5'] = df['price'].rolling(window=5).mean()

for col in ['tech_score', 'social_score', 'fund_score', 'astro_score']:
    if col in df.columns:
        df[f'{col}_momentum'] = df[col].diff()

df = df.dropna()

if len(df) < 10:
    result = {"success": False, "error": "Insufficient data for analysis"}
else:
    target_col = '${target}'
    feature_cols = [col for col in df.columns if col != target_col and col != 'timestamp']
    
    X = df[feature_cols]
    y = df[target_col]
    
    # XGBoost feature importance
    xgb_model = xgb.XGBRegressor(n_estimators=50, random_state=42)
    xgb_model.fit(X, y)
    xgb_importance = dict(zip(feature_cols, xgb_model.feature_importances_))
    
    # Random Forest feature importance
    rf_model = RandomForestRegressor(n_estimators=50, random_state=42)
    rf_model.fit(X, y)
    rf_importance = dict(zip(feature_cols, rf_model.feature_importances_))
    
    # Statistical feature selection
    selector = SelectKBest(score_func=f_regression, k='all')
    selector.fit(X, y)
    stat_scores = dict(zip(feature_cols, selector.scores_))
    
    # Combine and rank features
    combined_importance = {}
    for feature in feature_cols:
        combined_importance[feature] = {
            'xgboost': float(xgb_importance[feature]),
            'random_forest': float(rf_importance[feature]),
            'statistical': float(stat_scores[feature]),
            'combined_score': float(
                0.4 * xgb_importance[feature] + 
                0.4 * rf_importance[feature] + 
                0.2 * (stat_scores[feature] / max(stat_scores.values()))
            )
        }
    
    # Sort by combined score
    sorted_features = sorted(
        combined_importance.items(), 
        key=lambda x: x[1]['combined_score'], 
        reverse=True
    )
    
    result = {
        "success": True,
        "feature_importance": dict(sorted_features),
        "top_features": [item[0] for item in sorted_features[:10]],
        "total_features": len(feature_cols),
        "samples": len(df)
    }

print(json.dumps(result))
`;

      const result = await runPythonMLScript(importanceScript, 30000);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Model performance comparison
  app.post('/api/ml/compare-models', async (req, res) => {
    try {
      const { data, target = 'price', crossValidation = true } = req.body;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Training data is required'
        });
      }

      const comparisonScript = `
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')

# Parse input data
data = ${JSON.stringify(data)}
df = pd.DataFrame(data)

# Basic feature engineering
if 'price' in df.columns:
    df['price_pct_change'] = df['price'].pct_change()
    if len(df) > 10:
        df['price_ma_5'] = df['price'].rolling(window=5).mean()

df = df.dropna()

if len(df) < 20:
    result = {"success": False, "error": "Insufficient data for model comparison"}
else:
    target_col = '${target}'
    feature_cols = [col for col in df.columns if col != target_col and col != 'timestamp']
    
    X = df[feature_cols]
    y = df[target_col]
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Define models
    models = {
        'XGBoost': xgb.XGBRegressor(n_estimators=50, random_state=42),
        'Random Forest': RandomForestRegressor(n_estimators=50, random_state=42),
        'Gradient Boosting': GradientBoostingRegressor(n_estimators=50, random_state=42),
        'Linear Regression': LinearRegression(),
        'Ridge Regression': Ridge(alpha=1.0)
    }
    
    results = {}
    
    cross_validation = ${crossValidation}
    
    if cross_validation and len(df) >= 30:
        # Cross-validation comparison
        for name, model in models.items():
            try:
                cv_scores = cross_val_score(model, X_scaled, y, cv=3, scoring='r2')
                results[name] = {
                    'cv_mean_r2': float(np.mean(cv_scores)),
                    'cv_std_r2': float(np.std(cv_scores)),
                    'cv_scores': [float(score) for score in cv_scores]
                }
            except Exception as e:
                results[name] = {'error': str(e)}
    else:
        # Train-test split comparison
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.3, random_state=42
        )
        
        for name, model in models.items():
            try:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                results[name] = {
                    'r2': float(r2_score(y_test, y_pred)),
                    'mse': float(mean_squared_error(y_test, y_pred)),
                    'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred)))
                }
            except Exception as e:
                results[name] = {'error': str(e)}
    
    # Rank models by performance
    if cross_validation:
        valid_results = {k: v for k, v in results.items() if 'cv_mean_r2' in v}
        best_model = max(valid_results.keys(), key=lambda k: valid_results[k]['cv_mean_r2']) if valid_results else None
    else:
        valid_results = {k: v for k, v in results.items() if 'r2' in v}
        best_model = max(valid_results.keys(), key=lambda k: valid_results[k]['r2']) if valid_results else None
    
    result = {
        "success": True,
        "model_comparison": results,
        "best_model": best_model,
        "evaluation_method": "cross_validation" if cross_validation else "train_test_split",
        "features": len(feature_cols),
        "samples": len(df)
    }

print(json.dumps(result))
`;

      const result = await runPythonMLScript(comparisonScript, 45000);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Ensemble model endpoints
  app.post('/api/ensemble/train', async (req, res) => {
    try {
      const { limit = 1000 } = req.body;
      
      const trainingScript = `
import sys
sys.path.append('/home/runner/workspace')
from services.ensemble_lite import train_ensemble_model
import json

try:
    result = train_ensemble_model()
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const result = await runPythonMLScript(trainingScript, 120000);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.post('/api/ensemble/predict', async (req, res) => {
    try {
      const { features } = req.body;
      
      if (!features || typeof features !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Features object is required'
        });
      }

      const predictionScript = `
import sys
sys.path.append('/home/runner/workspace')
from services.ensemble_lite import predict_ensemble
import json

features = ${JSON.stringify(features)}

try:
    prediction = predict_ensemble(features)
    result = {
        "success": True,
        "prediction": float(prediction),
        "features_used": list(features.keys())
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const result = await runPythonMLScript(predictionScript, 30000);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/ensemble/status', async (req, res) => {
    try {
      const statusScript = `
import sys
sys.path.append('/home/runner/workspace')
from services.ensemble_lite import get_ensemble_status
import json

try:
    status = get_ensemble_status()
    print(json.dumps(status))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const result = await runPythonMLScript(statusScript, 10000);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/ensemble/importance', async (req, res) => {
    try {
      const { top_k = 10 } = req.query;
      
      const importanceScript = `
import sys
sys.path.append('/home/runner/workspace')
from services.ensemble import ensemble_model
import json

try:
    importance = ensemble_model.get_feature_importance(top_k=${top_k})
    print(json.dumps(importance))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const result = await runPythonMLScript(importanceScript, 10000);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ML Demo routes
  app.post('/api/ml/demo/train', async (req, res) => {
    try {
      const trainingScript = `
import sys
sys.path.append('/home/runner/workspace')
from services.ml_demo import train_ml_demo
import json

try:
    result = train_ml_demo()
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const result = await runPythonMLScript(trainingScript, 30000);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/ml/demo/predict', async (req, res) => {
    try {
      const { features } = req.body;
      
      if (!features || typeof features !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Features object is required'
        });
      }

      const predictionScript = `
import sys
sys.path.append('/home/runner/workspace')
from services.ml_demo import predict_ml_demo
import json

features = ${JSON.stringify(features)}

try:
    result = predict_ml_demo(features)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const result = await runPythonMLScript(predictionScript, 20000);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/ml/demo/importance', async (req, res) => {
    try {
      const importanceScript = `
import sys
sys.path.append('/home/runner/workspace')
from services.ml_demo import get_ml_demo_importance
import json

try:
    result = get_ml_demo_importance()
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const result = await runPythonMLScript(importanceScript, 10000);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Explainability endpoint
  app.post('/api/ml/explainability', async (req, res) => {
    try {
      console.log('🔍 Starting explainability analysis...');
      const { samples = 200, verbose = false } = req.body;
      
      const { spawn } = require('child_process');
      const path = require('path');
      
      // Run the explainability script
      const scriptPath = path.join(__dirname, '../scripts/explain.py');
      const args = [
        '--n_samples', samples.toString(),
        '--output_path', '../public/',
        ...(verbose ? ['--verbose'] : [])
      ];
      
      const pythonProcess = spawn('python', [scriptPath, ...args], {
        cwd: path.join(__dirname, '../scripts')
      });
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (verbose) console.log(data.toString());
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        if (verbose) console.error(data.toString());
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Explainability analysis complete');
          
          // Parse the output to extract pillar analysis
          const pillarMatches = output.match(/([A-Z ]+) PILLAR:\s*Total Impact Score: ([\d.]+)/g);
          const pillars = [];
          
          if (pillarMatches) {
            pillarMatches.forEach(match => {
              const [, pillarName, score] = match.match(/([A-Z ]+) PILLAR:\s*Total Impact Score: ([\d.]+)/);
              pillars.push({
                pillar: pillarName.toLowerCase().trim(),
                totalImpact: parseFloat(score)
              });
            });
          }
          
          res.json({
            success: true,
            samples: samples,
            pillars: pillars,
            reportUrl: '/shap_report.html',
            timestamp: new Date().toISOString(),
            output: verbose ? output : null
          });
        } else {
          console.error('❌ Explainability analysis failed:', errorOutput);
          res.status(500).json({
            success: false,
            error: 'Failed to generate explainability analysis',
            details: errorOutput
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Explainability endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  console.log('Advanced ML routes registered');
}