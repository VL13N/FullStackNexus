/**
 * Historical Data Generation Script
 * Generates feature vectors at hourly intervals for improved ML training
 */

import { FeaturePipeline } from '../services/featurePipeline.js';

async function generateHistoricalData() {
  console.log('Historical Data Generation');
  console.log('=========================');
  
  const pipeline = new FeaturePipeline();
  const symbol = 'SOL';
  const hoursToGenerate = 48; // Generate 48 hours of data
  
  console.log(`Generating ${hoursToGenerate} hours of historical data for ${symbol}`);
  
  const results = {
    generated: 0,
    errors: 0,
    startTime: new Date(),
    vectors: []
  };
  
  for (let i = hoursToGenerate; i >= 0; i--) {
    const targetTime = new Date(Date.now() - i * 60 * 60 * 1000);
    console.log(`\nGenerating data for ${targetTime.toISOString()}`);
    
    try {
      const features = await pipeline.generateFeatureVector(symbol);
      
      // Override timestamp to create historical sequence
      features.timestamp = targetTime.toISOString();
      
      results.vectors.push({
        timestamp: features.timestamp,
        technical_score: features.technical_score,
        social_score: features.social_score,
        fundamental_score: features.fundamental_score,
        astrology_score: features.astrology_score,
        overall_score: features.overall_score,
        classification: features.classification,
        data_quality: features.data_quality_score
      });
      
      results.generated++;
      console.log(`✅ Generated vector ${results.generated}/${hoursToGenerate + 1}`);
      console.log(`   Scores: T:${features.technical_score?.toFixed(1)} S:${features.social_score?.toFixed(1)} F:${features.fundamental_score?.toFixed(1)} A:${features.astrology_score?.toFixed(1)}`);
      console.log(`   Classification: ${features.classification} (${features.data_quality_score?.toFixed(1)}% quality)`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error generating data for ${targetTime.toISOString()}:`, error.message);
      results.errors++;
    }
  }
  
  console.log('\nGeneration Summary:');
  console.log('==================');
  console.log(`Successfully generated: ${results.generated} vectors`);
  console.log(`Errors encountered: ${results.errors}`);
  console.log(`Success rate: ${(results.generated / (hoursToGenerate + 1) * 100).toFixed(1)}%`);
  console.log(`Time taken: ${Math.round((new Date() - results.startTime) / 1000)}s`);
  
  if (results.generated >= 24) {
    console.log('\n✅ Sufficient data generated for ML training (minimum 24 sequences)');
  } else {
    console.log('\n⚠️  Insufficient data for optimal ML training. Consider running again.');
  }
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateHistoricalData()
    .then(results => {
      console.log(`\nHistorical data generation completed: ${results.generated} vectors`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Historical data generation failed:', error.message);
      process.exit(1);
    });
}

export { generateHistoricalData };