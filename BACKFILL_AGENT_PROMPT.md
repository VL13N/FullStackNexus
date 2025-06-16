# Replit Agent Prompt: Feature Vector Backfill System

## Objective
Execute a comprehensive 365-day feature vector backfill to populate ML training data for the astrological cryptocurrency analytics platform.

## Task Overview
Run the automated feature backfill system to generate 8,760 hourly feature vectors (365 days × 24 hours) for SOL cryptocurrency analysis, storing results in Supabase for ML model training.

## Prerequisites
- Platform running on port 5000
- Supabase database configured with credentials
- All API integrations operational (CryptoRank, TAAPI, LunarCrush, Astrology)

## Execution Steps

### 1. Setup Database Schema
```bash
node scripts/scheduleBackfill.js setup
```
Creates the `feature_vectors` table with proper indexing for timestamp-based queries.

### 2. Test Single Feature Generation
```bash
curl -X POST http://localhost:5000/api/features/generate \
  -H "Content-Type: application/json" \
  -d '{"symbol": "SOL", "timestamp": "2025-06-15T12:00:00.000Z"}'
```
Verify the endpoint returns valid feature data before bulk processing.

### 3. Run Full 365-Day Backfill
```bash
node scripts/backfillFeatures.js
```
This will:
- Generate 8,760 hourly timestamps from now-365d to now
- Process in batches of 5 with 2-second delays
- Call `/api/features/generate` for each timestamp
- Store results in Supabase `feature_vectors` table
- Log progress and generate completion report

### 4. Monitor Progress
The script outputs real-time progress:
```
📦 Processing batch 1/1752
🔄 Processing 2024-06-16T13:00:00.000Z...
✅ Feature vector stored for 2024-06-16T13:00:00.000Z
📊 Progress: 0.3% | Successful: 3 | Failed: 0 | Skipped: 2
⏱️ Elapsed: 15s | ETA: 5247s
```

### 5. Schedule Automated Collection
```bash
node scripts/scheduleBackfill.js schedule
```
Starts continuous data collection:
- Hourly incremental: 5 minutes past each hour
- Daily catch-up: 02:30 UTC
- Weekly deep backfill: Sunday 01:00 UTC

## Expected Results

### Feature Vector Structure
Each stored feature contains:
```json
{
  "timestamp": "2024-06-16T13:00:00.000Z",
  "symbol": "SOL",
  "features": {
    "technical_indicators": {
      "rsi": 69.56,
      "macd": 2.52,
      "ema_20": 152.43,
      "sma_50": 149.87,
      "atr": 1.89
    },
    "social_metrics": {
      "galaxy_score": 67.8,
      "social_volume": 1245,
      "sentiment_score": 0.72
    },
    "fundamental_data": {
      "market_cap": 71234567890,
      "volume_24h": 2345678901,
      "price": 152.45
    },
    "astrological_factors": {
      "moon_phase": 0.67,
      "planetary_aspects": 3,
      "lunar_transit": "Sagittarius"
    }
  },
  "data_quality_score": 0.87,
  "feature_completeness": 0.93
}
```

### Database Population
- **Target**: 8,760 feature vectors
- **Timeline**: ~3-4 hours for full backfill
- **Storage**: ~50MB of structured feature data
- **Success Rate**: Expected 85-95% (some historical data may be unavailable)

### ML Training Readiness
After completion:
```bash
curl -X POST http://localhost:5000/api/ml/train
```
Should return successful training with sufficient data samples.

## Error Handling

### Common Issues
1. **API Rate Limits**: Script includes delays between batches
2. **Historical Data Gaps**: Some external APIs may not have complete historical data
3. **Network Timeouts**: 30-second timeout per request with retry logic

### Monitoring Commands
```bash
# Check feature count
curl http://localhost:5000/api/ml/stats?days=365

# Verify latest features
curl http://localhost:5000/api/features/history?limit=10

# Test ML training readiness
curl -X POST http://localhost:5000/api/ml/train
```

## Integration Points

### ML Training Pipeline
- **Input**: 365 days of hourly features
- **Output**: Trained LSTM + ensemble models
- **Validation**: Walk-forward backtesting on historical data

### Risk Management
- **Position Sizing**: Kelly Criterion with confidence-based adjustments
- **Volatility Analysis**: Historical price movements and feature correlations

### Alert System
- **Pattern Recognition**: Anomaly detection on feature patterns
- **Threshold Monitoring**: Real-time feature-based alerts

## Success Criteria
- [ ] 6,000+ feature vectors successfully stored (70% minimum)
- [ ] ML training endpoint returns success with sufficient data
- [ ] Automated scheduler running for continuous collection
- [ ] Feature quality scores above 0.8 average
- [ ] All pillar scores (technical, social, fundamental, astrology) populated

## Post-Completion Actions
1. **Validate ML Training**: Confirm models can train on backfilled data
2. **Schedule Monitoring**: Set up alerts for backfill failures
3. **Performance Optimization**: Tune batch sizes based on actual performance
4. **Documentation Update**: Record completion status in replit.md

## Expected Completion Time
- **Database Setup**: 2 minutes
- **Full Backfill**: 3-4 hours
- **Scheduler Setup**: 1 minute
- **Validation**: 10 minutes

Execute this system to establish a comprehensive historical dataset for advanced ML model training and backtesting validation.