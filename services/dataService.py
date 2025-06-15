"""
Data Service for Supabase Feature Vector Management
Handles pulling historical features, predictions, and market data for model retraining
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("Supabase client not available - using fallback data")

class DataService:
    def __init__(self):
        self.supabase = None
        self.initialize_supabase()
    
    def initialize_supabase(self):
        """Initialize Supabase client if credentials are available"""
        if not SUPABASE_AVAILABLE:
            return
            
        try:
            url = os.environ.get('SUPABASE_URL')
            key = os.environ.get('SUPABASE_ANON_KEY')
            
            if url and key:
                self.supabase = create_client(url, key)
                print("✅ Supabase connection initialized")
            else:
                print("⚠️ Supabase credentials not found")
        except Exception as e:
            print(f"❌ Failed to initialize Supabase: {e}")
    
    def pull_supabase_features(self, days_back: int = 30) -> Dict:
        """
        Pull feature vectors from Supabase for the last N days
        Returns structured data for model retraining
        """
        try:
            if not self.supabase:
                return self._get_fallback_features(days_back)
            
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            print(f"📊 Pulling features from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
            
            # Pull prediction history with features
            predictions_response = self.supabase.table('predictions') \
                .select('*') \
                .gte('timestamp', start_date.isoformat()) \
                .lte('timestamp', end_date.isoformat()) \
                .order('timestamp', desc=False) \
                .execute()
            
            if not predictions_response.data:
                print("⚠️ No prediction data found, using fallback")
                return self._get_fallback_features(days_back)
            
            # Pull market data
            market_response = self.supabase.table('market_data') \
                .select('*') \
                .gte('timestamp', start_date.isoformat()) \
                .lte('timestamp', end_date.isoformat()) \
                .order('timestamp', desc=False) \
                .execute()
            
            # Pull technical indicators
            technical_response = self.supabase.table('technical_indicators') \
                .select('*') \
                .gte('timestamp', start_date.isoformat()) \
                .lte('timestamp', end_date.isoformat()) \
                .order('timestamp', desc=False) \
                .execute()
            
            # Combine and structure data
            structured_data = self._combine_feature_data(
                predictions_response.data,
                market_response.data if market_response.data else [],
                technical_response.data if technical_response.data else []
            )
            
            return {
                'success': True,
                'data': structured_data,
                'rows_fetched': len(structured_data),
                'date_range': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                'source': 'supabase'
            }
            
        except Exception as e:
            print(f"❌ Error pulling Supabase features: {e}")
            return self._get_fallback_features(days_back)
    
    def _combine_feature_data(self, predictions: List, market_data: List, technical_data: List) -> List[Dict]:
        """Combine different data sources into unified feature vectors"""
        combined_data = []
        
        # Convert to DataFrames for easier manipulation
        pred_df = pd.DataFrame(predictions) if predictions else pd.DataFrame()
        market_df = pd.DataFrame(market_data) if market_data else pd.DataFrame()
        tech_df = pd.DataFrame(technical_data) if technical_data else pd.DataFrame()
        
        if pred_df.empty:
            return []
        
        # Ensure timestamp columns are datetime
        for df in [pred_df, market_df, tech_df]:
            if not df.empty and 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Merge data on timestamp (nearest match within 1 hour)
        for _, pred_row in pred_df.iterrows():
            timestamp = pred_row['timestamp']
            
            # Find closest market data
            market_row = None
            if not market_df.empty:
                time_diff = abs(market_df['timestamp'] - timestamp)
                closest_idx = time_diff.idxmin()
                if time_diff[closest_idx] <= pd.Timedelta(hours=1):
                    market_row = market_df.loc[closest_idx]
            
            # Find closest technical data
            tech_row = None
            if not tech_df.empty:
                time_diff = abs(tech_df['timestamp'] - timestamp)
                closest_idx = time_diff.idxmin()
                if time_diff[closest_idx] <= pd.Timedelta(hours=1):
                    tech_row = tech_df.loc[closest_idx]
            
            # Create combined feature vector
            feature_vector = {
                'timestamp': timestamp.isoformat(),
                'prediction': pred_row.get('prediction', 0),
                'confidence': pred_row.get('confidence', 0.5),
                'actual_outcome': pred_row.get('actual_outcome'),  # May be null for recent data
                
                # Market features
                'price': market_row.get('price') if market_row is not None else pred_row.get('price', 150.0),
                'volume': market_row.get('volume') if market_row is not None else pred_row.get('volume', 20000000),
                'market_cap': market_row.get('market_cap') if market_row is not None else pred_row.get('market_cap', 70000000000),
                'high': market_row.get('high') if market_row is not None else pred_row.get('high', 155.0),
                'low': market_row.get('low') if market_row is not None else pred_row.get('low', 145.0),
                
                # Technical features
                'rsi': tech_row.get('rsi') if tech_row is not None else pred_row.get('rsi', 60.0),
                'macd': tech_row.get('macd') if tech_row is not None else pred_row.get('macd', 0.5),
                'ema': tech_row.get('ema') if tech_row is not None else pred_row.get('ema', 150.0),
                'sma': tech_row.get('sma') if tech_row is not None else pred_row.get('sma', 148.0),
                'atr': tech_row.get('atr') if tech_row is not None else pred_row.get('atr', 2.0),
                
                # Pillar scores
                'tech_score': pred_row.get('tech_score', 35.0),
                'social_score': pred_row.get('social_score', 32.0),
                'fund_score': pred_row.get('fund_score', 33.0),
                'astro_score': pred_row.get('astro_score', 60.0),
                
                # Additional features
                'galaxy_score': pred_row.get('galaxy_score', 70.0),
                'alt_rank': pred_row.get('alt_rank', 15),
                'social_volume': pred_row.get('social_volume', 8000),
            }
            
            combined_data.append(feature_vector)
        
        return combined_data
    
    def _get_fallback_features(self, days_back: int) -> Dict:
        """Generate realistic fallback training data when Supabase is unavailable"""
        print(f"🔄 Generating fallback training data for {days_back} days")
        
        np.random.seed(42)  # For reproducible fallback data
        
        # Generate timestamps
        end_date = datetime.now()
        timestamps = [end_date - timedelta(hours=i) for i in range(days_back * 24)]
        timestamps.reverse()
        
        data = []
        base_price = 150.0
        
        for i, timestamp in enumerate(timestamps):
            # Simulate realistic price movement
            price_change = np.random.normal(0, 0.02) * base_price
            price = max(base_price + price_change, 50.0)  # Minimum price floor
            base_price = price
            
            # Correlated features
            volume = np.random.lognormal(16.5, 0.3)  # Around 20M volume
            rsi = np.clip(np.random.normal(60, 15), 0, 100)
            macd = np.random.normal(0, 1.5)
            
            # Pillar scores with some correlation to price movement
            trend = 1 if price_change > 0 else -1
            tech_score = np.clip(np.random.normal(35 + trend * 5, 8), 0, 100)
            social_score = np.clip(np.random.normal(32 + trend * 2, 6), 0, 100)
            fund_score = np.clip(np.random.normal(33, 5), 0, 100)
            astro_score = np.clip(np.random.normal(60, 10), 0, 100)
            
            # Generate prediction based on features (for training target)
            feature_signal = (
                (rsi - 50) / 50 * 0.3 +
                np.tanh(macd) * 0.2 +
                (tech_score - 50) / 50 * 0.2 +
                (social_score - 50) / 50 * 0.1 +
                (astro_score - 50) / 50 * 0.2
            )
            
            prediction = np.clip(feature_signal + np.random.normal(0, 0.1), -1, 1)
            confidence = np.clip(abs(prediction) + np.random.uniform(0.1, 0.3), 0, 1)
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'prediction': float(prediction),
                'confidence': float(confidence),
                'actual_outcome': float(np.sign(price_change)) if i < len(timestamps) - 24 else None,
                
                'price': float(price),
                'volume': float(volume),
                'market_cap': float(price * 450_000_000),  # Rough SOL supply
                'high': float(price * (1 + abs(np.random.normal(0, 0.01)))),
                'low': float(price * (1 - abs(np.random.normal(0, 0.01)))),
                
                'rsi': float(rsi),
                'macd': float(macd),
                'ema': float(price * (1 + np.random.normal(0, 0.005))),
                'sma': float(price * (1 + np.random.normal(0, 0.005))),
                'atr': float(abs(np.random.normal(2.0, 0.5))),
                
                'tech_score': float(tech_score),
                'social_score': float(social_score),
                'fund_score': float(fund_score),
                'astro_score': float(astro_score),
                
                'galaxy_score': float(np.clip(np.random.normal(70, 10), 0, 100)),
                'alt_rank': int(np.clip(np.random.normal(15, 5), 1, 50)),
                'social_volume': float(np.random.lognormal(9, 0.5)),
            })
        
        return {
            'success': True,
            'data': data,
            'rows_fetched': len(data),
            'date_range': f"{timestamps[0].strftime('%Y-%m-%d')} to {timestamps[-1].strftime('%Y-%m-%d')}",
            'source': 'fallback_realistic'
        }
    
    def store_training_results(self, results: Dict) -> bool:
        """Store training results back to Supabase"""
        if not self.supabase:
            print("⚠️ Supabase not available, skipping result storage")
            return False
        
        try:
            training_record = {
                'timestamp': datetime.now().isoformat(),
                'training_type': results.get('training_type', 'daily'),
                'ensemble_accuracy': results.get('ensemble_accuracy'),
                'lstm_accuracy': results.get('lstm_accuracy'),
                'optuna_best_score': results.get('optuna_best_score'),
                'optuna_trials': results.get('optuna_trials'),
                'training_samples': results.get('training_samples'),
                'validation_samples': results.get('validation_samples'),
                'training_duration_seconds': results.get('training_duration'),
                'model_version': results.get('model_version', '1.0'),
                'hyperparameters': json.dumps(results.get('best_params', {})),
                'notes': results.get('notes', '')
            }
            
            response = self.supabase.table('training_history').insert(training_record).execute()
            print(f"✅ Training results stored with ID: {response.data[0]['id']}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to store training results: {e}")
            return False
    
    def get_training_history(self, limit: int = 10) -> List[Dict]:
        """Retrieve recent training history"""
        if not self.supabase:
            return []
        
        try:
            response = self.supabase.table('training_history') \
                .select('*') \
                .order('timestamp', desc=True) \
                .limit(limit) \
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            print(f"❌ Failed to retrieve training history: {e}")
            return []

# Global instance
data_service = DataService()

def pull_supabase_features(days_back: int = 30) -> Dict:
    """Main function called by the scheduler"""
    return data_service.pull_supabase_features(days_back)

def store_training_results(results: Dict) -> bool:
    """Store training results"""
    return data_service.store_training_results(results)

if __name__ == "__main__":
    # Test the data service
    print("=== Testing Data Service ===")
    
    result = pull_supabase_features(7)  # Test with 7 days
    print(f"✅ Pulled {result['rows_fetched']} feature vectors")
    print(f"📅 Date range: {result['date_range']}")
    print(f"🔧 Source: {result['source']}")
    
    if result['data']:
        print(f"📊 Sample feature keys: {list(result['data'][0].keys())}")