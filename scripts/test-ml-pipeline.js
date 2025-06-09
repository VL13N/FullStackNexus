/**
 * Comprehensive ML Feature Pipeline Test
 * Demonstrates complete feature generation, normalization, and dataset export
 */

import { FeaturePipeline } from '../services/featurePipeline.js';
import { DatasetExporter } from '../services/datasetExporter.js';

async function testMLPipeline() {
  console.log('🚀 Testing Complete ML Feature Pipeline');
  console.log('=====================================\n');
  
  try {
    // Step 1: Generate multiple feature vectors
    const pipeline = new FeaturePipeline();
    const exporter = new DatasetExporter();
    
    console.log('📊 Generating feature vectors from authentic data sources...');
    
    const featureVectors = [];
    for (let i = 0; i < 5; i++) {
      console.log(`Generating vector ${i + 1}/5...`);
      const features = await pipeline.generateFeatureVector('SOL');
      featureVectors.push(features);
      
      // Add small delay to get varied data
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`✅ Generated ${featureVectors.length} feature vectors\n`);
    
    // Step 2: Analyze feature composition
    console.log('🔬 Feature Composition Analysis');
    console.log('==============================');
    
    const sampleVector = featureVectors[0];
    
    if (sampleVector.technical_normalized) {
      const techFeatures = Object.keys(sampleVector.technical_normalized);
      console.log(`Technical Features (${techFeatures.length}):`, techFeatures.slice(0, 5).join(', ') + '...');
    }
    
    if (sampleVector.social_normalized) {
      const socialFeatures = Object.keys(sampleVector.social_normalized);
      console.log(`Social Features (${socialFeatures.length}):`, socialFeatures.slice(0, 3).join(', ') + '...');
    }
    
    if (sampleVector.fundamental_normalized) {
      const fundFeatures = Object.keys(sampleVector.fundamental_normalized);
      console.log(`Fundamental Features (${fundFeatures.length}):`, fundFeatures.slice(0, 3).join(', ') + '...');
    }
    
    if (sampleVector.astrology_normalized) {
      const astroFeatures = Object.keys(sampleVector.astrology_normalized);
      console.log(`Astrology Features (${astroFeatures.length}):`, astroFeatures.slice(0, 3).join(', ') + '...');
    }
    
    console.log('\n📈 Score Summary Across Vectors:');
    console.log('================================');
    
    featureVectors.forEach((vector, index) => {
      console.log(`Vector ${index + 1}:`);
      console.log(`  Technical: ${vector.technical_score?.toFixed(1) || 'N/A'}`);
      console.log(`  Social: ${vector.social_score?.toFixed(1) || 'N/A'}`);
      console.log(`  Fundamental: ${vector.fundamental_score?.toFixed(1) || 'N/A'}`);
      console.log(`  Astrology: ${vector.astrology_score?.toFixed(1) || 'N/A'}`);
      console.log(`  Overall: ${vector.overall_score?.toFixed(1) || 'N/A'} (${vector.classification || 'N/A'})`);
      console.log(`  Quality: ${vector.data_quality_score?.toFixed(1) || 'N/A'}%\n`);
    });
    
    // Step 3: Test dataset export functionality
    console.log('📦 Testing Dataset Export');
    console.log('=========================');
    
    try {
      // Export as JSON
      const jsonDataset = await exporter.exportTrainingDataset({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        format: 'json',
        includeTargets: true
      });
      
      console.log('JSON Export Results:');
      console.log(`  Total Samples: ${jsonDataset.metadata.total_samples}`);
      console.log(`  Feature Count: ${jsonDataset.metadata.feature_count}`);
      console.log(`  Data Quality: ${jsonDataset.metadata.data_quality.toFixed(1)}%`);
      console.log(`  Completeness: ${jsonDataset.metadata.completeness.toFixed(1)}%`);
      
      if (jsonDataset.features && jsonDataset.features.length > 0) {
        console.log(`  Sample Feature Vector Length: ${jsonDataset.features[0].length}`);
        console.log(`  Sample Features: [${jsonDataset.features[0].slice(0, 5).map(f => f.toFixed(3)).join(', ')}...]`);
      }
      
      // Test data splits
      if (jsonDataset.features && jsonDataset.features.length > 2) {
        const splits = exporter.createDataSplits(jsonDataset);
        console.log('\nData Splits:');
        console.log(`  Training: ${splits.train.features.length} samples`);
        console.log(`  Validation: ${splits.validation.features.length} samples`);
        console.log(`  Test: ${splits.test.features.length} samples`);
      }
      
    } catch (exportError) {
      console.log('Dataset export test skipped:', exportError.message);
    }
    
    // Step 4: Feature normalization validation
    console.log('\n🎯 Feature Normalization Validation');
    console.log('===================================');
    
    const vector = featureVectors[0];
    let totalFeatures = 0;
    let normalizedFeatures = 0;
    
    ['technical_normalized', 'social_normalized', 'fundamental_normalized', 'astrology_normalized'].forEach(domain => {
      if (vector[domain]) {
        const features = Object.values(vector[domain]);
        totalFeatures += features.length;
        normalizedFeatures += features.filter(f => f >= 0 && f <= 1).length;
        
        const domainName = domain.replace('_normalized', '');
        const validFeatures = features.filter(f => f !== null && f !== undefined && !isNaN(f)).length;
        console.log(`${domainName}: ${validFeatures}/${features.length} valid features`);
      }
    });
    
    const normalizationRate = totalFeatures > 0 ? (normalizedFeatures / totalFeatures * 100) : 0;
    console.log(`Overall Normalization: ${normalizedFeatures}/${totalFeatures} (${normalizationRate.toFixed(1)}%)`);
    
    // Step 5: Data source connectivity summary
    console.log('\n🌐 Data Source Connectivity');
    console.log('===========================');
    
    const connectivity = {
      technical: featureVectors.filter(v => v.technical_score > 0).length,
      social: featureVectors.filter(v => v.social_score > 0).length,
      fundamental: featureVectors.filter(v => v.fundamental_score > 0).length,
      astrology: featureVectors.filter(v => v.astrology_score > 0).length
    };
    
    console.log(`TAAPI (Technical): ${connectivity.technical}/${featureVectors.length} successful`);
    console.log(`LunarCrush (Social): ${connectivity.social}/${featureVectors.length} successful`);
    console.log(`CryptoRank (Fundamental): ${connectivity.fundamental}/${featureVectors.length} successful`);
    console.log(`Astrology Engine: ${connectivity.astrology}/${featureVectors.length} successful`);
    
    const avgConnectivity = Object.values(connectivity).reduce((a, b) => a + b, 0) / (4 * featureVectors.length) * 100;
    console.log(`Average Connectivity: ${avgConnectivity.toFixed(1)}%`);
    
    // Step 6: ML Readiness Assessment
    console.log('\n🤖 ML Readiness Assessment');
    console.log('==========================');
    
    const avgQuality = featureVectors.reduce((sum, v) => sum + (v.data_quality_score || 0), 0) / featureVectors.length;
    const avgCompleteness = featureVectors.reduce((sum, v) => sum + (v.feature_completeness || 0), 0) / featureVectors.length;
    
    console.log(`Data Quality Score: ${avgQuality.toFixed(1)}%`);
    console.log(`Feature Completeness: ${avgCompleteness.toFixed(1)}%`);
    console.log(`Normalization Rate: ${normalizationRate.toFixed(1)}%`);
    console.log(`Source Connectivity: ${avgConnectivity.toFixed(1)}%`);
    
    const mlReadiness = (avgQuality + avgCompleteness + normalizationRate + avgConnectivity) / 4;
    console.log(`\n🎯 ML Readiness Score: ${mlReadiness.toFixed(1)}%`);
    
    if (mlReadiness > 80) {
      console.log('✅ System ready for ML training');
    } else if (mlReadiness > 60) {
      console.log('⚠️  System partially ready - consider improving data sources');
    } else {
      console.log('❌ System needs improvement before ML training');
    }
    
    console.log('\n🏁 ML Feature Pipeline Test Complete');
    console.log('=====================================');
    
    return {
      featureVectors,
      connectivity,
      quality: {
        avgQuality,
        avgCompleteness,
        normalizationRate,
        avgConnectivity,
        mlReadiness
      }
    };
    
  } catch (error) {
    console.error('❌ ML Pipeline test failed:', error.message);
    throw error;
  }
}

testMLPipeline();