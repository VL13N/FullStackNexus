/**
 * Test Feature Pipeline Generation
 * Direct test of ML feature pipeline with authentic data
 */

import { FeaturePipeline } from '../services/featurePipeline.js';

async function testFeaturePipeline() {
  console.log('🔄 Testing feature pipeline with authentic data...');
  
  try {
    const pipeline = new FeaturePipeline();
    const startTime = Date.now();
    
    // Generate complete feature vector for SOL
    const features = await pipeline.generateFeatureVector('SOL');
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Feature pipeline completed in ${processingTime}ms`);
    
    // Display feature summary
    console.log('\n📊 Feature Summary:');
    console.log('==================');
    
    if (features.technical_score) {
      console.log(`Technical Score: ${features.technical_score.toFixed(2)}`);
    }
    if (features.social_score) {
      console.log(`Social Score: ${features.social_score.toFixed(2)}`);
    }
    if (features.fundamental_score) {
      console.log(`Fundamental Score: ${features.fundamental_score.toFixed(2)}`);
    }
    if (features.astrology_score) {
      console.log(`Astrology Score: ${features.astrology_score.toFixed(2)}`);
    }
    if (features.overall_score) {
      console.log(`Overall Score: ${features.overall_score.toFixed(2)}`);
    }
    if (features.classification) {
      console.log(`Classification: ${features.classification}`);
    }
    if (features.risk_level) {
      console.log(`Risk Level: ${features.risk_level}`);
    }
    if (features.data_quality_score) {
      console.log(`Data Quality: ${features.data_quality_score.toFixed(1)}%`);
    }
    if (features.feature_completeness) {
      console.log(`Feature Completeness: ${features.feature_completeness.toFixed(1)}%`);
    }
    
    console.log('\n🔬 Normalized Features Available:');
    console.log('=================================');
    
    // Count normalized features by domain
    const normalizedFeatures = features.technical_normalized || {};
    const socialFeatures = features.social_normalized || {};
    const fundamentalFeatures = features.fundamental_normalized || {};
    const astrologyFeatures = features.astrology_normalized || {};
    
    console.log(`Technical Features: ${Object.keys(normalizedFeatures).length}`);
    console.log(`Social Features: ${Object.keys(socialFeatures).length}`);
    console.log(`Fundamental Features: ${Object.keys(fundamentalFeatures).length}`);
    console.log(`Astrology Features: ${Object.keys(astrologyFeatures).length}`);
    
    const totalFeatures = Object.keys(normalizedFeatures).length + 
                         Object.keys(socialFeatures).length + 
                         Object.keys(fundamentalFeatures).length + 
                         Object.keys(astrologyFeatures).length;
    
    console.log(`\n📈 Total ML Features Generated: ${totalFeatures}`);
    console.log(`Storage ID: ${features.id}`);
    
    return features;
    
  } catch (error) {
    console.error('❌ Feature pipeline test failed:', error.message);
    throw error;
  }
}

testFeaturePipeline();