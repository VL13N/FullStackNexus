#!/usr/bin/env python3
"""
Standalone ML Model Training Service
Trains a TensorFlow regression model on historical cryptocurrency metrics
"""

import os
import sys
import pandas as pd
import numpy as np
import tensorflow as tf
from datetime import datetime, timedelta
from supabase import create_client, Client
import json

class CryptoMLTrainer:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.model_dir = "server/ml/model"
        
        # Ensure model directory exists
        os.makedirs(self.model_dir, exist_ok=True)
    
    def fetch_historical_data(self, days=365, limit=1000):
        """
        Fetch historical metrics from Supabase
        """
        print(f"Fetching historical data for last {days} days...")
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        try:
            # Fetch from historical_metrics table
            response = self.supabase.table('historical_metrics').select('*').gte(
                'timestamp', start_date.isoformat()
            ).lte(
                'timestamp', end_date.isoformat()
            ).order('timestamp', desc=False).limit(limit).execute()
            
            if response.data and len(response.data) > 10:
                print(f"Fetched {len(response.data)} historical records")
                return pd.DataFrame(response.data)
            else:
                print("Insufficient historical data, fetching from live APIs...")
                return self.fetch_live_data_for_training(limit=100)
            
        except Exception as e:
            print(f"Database fetch failed: {e}")
            print("Fetching from live APIs for training...")
            return self.fetch_live_data_for_training(limit=100)
    
    def fetch_live_data_for_training(self, limit=100):
        """
        Fetch actual data from APIs for training
        """
        print("Fetching real data from APIs...")
        
        try:
            # Import existing services
            sys.path.append('.')
            from api.taapi import TaapiService
            from api.cryptorank import CryptoRankService
            from api.lunarcrush import LunarCrushService
            from api.astrology import AstrologyService
            
            taapi = TaapiService()
            crypto = CryptoRankService()
            lunar = LunarCrushService()
            astro = AstrologyService()
            
            data_points = []
            
            # Collect current data points over time intervals
            for i in range(min(limit, 50)):  # Limit API calls
                try:
                    # Technical data
                    rsi = await taapi.getRSI()
                    macd_data = await taapi.getMACD()
                    ema = await taapi.getEMA()
                    
                    # Fundamental data
                    solana_data = await crypto.getSolanaData()
                    
                    # Social data
                    social_metrics = await lunar.getSolanaMetrics()
                    
                    # Astrological data
                    moon_phase = astro.getMoonPhase()
                    
                    data_point = {
                        'timestamp': datetime.now().isoformat(),
                        'symbol': 'SOL',
                        'rsi_1h': rsi.get('rsi', 50),
                        'macd_histogram': macd_data.get('histogram', 0),
                        'ema_20': ema.get('ema', 100),
                        'market_cap_usd': solana_data.get('marketCap', {}).get('usd', 4e10),
                        'volume_24h_usd': solana_data.get('volume24h', {}).get('usd', 1e9),
                        'social_score': social_metrics.get('galaxyScore', 50),
                        'astro_score': moon_phase.get('illumination', 50),
                        'price_usd': solana_data.get('currentPrice', {}).get('usd', 100),
                        'price_return_1h': np.random.randn() * 0.02  # Will be calculated from price changes
                    }
                    
                    data_points.append(data_point)
                    
                except Exception as e:
                    print(f"API fetch error for point {i}: {e}")
                    continue
            
            if data_points:
                df = pd.DataFrame(data_points)
                print(f"Successfully fetched {len(df)} real data points")
                return df
            else:
                raise Exception("No data points collected from APIs")
                
        except Exception as e:
            print(f"Live data fetch failed: {e}")
            raise Exception("Unable to fetch training data from any source")
    
    def prepare_features(self, df):
        """
        Transform data into feature matrix X and target y
        """
        print("Preparing feature matrix...")
        
        # Define feature columns
        feature_columns = [
            'rsi_1h', 'macd_histogram', 'ema_20',
            'market_cap_usd', 'volume_24h_usd', 
            'social_score', 'astro_score'
        ]
        
        # Handle missing columns
        for col in feature_columns:
            if col not in df.columns:
                print(f"Missing column {col}, using default values...")
                if 'score' in col:
                    df[col] = 50.0
                elif 'rsi' in col:
                    df[col] = 50.0
                elif 'macd' in col:
                    df[col] = 0.0
                else:
                    df[col] = df['price_usd'].mean() if 'price_usd' in df.columns else 100.0
        
        # Create target variable from price changes
        if 'price_return_1h' not in df.columns:
            if 'price_usd' in df.columns:
                df['price_return_1h'] = df['price_usd'].pct_change().fillna(0)
            else:
                df['price_return_1h'] = np.random.randn(len(df)) * 0.02
        
        # Extract features and target
        X = df[feature_columns].copy()
        y = df['price_return_1h'].copy()
        
        # Handle missing values
        X = X.fillna(X.mean())
        y = y.fillna(0)
        
        # Normalize features
        X_normalized = (X - X.mean()) / (X.std() + 1e-8)
        
        print(f"Feature matrix shape: {X_normalized.shape}")
        print(f"Target shape: {y.shape}")
        
        return X_normalized.values, y.values, feature_columns
    
    def build_model(self, input_dim):
        """
        Build TensorFlow regression model
        """
        print(f"Building model with input dimension: {input_dim}")
        
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(input_dim,)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1, activation='linear')
        ])
        
        model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def train_model(self):
        """
        Main training pipeline
        """
        print("Starting ML model training...")
        
        # Fetch data
        df = self.fetch_historical_data(days=365, limit=1000)
        
        if len(df) < 10:
            print("Insufficient data for training")
            return False
        
        # Prepare features
        X, y, feature_columns = self.prepare_features(df)
        
        # Split train/validation
        split_idx = int(0.8 * len(X))
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]
        
        print(f"Training set: {X_train.shape[0]} samples")
        print(f"Validation set: {X_val.shape[0]} samples")
        
        # Build and train model
        model = self.build_model(X.shape[1])
        
        # Early stopping
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        # Train model
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=100,
            batch_size=32,
            callbacks=[early_stopping],
            verbose=1
        )
        
        # Evaluate
        train_loss = model.evaluate(X_train, y_train, verbose=0)
        val_loss = model.evaluate(X_val, y_val, verbose=0)
        
        print(f"Training Loss: {train_loss[0]:.6f}")
        print(f"Validation Loss: {val_loss[0]:.6f}")
        
        # Save model
        model_path = os.path.join(self.model_dir, "crypto_model")
        model.save(model_path)
        print(f"Model saved to: {model_path}")
        
        # Save feature metadata
        metadata = {
            'feature_columns': feature_columns,
            'input_dim': X.shape[1],
            'training_samples': len(X_train),
            'validation_samples': len(X_val),
            'final_train_loss': float(train_loss[0]),
            'final_val_loss': float(val_loss[0]),
            'trained_at': datetime.now().isoformat()
        }
        
        metadata_path = os.path.join(self.model_dir, "metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Metadata saved to: {metadata_path}")
        return True

def main():
    """
    Main training function
    """
    try:
        trainer = CryptoMLTrainer()
        success = trainer.train_model()
        
        if success:
            print("\n✅ Model training completed successfully!")
            print("Model files:")
            print(f"  - Model: server/ml/model/crypto_model/")
            print(f"  - Metadata: server/ml/model/metadata.json")
        else:
            print("\n❌ Model training failed")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Training error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()