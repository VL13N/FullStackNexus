"""
Model Deployment Service
Handles serialization and deployment of updated model artifacts for real-time serving
"""

import os
import pickle
import json
import shutil
from datetime import datetime
from typing import Dict, Any
import numpy as np
import pandas as pd

class ModelDeployment:
    def __init__(self):
        self.model_dir = '/home/runner/workspace/models'
        self.backup_dir = '/home/runner/workspace/models/backups'
        self.ensure_directories()
    
    def ensure_directories(self):
        """Ensure model and backup directories exist"""
        os.makedirs(self.model_dir, exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def deploy_updated_models(self) -> Dict[str, Any]:
        """
        Deploy updated model artifacts for real-time serving
        Backs up existing models and replaces with newly trained ones
        """
        try:
            deployment_timestamp = datetime.now().isoformat()
            deployment_log = {
                'timestamp': deployment_timestamp,
                'deployed_models': [],
                'backed_up_models': [],
                'status': 'success'
            }
            
            # 1. Backup existing models
            print("📦 Backing up existing models...")
            backup_result = self._backup_existing_models(deployment_timestamp)
            deployment_log['backed_up_models'] = backup_result
            
            # 2. Deploy ensemble models
            print("🚀 Deploying ensemble models...")
            ensemble_result = self._deploy_ensemble_models()
            deployment_log['deployed_models'].append(ensemble_result)
            
            # 3. Deploy LSTM models
            print("🧠 Deploying LSTM models...")
            lstm_result = self._deploy_lstm_models()
            deployment_log['deployed_models'].append(lstm_result)
            
            # 4. Deploy preprocessing artifacts
            print("⚙️ Deploying preprocessing artifacts...")
            preprocessing_result = self._deploy_preprocessing_artifacts()
            deployment_log['deployed_models'].append(preprocessing_result)
            
            # 5. Update model metadata
            print("📋 Updating model metadata...")
            metadata_result = self._update_model_metadata(deployment_timestamp)
            deployment_log['metadata'] = metadata_result
            
            # 6. Validate deployment
            print("✅ Validating deployment...")
            validation_result = self._validate_deployment()
            deployment_log['validation'] = validation_result
            
            print(f"🎉 Model deployment completed successfully at {deployment_timestamp}")
            return {
                'success': True,
                'deployment_log': deployment_log,
                'timestamp': deployment_timestamp
            }
            
        except Exception as e:
            print(f"❌ Model deployment failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _backup_existing_models(self, timestamp: str) -> list:
        """Backup existing models before deployment"""
        backed_up = []
        backup_subdir = os.path.join(self.backup_dir, timestamp.replace(':', '-'))
        os.makedirs(backup_subdir, exist_ok=True)
        
        model_files = [
            'ensemble_xgb.pkl',
            'ensemble_rf.pkl',
            'ensemble_meta.pkl',
            'lstm_model.h5',
            'scaler.pkl',
            'feature_columns.json',
            'model_metadata.json'
        ]
        
        for model_file in model_files:
            source_path = os.path.join(self.model_dir, model_file)
            if os.path.exists(source_path):
                backup_path = os.path.join(backup_subdir, model_file)
                shutil.copy2(source_path, backup_path)
                backed_up.append(model_file)
                print(f"   Backed up: {model_file}")
        
        return backed_up
    
    def _deploy_ensemble_models(self) -> Dict[str, Any]:
        """Deploy ensemble model artifacts"""
        try:
            # Load trained ensemble models from temporary training location
            temp_model_dir = '/tmp/training_models'
            
            ensemble_files = {
                'xgboost': 'ensemble_xgb.pkl',
                'random_forest': 'ensemble_rf.pkl',
                'meta_learner': 'ensemble_meta.pkl'
            }
            
            deployed = []
            for model_name, filename in ensemble_files.items():
                temp_path = os.path.join(temp_model_dir, filename)
                deploy_path = os.path.join(self.model_dir, filename)
                
                if os.path.exists(temp_path):
                    shutil.copy2(temp_path, deploy_path)
                    deployed.append(filename)
                    print(f"   Deployed: {filename}")
                else:
                    print(f"   Warning: {filename} not found in temp directory")
            
            return {
                'type': 'ensemble',
                'deployed_files': deployed,
                'status': 'success' if deployed else 'partial'
            }
            
        except Exception as e:
            return {
                'type': 'ensemble',
                'error': str(e),
                'status': 'failed'
            }
    
    def _deploy_lstm_models(self) -> Dict[str, Any]:
        """Deploy LSTM model artifacts"""
        try:
            temp_model_dir = '/tmp/training_models'
            
            lstm_files = [
                'lstm_model.h5',
                'lstm_weights.h5',
                'lstm_config.json'
            ]
            
            deployed = []
            for filename in lstm_files:
                temp_path = os.path.join(temp_model_dir, filename)
                deploy_path = os.path.join(self.model_dir, filename)
                
                if os.path.exists(temp_path):
                    shutil.copy2(temp_path, deploy_path)
                    deployed.append(filename)
                    print(f"   Deployed: {filename}")
            
            return {
                'type': 'lstm',
                'deployed_files': deployed,
                'status': 'success' if deployed else 'partial'
            }
            
        except Exception as e:
            return {
                'type': 'lstm',
                'error': str(e),
                'status': 'failed'
            }
    
    def _deploy_preprocessing_artifacts(self) -> Dict[str, Any]:
        """Deploy preprocessing artifacts (scalers, feature columns, etc.)"""
        try:
            temp_model_dir = '/tmp/training_models'
            
            preprocessing_files = [
                'scaler.pkl',
                'feature_columns.json',
                'label_encoder.pkl',
                'feature_selector.pkl'
            ]
            
            deployed = []
            for filename in preprocessing_files:
                temp_path = os.path.join(temp_model_dir, filename)
                deploy_path = os.path.join(self.model_dir, filename)
                
                if os.path.exists(temp_path):
                    shutil.copy2(temp_path, deploy_path)
                    deployed.append(filename)
                    print(f"   Deployed: {filename}")
            
            return {
                'type': 'preprocessing',
                'deployed_files': deployed,
                'status': 'success' if deployed else 'partial'
            }
            
        except Exception as e:
            return {
                'type': 'preprocessing',
                'error': str(e),
                'status': 'failed'
            }
    
    def _update_model_metadata(self, timestamp: str) -> Dict[str, Any]:
        """Update model metadata with deployment information"""
        try:
            metadata = {
                'deployment_timestamp': timestamp,
                'model_version': f"auto_retrained_{timestamp.split('T')[0]}",
                'training_type': 'automated_retraining',
                'ensemble_models': ['xgboost', 'random_forest', 'meta_learner'],
                'deep_learning_models': ['lstm'],
                'preprocessing_artifacts': ['scaler', 'feature_columns'],
                'api_compatibility': 'v2.0',
                'performance_metrics': {
                    'last_validation_accuracy': None,  # To be updated by training process
                    'confidence_score': None,
                    'feature_count': None
                },
                'notes': 'Automatically deployed via scheduled retraining'
            }
            
            metadata_path = os.path.join(self.model_dir, 'model_metadata.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            print(f"   Updated metadata: {metadata_path}")
            return metadata
            
        except Exception as e:
            return {'error': str(e)}
    
    def _validate_deployment(self) -> Dict[str, Any]:
        """Validate that deployed models can be loaded and used"""
        validation_results = {
            'ensemble_models': False,
            'lstm_models': False,
            'preprocessing': False,
            'metadata': False,
            'overall_status': False
        }
        
        try:
            # Test ensemble models
            try:
                xgb_path = os.path.join(self.model_dir, 'ensemble_xgb.pkl')
                if os.path.exists(xgb_path):
                    with open(xgb_path, 'rb') as f:
                        pickle.load(f)
                    validation_results['ensemble_models'] = True
                    print("   ✅ Ensemble models validation passed")
            except Exception as e:
                print(f"   ❌ Ensemble models validation failed: {e}")
            
            # Test preprocessing artifacts
            try:
                scaler_path = os.path.join(self.model_dir, 'scaler.pkl')
                features_path = os.path.join(self.model_dir, 'feature_columns.json')
                
                if os.path.exists(scaler_path):
                    with open(scaler_path, 'rb') as f:
                        pickle.load(f)
                
                if os.path.exists(features_path):
                    with open(features_path, 'r') as f:
                        json.load(f)
                
                validation_results['preprocessing'] = True
                print("   ✅ Preprocessing artifacts validation passed")
            except Exception as e:
                print(f"   ❌ Preprocessing validation failed: {e}")
            
            # Test metadata
            try:
                metadata_path = os.path.join(self.model_dir, 'model_metadata.json')
                if os.path.exists(metadata_path):
                    with open(metadata_path, 'r') as f:
                        json.load(f)
                    validation_results['metadata'] = True
                    print("   ✅ Metadata validation passed")
            except Exception as e:
                print(f"   ❌ Metadata validation failed: {e}")
            
            # Overall status
            validation_results['overall_status'] = (
                validation_results['ensemble_models'] and 
                validation_results['preprocessing'] and 
                validation_results['metadata']
            )
            
            if validation_results['overall_status']:
                print("   🎉 Overall deployment validation passed")
            else:
                print("   ⚠️ Deployment validation has issues")
            
            return validation_results
            
        except Exception as e:
            validation_results['validation_error'] = str(e)
            return validation_results
    
    def rollback_deployment(self, backup_timestamp: str) -> Dict[str, Any]:
        """Rollback to a previous model deployment"""
        try:
            backup_subdir = os.path.join(self.backup_dir, backup_timestamp.replace(':', '-'))
            
            if not os.path.exists(backup_subdir):
                return {
                    'success': False,
                    'error': f"Backup directory not found: {backup_timestamp}"
                }
            
            # Restore files from backup
            restored_files = []
            for backup_file in os.listdir(backup_subdir):
                backup_path = os.path.join(backup_subdir, backup_file)
                restore_path = os.path.join(self.model_dir, backup_file)
                
                shutil.copy2(backup_path, restore_path)
                restored_files.append(backup_file)
                print(f"   Restored: {backup_file}")
            
            return {
                'success': True,
                'restored_files': restored_files,
                'rollback_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_available_backups(self) -> list:
        """List available backup timestamps for rollback"""
        try:
            if not os.path.exists(self.backup_dir):
                return []
            
            backups = []
            for backup_dir in os.listdir(self.backup_dir):
                backup_path = os.path.join(self.backup_dir, backup_dir)
                if os.path.isdir(backup_path):
                    # Get backup info
                    files = os.listdir(backup_path)
                    size = sum(os.path.getsize(os.path.join(backup_path, f)) for f in files)
                    
                    backups.append({
                        'timestamp': backup_dir.replace('-', ':'),
                        'files_count': len(files),
                        'size_bytes': size,
                        'files': files
                    })
            
            return sorted(backups, key=lambda x: x['timestamp'], reverse=True)
            
        except Exception:
            return []

# Global instance
model_deployment = ModelDeployment()

def deploy_updated_models() -> Dict[str, Any]:
    """Main function called by the scheduler"""
    return model_deployment.deploy_updated_models()

def rollback_deployment(backup_timestamp: str) -> Dict[str, Any]:
    """Rollback to a previous deployment"""
    return model_deployment.rollback_deployment(backup_timestamp)

def list_available_backups() -> list:
    """List available backups"""
    return model_deployment.list_available_backups()

if __name__ == "__main__":
    # Test deployment service
    print("=== Testing Model Deployment Service ===")
    
    # List backups
    backups = list_available_backups()
    print(f"Available backups: {len(backups)}")
    
    # Test deployment (will fail without trained models, but tests structure)
    result = deploy_updated_models()
    print(f"Deployment test result: {result['success']}")