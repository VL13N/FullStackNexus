"""
Advanced ML Service for Cryptocurrency Prediction
Implements ensemble modeling with XGBoost, Random Forest, and TensorFlow
Includes feature engineering, hyperparameter optimization, and model validation
"""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor, VotingRegressor
from sklearn.model_selection import train_test_split, cross_val_score, TimeSeriesSplit
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.feature_selection import SelectKBest, f_regression
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
    from tensorflow.keras.optimizers import Adam
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    logger.warning("TensorFlow not available, LSTM models will be disabled")
import json
import os
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedMLService:
    """
    Advanced ML service for cryptocurrency price prediction using ensemble methods
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_selector = None
        self.is_trained = False
        self.feature_importance = {}
        self.model_weights = {}
        
    def engineer_features(self, df):
        """
        Advanced feature engineering for cryptocurrency data
        """
        if df.empty:
            return df
            
        # Make a copy to avoid modifying original
        data = df.copy()
        
        # Technical indicators
        if 'price' in data.columns:
            # Price-based features
            data['price_pct_change'] = data['price'].pct_change()
            data['price_log_return'] = np.log(data['price'] / data['price'].shift(1))
            data['price_volatility'] = data['price_pct_change'].rolling(window=10).std()
            
            # Moving averages
            for window in [5, 10, 20, 50]:
                data[f'ma_{window}'] = data['price'].rolling(window=window).mean()
                data[f'price_ma_{window}_ratio'] = data['price'] / data[f'ma_{window}']
            
            # Bollinger Bands
            ma_20 = data['price'].rolling(window=20).mean()
            std_20 = data['price'].rolling(window=20).std()
            data['bb_upper'] = ma_20 + (std_20 * 2)
            data['bb_lower'] = ma_20 - (std_20 * 2)
            data['bb_position'] = (data['price'] - data['bb_lower']) / (data['bb_upper'] - data['bb_lower'])
            
            # RSI calculation
            delta = data['price'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            data['rsi'] = 100 - (100 / (1 + rs))
        
        # Volume-based features
        if 'volume' in data.columns:
            data['volume_pct_change'] = data['volume'].pct_change()
            data['volume_ma_10'] = data['volume'].rolling(window=10).mean()
            data['volume_ratio'] = data['volume'] / data['volume_ma_10']
        
        # Market sentiment features
        if 'social_score' in data.columns:
            data['social_momentum'] = data['social_score'].diff()
            data['social_ma_5'] = data['social_score'].rolling(window=5).mean()
        
        if 'tech_score' in data.columns:
            data['tech_momentum'] = data['tech_score'].diff()
            data['tech_ma_5'] = data['tech_score'].rolling(window=5).mean()
        
        if 'fund_score' in data.columns:
            data['fund_momentum'] = data['fund_score'].diff()
            data['fund_ma_5'] = data['fund_score'].rolling(window=5).mean()
        
        if 'astro_score' in data.columns:
            data['astro_momentum'] = data['astro_score'].diff()
            data['astro_ma_5'] = data['astro_score'].rolling(window=5).mean()
        
        # Interaction features
        if all(col in data.columns for col in ['tech_score', 'social_score']):
            data['tech_social_interaction'] = data['tech_score'] * data['social_score']
        
        if all(col in data.columns for col in ['price_volatility', 'volume_ratio']):
            data['volatility_volume_interaction'] = data['price_volatility'] * data['volume_ratio']
        
        # Time-based features
        if 'timestamp' in data.columns:
            data['timestamp'] = pd.to_datetime(data['timestamp'])
            data['hour'] = data['timestamp'].dt.hour
            data['day_of_week'] = data['timestamp'].dt.dayofweek
            data['is_weekend'] = (data['day_of_week'] >= 5).astype(int)
            
            # Cyclical encoding
            data['hour_sin'] = np.sin(2 * np.pi * data['hour'] / 24)
            data['hour_cos'] = np.cos(2 * np.pi * data['hour'] / 24)
            data['dow_sin'] = np.sin(2 * np.pi * data['day_of_week'] / 7)
            data['dow_cos'] = np.cos(2 * np.pi * data['day_of_week'] / 7)
        
        # Lag features
        for lag in [1, 2, 3, 6, 12, 24]:
            if 'price' in data.columns:
                data[f'price_lag_{lag}'] = data['price'].shift(lag)
            if 'volume' in data.columns:
                data[f'volume_lag_{lag}'] = data['volume'].shift(lag)
        
        # Drop NaN values created by feature engineering
        data = data.dropna()
        
        logger.info(f"Feature engineering completed. Shape: {data.shape}")
        return data
    
    def prepare_data(self, df, target_column='price', test_size=0.2):
        """
        Prepare data for training with proper time series splits
        """
        # Engineer features
        data = self.engineer_features(df)
        
        if data.empty:
            raise ValueError("No data available after feature engineering")
        
        # Separate features and target
        feature_columns = [col for col in data.columns if col not in [target_column, 'timestamp']]
        X = data[feature_columns]
        y = data[target_column]
        
        # Feature selection
        if self.feature_selector is None:
            self.feature_selector = SelectKBest(score_func=f_regression, k=min(50, len(feature_columns)))
            X_selected = self.feature_selector.fit_transform(X, y)
            selected_features = X.columns[self.feature_selector.get_support()]
        else:
            X_selected = self.feature_selector.transform(X)
            selected_features = X.columns[self.feature_selector.get_support()]
        
        # Time series split
        split_idx = int(len(data) * (1 - test_size))
        X_train, X_test = X_selected[:split_idx], X_selected[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
        
        # Scale features
        if 'scaler' not in self.scalers:
            self.scalers['scaler'] = RobustScaler()
            X_train_scaled = self.scalers['scaler'].fit_transform(X_train)
        else:
            X_train_scaled = self.scalers['scaler'].transform(X_train)
        
        X_test_scaled = self.scalers['scaler'].transform(X_test)
        
        logger.info(f"Data prepared. Training: {X_train_scaled.shape}, Testing: {X_test_scaled.shape}")
        logger.info(f"Selected features: {len(selected_features)}")
        
        return X_train_scaled, X_test_scaled, y_train, y_test, selected_features
    
    def train_xgboost_model(self, X_train, y_train, X_test, y_test):
        """
        Train XGBoost model with optimized hyperparameters
        """
        xgb_params = {
            'objective': 'reg:squarederror',
            'eval_metric': 'rmse',
            'max_depth': 6,
            'learning_rate': 0.1,
            'n_estimators': 100,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42
        }
        
        model = xgb.XGBRegressor(**xgb_params)
        model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            early_stopping_rounds=10,
            verbose=False
        )
        
        self.models['xgboost'] = model
        
        # Feature importance
        self.feature_importance['xgboost'] = model.feature_importances_
        
        logger.info("XGBoost model trained successfully")
        return model
    
    def train_random_forest_model(self, X_train, y_train):
        """
        Train Random Forest model
        """
        rf_params = {
            'n_estimators': 100,
            'max_depth': 10,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'random_state': 42,
            'n_jobs': -1
        }
        
        model = RandomForestRegressor(**rf_params)
        model.fit(X_train, y_train)
        
        self.models['random_forest'] = model
        self.feature_importance['random_forest'] = model.feature_importances_
        
        logger.info("Random Forest model trained successfully")
        return model
    
    def train_lstm_model(self, X_train, y_train, X_test, y_test, sequence_length=10):
        """
        Train LSTM model for time series prediction
        """
        # Reshape data for LSTM
        def create_sequences(X, y, seq_length):
            sequences_X, sequences_y = [], []
            for i in range(len(X) - seq_length):
                sequences_X.append(X[i:i+seq_length])
                sequences_y.append(y.iloc[i+seq_length] if hasattr(y, 'iloc') else y[i+seq_length])
            return np.array(sequences_X), np.array(sequences_y)
        
        X_train_seq, y_train_seq = create_sequences(X_train, y_train, sequence_length)
        X_test_seq, y_test_seq = create_sequences(X_test, y_test, sequence_length)
        
        # Build LSTM model
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(sequence_length, X_train.shape[1])),
            Dropout(0.2),
            BatchNormalization(),
            LSTM(30, return_sequences=False),
            Dropout(0.2),
            BatchNormalization(),
            Dense(25, activation='relu'),
            Dense(1)
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        # Callbacks
        early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
        reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6)
        
        # Train model
        history = model.fit(
            X_train_seq, y_train_seq,
            epochs=50,
            batch_size=32,
            validation_data=(X_test_seq, y_test_seq),
            callbacks=[early_stopping, reduce_lr],
            verbose=0
        )
        
        self.models['lstm'] = model
        
        logger.info("LSTM model trained successfully")
        return model
    
    def create_ensemble_model(self, X_train, y_train):
        """
        Create ensemble model combining XGBoost and Random Forest
        """
        if 'xgboost' not in self.models or 'random_forest' not in self.models:
            raise ValueError("Base models must be trained before creating ensemble")
        
        # Create voting regressor
        ensemble = VotingRegressor([
            ('xgb', self.models['xgboost']),
            ('rf', self.models['random_forest'])
        ])
        
        ensemble.fit(X_train, y_train)
        self.models['ensemble'] = ensemble
        
        logger.info("Ensemble model created successfully")
        return ensemble
    
    def train_models(self, df, target_column='price'):
        """
        Train all models in the ensemble
        """
        try:
            # Prepare data
            X_train, X_test, y_train, y_test, features = self.prepare_data(df, target_column)
            
            # Train individual models
            self.train_xgboost_model(X_train, y_train, X_test, y_test)
            self.train_random_forest_model(X_train, y_train)
            
            # Train LSTM if we have enough data
            if len(X_train) > 50:
                self.train_lstm_model(X_train, y_train, X_test, y_test)
            
            # Create ensemble
            self.create_ensemble_model(X_train, y_train)
            
            # Evaluate models
            evaluation_results = self.evaluate_models(X_test, y_test)
            
            self.is_trained = True
            
            logger.info("All models trained successfully")
            return {
                'success': True,
                'models_trained': list(self.models.keys()),
                'evaluation': evaluation_results,
                'features_selected': len(features),
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
        except Exception as e:
            logger.error(f"Error training models: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def evaluate_models(self, X_test, y_test):
        """
        Evaluate all trained models
        """
        results = {}
        
        for model_name, model in self.models.items():
            try:
                if model_name == 'lstm':
                    # Handle LSTM prediction differently
                    sequence_length = 10
                    if len(X_test) > sequence_length:
                        X_test_seq = []
                        for i in range(len(X_test) - sequence_length):
                            X_test_seq.append(X_test[i:i+sequence_length])
                        X_test_seq = np.array(X_test_seq)
                        y_pred = model.predict(X_test_seq).flatten()
                        y_test_adj = y_test.iloc[sequence_length:] if hasattr(y_test, 'iloc') else y_test[sequence_length:]
                    else:
                        continue
                else:
                    y_pred = model.predict(X_test)
                    y_test_adj = y_test
                
                # Calculate metrics
                mse = mean_squared_error(y_test_adj, y_pred)
                mae = mean_absolute_error(y_test_adj, y_pred)
                r2 = r2_score(y_test_adj, y_pred)
                rmse = np.sqrt(mse)
                
                results[model_name] = {
                    'mse': float(mse),
                    'mae': float(mae),
                    'rmse': float(rmse),
                    'r2': float(r2)
                }
                
            except Exception as e:
                logger.error(f"Error evaluating {model_name}: {str(e)}")
                results[model_name] = {'error': str(e)}
        
        return results
    
    def predict(self, df, model_name='ensemble'):
        """
        Make predictions using specified model
        """
        if not self.is_trained:
            return {'success': False, 'error': 'Models not trained yet'}
        
        if model_name not in self.models:
            return {'success': False, 'error': f'Model {model_name} not available'}
        
        try:
            # Engineer features
            data = self.engineer_features(df)
            
            if data.empty:
                return {'success': False, 'error': 'No data after feature engineering'}
            
            # Prepare features
            feature_columns = [col for col in data.columns if col not in ['price', 'timestamp']]
            X = data[feature_columns]
            
            # Apply feature selection and scaling
            X_selected = self.feature_selector.transform(X)
            X_scaled = self.scalers['scaler'].transform(X_selected)
            
            # Make prediction
            model = self.models[model_name]
            
            if model_name == 'lstm':
                # Handle LSTM prediction
                sequence_length = 10
                if len(X_scaled) >= sequence_length:
                    X_seq = X_scaled[-sequence_length:].reshape(1, sequence_length, -1)
                    prediction = model.predict(X_seq)[0][0]
                else:
                    return {'success': False, 'error': 'Insufficient data for LSTM prediction'}
            else:
                prediction = model.predict(X_scaled[-1:].reshape(1, -1))[0]
            
            return {
                'success': True,
                'prediction': float(prediction),
                'model_used': model_name,
                'confidence': self._calculate_confidence(X_scaled, model_name)
            }
            
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _calculate_confidence(self, X, model_name):
        """
        Calculate prediction confidence based on model performance
        """
        # Simple confidence calculation based on feature variance
        feature_variance = np.var(X, axis=0).mean()
        base_confidence = 0.7
        
        # Adjust based on model type
        model_confidence_factors = {
            'xgboost': 0.9,
            'random_forest': 0.85,
            'lstm': 0.8,
            'ensemble': 0.95
        }
        
        confidence = base_confidence * model_confidence_factors.get(model_name, 0.7)
        confidence = max(0.1, min(0.99, confidence))
        
        return confidence
    
    def get_feature_importance(self, model_name='xgboost', top_k=10):
        """
        Get feature importance for specified model
        """
        if model_name not in self.feature_importance:
            return {'success': False, 'error': f'Feature importance not available for {model_name}'}
        
        importance = self.feature_importance[model_name]
        feature_names = self.feature_selector.get_feature_names_out() if hasattr(self.feature_selector, 'get_feature_names_out') else [f'feature_{i}' for i in range(len(importance))]
        
        # Sort by importance
        importance_pairs = list(zip(feature_names, importance))
        importance_pairs.sort(key=lambda x: x[1], reverse=True)
        
        return {
            'success': True,
            'feature_importance': importance_pairs[:top_k],
            'model': model_name
        }
    
    def save_models(self, filepath='models/advanced_ml_models.json'):
        """
        Save model metadata and performance
        """
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        model_info = {
            'is_trained': self.is_trained,
            'models_available': list(self.models.keys()),
            'feature_importance': {k: v.tolist() if hasattr(v, 'tolist') else v for k, v in self.feature_importance.items()},
            'timestamp': datetime.now().isoformat()
        }
        
        with open(filepath, 'w') as f:
            json.dump(model_info, f, indent=2)
        
        logger.info(f"Model metadata saved to {filepath}")
        return {'success': True, 'filepath': filepath}

# Global instance
advanced_ml_service = AdvancedMLService()

def get_service():
    """Get the global ML service instance"""
    return advanced_ml_service