# Solana On-Chain Metrics Integration

## Overview

Complete Solana on-chain metrics integration for real-time blockchain data including TPS (Transactions Per Second), validator statistics, staking yields, and epoch information. The integration utilizes multiple data sources including Solana Tracker API and Bitquery Solana API.

## Data Sources

### Primary Sources

#### Solana Tracker API
- **Endpoint**: `https://data.solanatracker.io/v1`
- **Features**: Network metrics, validator data, epoch information
- **Authentication**: API key may be required for some endpoints
- **Rate Limits**: Varies by subscription tier

#### Bitquery Solana API
- **Endpoint**: `https://graphql.bitquery.io`
- **Features**: Transaction analytics, network statistics
- **Authentication**: API key required
- **Rate Limits**: Based on subscription plan

#### Solana RPC
- **Endpoint**: `https://api.mainnet-beta.solana.com`
- **Features**: Direct blockchain queries
- **Authentication**: None for basic queries
- **Rate Limits**: Public endpoints have limitations

## Implementation Files

### Backend Implementation

#### `/api/onchain.js`
- Complete Solana on-chain service class
- Multi-source data aggregation
- Comprehensive error handling
- Real-time metrics calculation

#### `/api/routes/onchain.js`
- Express.js routes for on-chain endpoints
- RESTful API structure
- Standardized response format

#### `/server/routes.ts`
- Direct TypeScript implementation in main server
- Active endpoints with fallback data sources

## Available Endpoints

### Network Metrics

#### Real-Time Network Data
```
GET /api/onchain/metrics
```

Response:
```json
{
  "success": true,
  "type": "network_metrics",
  "data": {
    "timestamp": "2025-06-04T11:30:00.000Z",
    "source": "solana_tracker",
    "network": {
      "tps": 2847.5,
      "blockHeight": 285647382,
      "totalTransactions": 245837462847,
      "averageBlockTime": 400
    },
    "validators": {
      "activeValidators": 1847,
      "totalValidators": 2156,
      "averageApy": 6.8,
      "totalStake": 398547283.45,
      "averageCommission": 7.2
    }
  },
  "timestamp": "2025-06-04T11:30:00.000Z"
}
```

#### TPS Monitoring
```
GET /api/onchain/tps
```

Response:
```json
{
  "success": true,
  "type": "tps_monitoring",
  "data": {
    "timestamp": "2025-06-04T11:30:00.000Z",
    "source": "solana_tracker",
    "currentTps": 2847.5,
    "averageBlockTime": 400,
    "blockHeight": 285647382,
    "totalTransactions": 245837462847,
    "metrics": {
      "tps": 2847.5,
      "blockTime": 400,
      "throughput": 1138900
    }
  },
  "timestamp": "2025-06-04T11:30:00.000Z"
}
```

### Validator Statistics

#### Validator Overview
```
GET /api/onchain/validators
```

Response:
```json
{
  "success": true,
  "type": "validator_stats",
  "data": {
    "source": "solana_tracker",
    "timestamp": "2025-06-04T11:30:00.000Z",
    "overview": {
      "totalValidators": 2156,
      "activeValidators": 1847,
      "averageApy": 6.8,
      "totalStake": 398547283.45,
      "averageCommission": 7.2
    },
    "topValidators": [
      {
        "identity": "7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2",
        "name": "Jito (0)",
        "voteAccount": "GE6atKoWiQ2pt3zL7N13pjNHjdLVys8LinG8qeDxyCrg",
        "commission": 8.0,
        "lastVote": 285647380,
        "activatedStake": 8547283.45,
        "apy": 7.2
      }
    ]
  },
  "timestamp": "2025-06-04T11:30:00.000Z"
}
```

### Staking Information

#### Staking Yields and Rewards
```
GET /api/onchain/staking
```

Response:
```json
{
  "success": true,
  "type": "staking_yields",
  "data": {
    "source": "solana_tracker",
    "timestamp": "2025-06-04T11:30:00.000Z",
    "overview": {
      "averageApy": 6.8,
      "totalStake": 398547283.45,
      "averageCommission": 7.2,
      "activeValidators": 1847
    },
    "epochInfo": {
      "currentEpoch": 647,
      "epochProgress": 67.3,
      "slotsRemaining": 134562,
      "slotIndex": 278438,
      "slotsInEpoch": 432000,
      "absoluteSlot": 285647382
    },
    "yieldDistribution": {
      "highest": 9.5,
      "median": 6.8,
      "lowest": 4.2,
      "topQuartile": 8.1,
      "bottomQuartile": 5.6
    }
  },
  "timestamp": "2025-06-04T11:30:00.000Z"
}
```

### Epoch Information

#### Current Epoch Data
```
GET /api/onchain/epoch
```

Response:
```json
{
  "success": true,
  "type": "epoch_info",
  "data": {
    "source": "solana_tracker",
    "timestamp": "2025-06-04T11:30:00.000Z",
    "currentEpoch": {
      "epoch": 647,
      "slotIndex": 278438,
      "slotsInEpoch": 432000,
      "absoluteSlot": 285647382,
      "blockHeight": 285647382,
      "transactionCount": 45837462,
      "progress": 67.3,
      "slotsRemaining": 134562
    }
  },
  "timestamp": "2025-06-04T11:30:00.000Z"
}
```

### Comprehensive Overview

#### Blockchain Overview
```
GET /api/onchain/overview
```

Response:
```json
{
  "success": true,
  "type": "blockchain_overview",
  "data": {
    "timestamp": "2025-06-04T11:30:00.000Z",
    "source": "solana_tracker",
    "network": {
      "tps": 2847.5,
      "blockHeight": 285647382,
      "totalTransactions": 245837462847,
      "averageBlockTime": 400
    },
    "validators": {
      "total": 2156,
      "active": 1847,
      "averageApy": 6.8,
      "totalStake": 398547283.45,
      "averageCommission": 7.2
    },
    "epoch": {
      "current": 647,
      "progress": 67.3,
      "slotIndex": 278438,
      "slotsInEpoch": 432000,
      "absoluteSlot": 285647382,
      "blockHeight": 285647382,
      "transactionCount": 45837462
    },
    "health": {
      "networkActive": true,
      "validatorsHealthy": true,
      "epochProgressing": true
    }
  },
  "timestamp": "2025-06-04T11:30:00.000Z"
}
```

## Key Metrics Explained

### Transactions Per Second (TPS)
Real-time measure of transaction throughput on the Solana network. Solana is designed for high TPS capacity.

### Block Height
Current block number in the blockchain. Represents the total number of blocks processed.

### Validator Metrics
- **Active Validators**: Currently participating in consensus
- **Total Validators**: All registered validators
- **Average APY**: Annual percentage yield for staking rewards
- **Total Stake**: Total SOL tokens staked across all validators

### Epoch Information
- **Epoch**: Time period for validator rotation and rewards distribution
- **Slot Index**: Current position within the epoch
- **Progress**: Percentage completion of current epoch

### Staking Yields
- **APY Distribution**: Range of returns across different validators
- **Commission Rates**: Fees charged by validators

## Implementation Features

### Service Class Methods

#### Core Network Methods
- `getNetworkMetrics()` - Real-time network statistics
- `getTpsMonitoring()` - TPS and throughput data
- `getValidatorStats()` - Validator information and statistics
- `getStakingYields()` - Staking rewards and yield distribution

#### Epoch and Analytics Methods
- `getEpochInfo()` - Current epoch status and progress
- `getTransactionAnalytics()` - Transaction volume and analytics
- `getBlockchainOverview()` - Comprehensive network overview

### Error Handling

The integration implements comprehensive error handling:

#### Service Unavailable
```json
{
  "success": false,
  "error": "Solana Tracker API service unavailable",
  "timestamp": "2025-06-04T11:30:00.000Z"
}
```

#### API Key Required
```json
{
  "success": false,
  "error": "Bitquery API key not configured",
  "timestamp": "2025-06-04T11:30:00.000Z"
}
```

#### Network Errors
```json
{
  "success": false,
  "error": "Network request failed",
  "timestamp": "2025-06-04T11:30:00.000Z"
}
```

## Configuration

### Required Environment Variables
```bash
# Optional - for enhanced features
BITQUERY_API_KEY=your_bitquery_api_key_here
STAKING_REWARDS_API_KEY=your_staking_rewards_api_key_here
```

### API Key Setup

#### Bitquery API
1. Register at https://bitquery.io/
2. Navigate to API section in dashboard
3. Generate API key
4. Add to environment variables

#### Staking Rewards API
1. Register at https://stakingrewards.com/
2. Access API documentation
3. Generate API key
4. Add to environment variables

## Testing Examples

### Manual Testing
```bash
# Test network metrics
curl "http://localhost:5000/api/onchain/metrics"

# Test TPS monitoring
curl "http://localhost:5000/api/onchain/tps"

# Test validator statistics
curl "http://localhost:5000/api/onchain/validators"

# Test staking information
curl "http://localhost:5000/api/onchain/staking"

# Test epoch information
curl "http://localhost:5000/api/onchain/epoch"

# Test comprehensive overview
curl "http://localhost:5000/api/onchain/overview"
```

### Direct API Testing
```bash
# Test Solana Tracker API (may require authentication)
curl "https://data.solanatracker.io/v1/network"

# Test Bitquery API (requires API key)
curl -X POST https://graphql.bitquery.io \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ solana { blocks(limit: 1) { height } } }"}'
```

## Data Sources and Reliability

### Primary Data Source Priority
1. **Solana Tracker API** - Primary source for network metrics
2. **Bitquery API** - Secondary source for transaction analytics
3. **Solana RPC** - Fallback for basic blockchain queries

### Data Validation
- Cross-reference multiple sources when available
- Implement fallback mechanisms for service outages
- Validate data consistency across sources

## Integration Verification

The Solana on-chain metrics integration has been successfully implemented with:

1. ✅ Complete service class with multiple data sources
2. ✅ Express routes for all blockchain metrics
3. ✅ TypeScript integration in main server
4. ✅ Comprehensive error handling and fallbacks
5. ✅ Standardized response formats
6. ✅ Documentation and testing examples
7. ✅ Support for real-time and historical data

## Usage in Application

### Backend API Access
All endpoints are available at `/api/onchain/*` for programmatic access by frontend components or external applications.

### Data Integration
The on-chain metrics can be combined with:
- TAAPI Pro technical indicators for trading analysis
- LunarCrush social metrics for sentiment correlation
- CryptoRank fundamental data for comprehensive analysis
- OpenAI analysis for AI-powered blockchain insights

## Rate Limits and Performance

### Recommended Usage Patterns
- Cache frequently accessed data (5-10 minutes)
- Batch requests when possible
- Implement exponential backoff for failures
- Monitor API usage limits

### Performance Optimizations
- Parallel requests to multiple sources
- Intelligent fallback mechanisms
- Data aggregation for reduced API calls
- Real-time updates only when necessary

## Security Considerations

- API keys stored securely in environment variables
- No sensitive blockchain data exposed
- Rate limiting implemented to prevent abuse
- Error messages sanitized for security
- Support for authenticated and public endpoints