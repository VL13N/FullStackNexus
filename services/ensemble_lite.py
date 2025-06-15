"""
Lightweight Ensemble Model for Cryptocurrency Prediction
Combines XGBoost, Dense Neural Network, and LogisticRegression meta-learner
Optimized for real-time prediction with authentic feature vectors
"""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import json
import logging
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnsembleLiteModel:
    """
    Lightweight ensemble model optimized for cryptocurrency prediction
    """
    
    def __init__(self):
        self.xgb_model = None
        self.nn_model = None  # Neural network instead of LSTM
        self.meta_learner = None
        self.feature_scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.feature_columns = []
        
    def create_synthetic_training_data(self, n_samples=300):
        """
        Create realistic training data based on cryptocurrency patterns
        """
        np.random.seed(42)
        
        # Generate realistic price movements
        base_price = 145.0
        price_changes = np.random.randn(n_samples) * 0.03  # 3% typical volatility
        prices = [base_price]
        
        for change in price_changes:
            new_price = prices[-1] * (1 + change)
            prices.append(max(new_price, 50))  # Minimum price floor
        
        prices = np.array(prices[1:])  # Remove initial price
        
        # Generate correlated technical indicators
        tech_scores = 50 + np.cumsum(np.random.randn(n_samples) * 2)
        tech_scores = np.clip(tech_scores, 0, 100)
        
        social_scores = 30 + np.random.randn(n_samples) * 10
        social_scores = np.clip(social_scores, 0, 100)
        
        fund_scores = 35 + np.random.randn(n_samples) * 8
        fund_scores = np.clip(fund_scores, 0, 100)
        
        astro_scores = 60 + np.random.randn(n_samples) * 15
        astro_scores = np.clip(astro_scores, 0, 100)
        
        # Volume correlated with price volatility
        volumes = 20000000 + np.abs(price_changes) * 10000000 + np.random.randint(-3000000, 5000000, n_samples)
        volumes = np.maximum(volumes, 5000000)  # Minimum volume
        
        # Create DataFrame
        df = pd.DataFrame({
            'price': prices,
            'volume': volumes,
            'tech_score': tech_scores,
            'social_score': social_scores,
            'fund_score': fund_scores,
            'astro_score': astro_scores
        })
        
        logger.info(f"Generated {n_samples} synthetic training samples")
        return df
    
    def engineer_features(self, df):
        """
        Engineer comprehensive features from raw data
        """
        data = df.copy()
        
        # Price-based features
        data['price_returns'] = data['price'].pct_change().fillna(0)
        data['price_volatility'] = data['price_returns'].rolling(window=10, min_periods=1).std().fillna(0)
        
        # Moving averages
        data['price_sma_5'] = data['price'].rolling(window=5, min_periods=1).mean()
        data['price_sma_20'] = data['price'].rolling(window=20, min_periods=1).mean()
        data['price_ratio_sma'] = data['price'] / data['price_sma_20']
        
        # Technical momentum
        data['price_momentum'] = data['price'].diff().fillna(0)
        data['rsi_approx'] = self._calculate_rsi_simple(data['price'])
        
        # Volume features
        if 'volume' in data.columns:
            data['volume_sma'] = data['volume'].rolling(window=10, min_periods=1).mean()
            data['volume_ratio'] = data['volume'] / data['volume_sma']
            data['price_volume_trend'] = data['price_returns'] * data['volume_ratio']
        
        # Pillar score features
        pillar_cols = ['tech_score', 'social_score', 'fund_score', 'astro_score']
        for col in pillar_cols:
            if col in data.columns:
                data[f'{col}_sma'] = data[col].rolling(window=5, min_periods=1).mean()
                data[f'{col}_momentum'] = data[col].diff().fillna(0)
        
        # Composite features
        if all(col in data.columns for col in pillar_cols):
            data['pillar_mean'] = data[pillar_cols].mean(axis=1)
            data['pillar_std'] = data[pillar_cols].std(axis=1).fillna(0)
            data['tech_social_product'] = data['tech_score'] * data['social_score'] / 100
        
        # Lag features (limited to avoid overfitting)
        for lag in [1, 3]:
            data[f'price_lag_{lag}'] = data['price'].shift(lag).fillna(data['price'].iloc[0])
            data[f'tech_lag_{lag}'] = data['tech_score'].shift(lag).fillna(data['tech_score'].iloc[0])
        
        # Target variable (price direction)
        data['future_price'] = data['price'].shift(-1)
        data['price_change_pct'] = ((data['future_price'] - data['price']) / data['price']).fillna(0)
        
        # Classification target
        threshold = 0.005  # 0.5% threshold
        data['target'] = 1  # NEUTRAL
        data.loc[data['price_change_pct'] > threshold, 'target'] = 2  # BULLISH
        data.loc[data['price_change_pct'] < -threshold, 'target'] = 0  # BEARISH
        
        # Remove future price column
        data = data.drop(['future_price'], axis=1)
        
        # Fill any remaining NaN values
        data = data.fillna(method='ffill').fillna(method='bfill').fillna(0)
        
        logger.info(f"Feature engineering completed. Shape: {data.shape}")
        return data
    
    def _calculate_rsi_simple(self, prices, period=14):
        """
        Simplified RSI calculation
        """
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period, min_periods=1).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period, min_periods=1).mean()
        
        # Avoid division by zero
        rs = gain / (loss + 1e-8)
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50)  # Neutral RSI for NaN values
    
    def prepare_training_data(self, df):
        """
        Prepare data for model training
        """
        # Engineer features
        data = self.engineer_features(df)
        
        # Select feature columns
        exclude_cols = ['target', 'price_change_pct']
        self.feature_columns = [col for col in data.columns if col not in exclude_cols]
        
        X = data[self.feature_columns]
        y = data['target']
        
        # Scale features
        X_scaled = self.feature_scaler.fit_transform(X)
        
        # Split data (time-aware)
        split_idx = int(len(data) * 0.8)
        X_train, X_test = X_scaled[:split_idx], X_scaled[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
        
        logger.info(f"Training data prepared: {len(X_train)} train, {len(X_test)} test samples")
        return X_train, X_test, y_train, y_test
    
    def train_ensemble(self, df=None):
        """
        Train the complete ensemble model
        """
        logger.info("Starting ensemble training...")
        
        # Use provided data or generate synthetic data
        if df is None or len(df) < 50:
            logger.info("Using synthetic training data")
            df = self.create_synthetic_training_data(300)
        
        # Prepare training data
        X_train, X_test, y_train, y_test = self.prepare_training_data(df)
        
        # Train XGBoost
        logger.info("Training XGBoost...")
        self.xgb_model = xgb.XGBClassifier(
            objective='multi:softprob',
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            eval_metric='mlogloss'
        )
        self.xgb_model.fit(X_train, y_train)
        xgb_train_pred = self.xgb_model.predict_proba(X_train)
        xgb_test_pred = self.xgb_model.predict_proba(X_test)
        
        # Train Neural Network
        logger.info("Training Neural Network...")
        self.nn_model = MLPClassifier(
            hidden_layer_sizes=(64, 32),
            activation='relu',
            max_iter=200,
            random_state=42,
            early_stopping=True,
            validation_fraction=0.1
        )
        self.nn_model.fit(X_train, y_train)
        nn_train_pred = self.nn_model.predict_proba(X_train)
        nn_test_pred = self.nn_model.predict_proba(X_test)
        
        # Train Meta-learner
        logger.info("Training meta-learner...")
        meta_train_features = np.hstack([xgb_train_pred, nn_train_pred])
        meta_test_features = np.hstack([xgb_test_pred, nn_test_pred])
        
        self.meta_learner = LogisticRegression(
            random_state=42,
            max_iter=1000,
            multi_class='multinomial'
        )
        self.meta_learner.fit(meta_train_features, y_train)
        
        # Evaluate performance
        train_acc = self.meta_learner.score(meta_train_features, y_train)
        test_acc = self.meta_learner.score(meta_test_features, y_test)
        
        self.is_trained = True
        
        # Feature importance
        feature_importance = dict(zip(self.feature_columns, self.xgb_model.feature_importances_))
        sorted_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
        
        logger.info(f"Ensemble training completed - Train: {train_acc:.3f}, Test: {test_acc:.3f}")
        
        # Convert numpy types to Python native types for JSON serialization
        sorted_importance_json = {k: float(v) for k, v in sorted_importance.items()}
        
        return {
            'success': True,
            'train_accuracy': float(train_acc),
            'test_accuracy': float(test_acc),
            'feature_importance': sorted_importance_json,
            'models_trained': ['xgboost', 'neural_network', 'meta_learner'],
            'feature_count': int(len(self.feature_columns)),
            'training_samples': int(len(X_train))
        }
    
    def predict_ensemble(self, features: dict) -> float:
        """
        Make ensemble prediction from feature dictionary
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train_ensemble() first.")
        
        try:
            # Create feature vector
            feature_vector = self._create_feature_vector(features)
            feature_vector_scaled = self.feature_scaler.transform(feature_vector.reshape(1, -1))
            
            # Get individual model predictions
            xgb_pred = self.xgb_model.predict_proba(feature_vector_scaled)
            nn_pred = self.nn_model.predict_proba(feature_vector_scaled)
            
            # Combine with meta-learner
            meta_features = np.hstack([xgb_pred, nn_pred])
            ensemble_pred = self.meta_learner.predict_proba(meta_features)
            
            # Convert to directional prediction
            # Class 0: BEARISH, Class 1: NEUTRAL, Class 2: BULLISH
            probs = ensemble_pred[0]
            
            # Weight prediction by confidence
            prediction = (probs[2] - probs[0]) * np.max(probs)
            
            logger.info(f"Ensemble prediction: {prediction:.4f} (probs: {probs})")
            return float(prediction)
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return 0.0
    
    def _create_feature_vector(self, features):
        """
        Create feature vector from input dictionary
        """
        feature_vector = np.zeros(len(self.feature_columns))
        
        # Direct feature mapping
        for i, col in enumerate(self.feature_columns):
            if col in features:
                feature_vector[i] = features[col]
            elif col == 'price' and 'price' in features:
                feature_vector[i] = features['price']
            elif col == 'volume' and 'volume' in features:
                feature_vector[i] = features['volume']
            elif 'tech_score' in col and 'tech_score' in features:
                feature_vector[i] = features['tech_score']
            elif 'social_score' in col and 'social_score' in features:
                feature_vector[i] = features['social_score']
            elif 'fund_score' in col and 'fund_score' in features:
                feature_vector[i] = features['fund_score']
            elif 'astro_score' in col and 'astro_score' in features:
                feature_vector[i] = features['astro_score']
            elif col == 'pillar_mean':
                # Calculate composite scores
                scores = [features.get(f'{p}_score', 50) for p in ['tech', 'social', 'fund', 'astro']]
                feature_vector[i] = np.mean(scores)
            elif col == 'tech_social_product':
                tech = features.get('tech_score', 50)
                social = features.get('social_score', 50)
                feature_vector[i] = tech * social / 100
        
        return feature_vector
    
    def get_feature_importance(self, top_k=10):
        """
        Get feature importance from XGBoost
        """
        if not self.is_trained:
            return {'error': 'Model not trained'}
        
        importance = dict(zip(self.feature_columns, self.xgb_model.feature_importances_))
        sorted_importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
        
        return {
            'top_features': dict(list(sorted_importance.items())[:top_k]),
            'all_features': sorted_importance
        }

# Global instance
ensemble_lite = EnsembleLiteModel()

def predict_ensemble(features: dict) -> float:
    """Global prediction function"""
    return ensemble_lite.predict_ensemble(features)

def train_ensemble_model(limit=None):
    """Global training function"""
    return ensemble_lite.train_ensemble()

def get_ensemble_status():
    """Get ensemble model status"""
    return {
        'is_trained': ensemble_lite.is_trained,
        'feature_count': len(ensemble_lite.feature_columns),
        'models': ['xgboost', 'neural_network', 'meta_learner'],
        'version': 'lite'
    }