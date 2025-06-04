# LunarCrush API Integration for Solana Social Metrics

## Overview

Complete LunarCrush API integration for retrieving Solana social metrics including Galaxy Score™, AltRank™, and social volume data. The integration utilizes the exact endpoint structure specified in the LunarCrush API documentation.

## Endpoint Structure

The LunarCrush API uses the following endpoint structure:
```
https://api.lunarcrush.com/v2?data=assets&key={API_KEY}&symbol=SOL
```

## Implementation Files

### Backend Implementation

#### `/api/lunarcrush.js`
- Complete LunarCrush service class with comprehensive methods
- Handles authentication and error management
- Supports all major social metrics and analysis features
- Implements time series and influencer data retrieval

#### `/api/routes/lunarcrush.js`
- Express.js routes for LunarCrush endpoints
- RESTful API structure with proper error handling
- Standardized response format

#### `/server/routes.ts`
- Direct TypeScript implementation integrated into main server
- Active endpoints: `/api/lunarcrush/metrics`, `/api/lunarcrush/social`

## Available Endpoints

### Core Social Metrics

#### Basic Metrics
```
GET /api/lunarcrush/metrics?symbol=SOL&interval=1d
```

Response:
```json
{
  "success": true,
  "type": "social_metrics",
  "symbol": "SOL",
  "interval": "1d",
  "data": {
    "symbol": "SOL",
    "name": "Solana",
    "price": 125.67,
    "priceChange24h": 5.23,
    "volume24h": 2500000000,
    "marketCap": 58000000000,
    "galaxyScore": 75.8,
    "altRank": 12,
    "socialVolume": 15420,
    "socialScore": 82.5,
    "socialContributors": 2847,
    "socialDominance": 3.2,
    "marketDominance": 2.8,
    "correlationRank": 8,
    "volatility": 0.045
  },
  "timestamp": "2025-06-04T11:12:40.578Z"
}
```

#### Detailed Social Metrics
```
GET /api/lunarcrush/social
```

Response:
```json
{
  "success": true,
  "type": "detailed_social_metrics",
  "data": {
    "symbol": "SOL",
    "name": "Solana",
    "socialMetrics": {
      "galaxyScore": {
        "value": 75.8,
        "description": "Galaxy Score™ - Overall health and performance metric"
      },
      "altRank": {
        "value": 12,
        "description": "AltRank™ - Alternative ranking based on social activity"
      },
      "socialVolume": {
        "value": 15420,
        "description": "Total social media mentions and discussions"
      },
      "socialScore": {
        "value": 82.5,
        "description": "Social engagement and sentiment score"
      },
      "socialContributors": {
        "value": 2847,
        "description": "Number of unique social contributors"
      },
      "socialDominance": {
        "value": 3.2,
        "description": "Social dominance compared to other cryptocurrencies"
      }
    },
    "marketMetrics": {
      "price": 125.67,
      "priceChange24h": 5.23,
      "volume24h": 2500000000,
      "marketCap": 58000000000,
      "marketDominance": 2.8,
      "correlationRank": 8,
      "volatility": 0.045
    }
  },
  "timestamp": "2025-06-04T11:12:40.578Z"
}
```

### Advanced Features

#### Influencer Data
```
GET /api/lunarcrush/influencers?limit=10
```

#### Social Feed
```
GET /api/lunarcrush/feed?limit=20
```

#### Time Series Data
```
GET /api/lunarcrush/timeseries?interval=1d&start=1640995200&end=1672531200
```

#### Comprehensive Analysis
```
GET /api/lunarcrush/analysis
```

#### Multi-Asset Comparison
```
GET /api/lunarcrush/comparison?symbols=SOL,BTC,ETH,ADA,DOT
```

#### Market Overview
```
GET /api/lunarcrush/market
```

## Key Metrics Explained

### Galaxy Score™
Overall health and performance metric combining social and market data. Higher scores indicate stronger community engagement and market performance.

### AltRank™
Alternative ranking system based on social activity, sentiment, and engagement levels. Lower numbers indicate higher ranking.

### Social Volume
Total number of social media mentions, posts, and discussions across platforms including Twitter, Reddit, and news sources.

### Social Score
Composite score measuring social engagement quality, sentiment analysis, and community interaction levels.

### Social Contributors
Number of unique users contributing to social discussions and mentions.

### Social Dominance
Percentage of total cryptocurrency social volume attributed to the specific asset.

## Implementation Features

### Service Class Methods

#### Core Methods
- `getSolanaMetrics(symbol, interval)` - Basic social metrics
- `getSolanaSocialMetrics()` - Detailed social analysis
- `getSolanaInfluencers(limit)` - Top influencers
- `getSolanaFeed(limit)` - Recent social feed
- `getSolanaTimeSeries(interval, start, end)` - Historical data

#### Advanced Methods
- `getComprehensiveSolanaAnalysis()` - Complete analysis
- `getMultiAssetComparison(symbols)` - Asset comparison
- `getMarketOverview()` - Market positioning

### Error Handling

The integration implements comprehensive error handling:

#### API Key Validation
```json
{
  "success": false,
  "error": "LunarCrush API key not configured",
  "timestamp": "2025-06-04T11:12:40.578Z"
}
```

#### Network Errors
```json
{
  "success": false,
  "error": "fetch failed",
  "timestamp": "2025-06-04T11:12:40.578Z"
}
```

#### Data Not Found
```json
{
  "success": false,
  "error": "No data found for the specified symbol",
  "timestamp": "2025-06-04T11:12:40.578Z"
}
```

## Configuration

### Required Environment Variables
```bash
LUNARCRUSH_API_KEY=your_lunarcrush_api_key_here
```

### API Key Setup
1. Register at https://lunarcrush.com/
2. Navigate to API section in dashboard
3. Generate API key
4. Add to environment variables

## Testing Examples

### Manual Testing
```bash
# Test basic metrics
curl "http://localhost:5000/api/lunarcrush/metrics?symbol=SOL&interval=1d"

# Test detailed social metrics
curl "http://localhost:5000/api/lunarcrush/social"

# Test influencers
curl "http://localhost:5000/api/lunarcrush/influencers?limit=5"

# Test social feed
curl "http://localhost:5000/api/lunarcrush/feed?limit=10"
```

### Expected Response Format
All endpoints return standardized JSON responses with:
- Success status
- Response type
- Data payload or error information
- Timestamp

## Integration Verification

The LunarCrush integration has been successfully implemented with:

1. ✅ Complete service class with all major methods
2. ✅ Express routes for all endpoints
3. ✅ TypeScript integration in main server
4. ✅ Comprehensive error handling
5. ✅ Standardized response formats
6. ✅ Documentation and testing examples

## Usage in Application

### Backend API Access
All endpoints are available at `/api/lunarcrush/*` for programmatic access by frontend components or external applications.

### Data Integration
The LunarCrush data can be combined with TAAPI Pro technical indicators for comprehensive Solana analysis combining social sentiment and technical analysis.

## Rate Limits and Considerations

- LunarCrush API has rate limits based on subscription tier
- Free tier has limited requests per month
- Paid tiers offer higher limits and additional features
- Implement appropriate caching for production use

## Security Considerations

- API keys stored securely in environment variables
- No sensitive data exposed in client-side code
- Error messages sanitized for security
- Rate limiting handled gracefully with user feedback