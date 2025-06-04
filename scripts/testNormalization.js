// scripts/testNormalization.js
import { initializeNormalization, normalizeMetrics } from "../services/normalize.js";

async function testNormalization() {
  console.log("Testing normalization service with Supabase integration...");
  
  // Initialize normalization bounds from database
  await initializeNormalization();
  
  // Test sample metrics
  const sampleMetrics = {
    rsi: 65,
    price: 120,
    volume24h: 3000000000,
    galaxyScore: 55,
    socialVolume: 2000,
    priceChange24h: 5.2,
    totalValidators: 1400,
    moonPhase: 0.7,
    moonIllumination: 85
  };
  
  console.log("Sample raw metrics:", sampleMetrics);
  
  const normalized = normalizeMetrics(sampleMetrics);
  console.log("Normalized scores (0-100):", normalized);
  
  // Test edge cases
  const edgeMetrics = {
    rsi: 0,     // minimum bound
    price: 300, // maximum bound 
    invalidMetric: 999 // unknown metric
  };
  
  console.log("\nEdge case metrics:", edgeMetrics);
  const normalizedEdge = normalizeMetrics(edgeMetrics);
  console.log("Normalized edge cases:", normalizedEdge);
}

testNormalization().catch(console.error);