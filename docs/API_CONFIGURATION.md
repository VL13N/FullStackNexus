# API Configuration Guide

## Environment Variables Setup

Your full-stack JavaScript application is now configured with the following API integrations:

### Trading & Market Data APIs

#### TAAPI_API_KEY
- **Service**: Technical Analysis API (taapi.io)
- **Purpose**: Real-time technical indicators (RSI, MACD, SMA, etc.)
- **Status**: ✅ Configured and Working
- **Free Plan Limitations**: Limited to BTC/USDT, ETH/USDT, XRP/USDT, LTC/USDT, XMR/USDT on Binance
- **Endpoints**: `/api/trading/indicators/:symbol`

#### LUNARCRUSH_API_KEY
- **Service**: LunarCrush Social Intelligence
- **Purpose**: Social sentiment, influencer data, community metrics
- **Status**: ✅ Configured
- **Endpoints**: `/api/trading/social/:symbol`, `/api/trading/influencers/:symbol`

#### CRYPTORANK_API_KEY
- **Service**: CryptoRank Market Data
- **Purpose**: Cryptocurrency rankings, market data, historical prices
- **Status**: ✅ Configured
- **Endpoints**: `/api/trading/market/:symbol`, `/api/trading/historical/:symbol`

#### OPENAI_API_KEY
- **Service**: OpenAI GPT Models
- **Purpose**: AI-powered market analysis, trading strategy generation
- **Status**: ✅ Configured
- **Endpoints**: `/api/trading/ai-analysis`

## Available API Endpoints

### Health Check
```
GET /api/health
```
Returns API configuration status and environment information.

### Trading Data
```
GET /api/trading/test
GET /api/trading/indicators/:symbol?exchange=binance&interval=1h
GET /api/trading/social/:symbol
GET /api/trading/market/:symbol
POST /api/trading/ai-analysis
```

## Frontend Integration

### Environment Variables Access
The frontend can access environment variables through:
- `import.meta.env.VITE_*` for client-side variables
- Backend API calls for secure server-side data

### Trading Dashboard
- Navigate to `/trading` to access the trading dashboard
- Real-time API status monitoring
- Interactive data fetching interface
- AI-powered analysis integration

## Security Notes

1. **API Keys**: All sensitive API keys are stored securely in environment variables
2. **Backend Only**: Trading API keys are only accessible from the backend server
3. **Error Handling**: Proper error responses when API keys are missing or invalid
4. **Rate Limiting**: Built-in protection against API rate limits

## Usage Examples

### Technical Indicators
```javascript
// Get RSI for Bitcoin
fetch('/api/trading/indicators/BTCUSDT?exchange=binance&interval=1h')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Social Metrics
```javascript
// Get social sentiment for Bitcoin
fetch('/api/trading/social/BTC')
  .then(res => res.json())
  .then(data => console.log(data));
```

### AI Analysis
```javascript
// Get AI-powered market analysis
fetch('/api/trading/ai-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'BTC',
    marketData: { /* market data object */ }
  })
}).then(res => res.json());
```

## Troubleshooting

### Common Issues
1. **503 Service Unavailable**: API key not configured
2. **Rate Limit Errors**: API usage limits exceeded
3. **Invalid Symbol**: Use correct trading pair format (e.g., BTCUSDT)

### Free Plan Limitations
- TAAPI: Limited symbols on free plan
- LunarCrush: Request rate limits
- CryptoRank: Daily request quotas
- OpenAI: Token usage limits

## Next Steps

1. Test all API endpoints through the trading dashboard
2. Monitor API usage and upgrade plans as needed
3. Implement error handling for rate limits
4. Add real-time data streaming capabilities
5. Expand AI analysis features

## API Status Dashboard

Visit `/trading` in your application to:
- Check real-time API configuration status
- Test individual API endpoints
- View live market data
- Generate AI-powered analysis