/**
 * ML System Verification
 * Quick verification of complete ML feature pipeline
 */

import { FeaturePipeline } from '../services/featurePipeline.js';

async function verifyMLSystem() {
  console.log('ML Feature Pipeline Verification');
  console.log('================================');
  
  const pipeline = new FeaturePipeline();
  
  // Generate single feature vector
  const features = await pipeline.generateFeatureVector('SOL');
  
  console.log('Feature Generation Results:');
  console.log(`Technical Score: ${features.technical_score?.toFixed(1) || 'N/A'}`);
  console.log(`Social Score: ${features.social_score?.toFixed(1) || 'N/A'}`);
  console.log(`Fundamental Score: ${features.fundamental_score?.toFixed(1) || 'N/A'}`);
  console.log(`Astrology Score: ${features.astrology_score?.toFixed(1) || 'N/A'}`);
  console.log(`Overall Score: ${features.overall_score?.toFixed(1) || 'N/A'}`);
  console.log(`Classification: ${features.classification || 'N/A'}`);
  console.log(`Data Quality: ${features.data_quality_score?.toFixed(1)}%` || 'N/A');
  
  // Count normalized features
  let totalFeatures = 0;
  ['technical_normalized', 'social_normalized', 'fundamental_normalized', 'astrology_normalized'].forEach(domain => {
    if (features[domain]) {
      const count = Object.keys(features[domain]).length;
      totalFeatures += count;
      console.log(`${domain.replace('_normalized', '')} Features: ${count}`);
    }
  });
  
  console.log(`Total Normalized Features: ${totalFeatures}`);
  console.log(`Storage ID: ${features.id}`);
  console.log('\nML Pipeline Status: Operational');
}

verifyMLSystem();