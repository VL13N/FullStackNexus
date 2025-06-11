import express from 'express';
import { makeV2Request } from '../cryptorank.js';

const router = express.Router();

/**
 * Get market sentiment indicators (BTC Dominance and Fear & Greed Index)
 */
router.get('/api/market-sentiment', async (_req, res) => {
  try {
    // Fetch data from both APIs in parallel
    const [cryptoRankResponse, fearGreedResponse] = await Promise.all([
      makeV2Request('global'),
      fetch('https://api.alternative.me/fng/?limit=1')
        .then(r => r.json())
        .catch(err => {
          console.warn('Fear & Greed API failed:', err.message);
          return { data: [{ value: null }] }; // Graceful fallback
        })
    ]);

    const btcDominance = cryptoRankResponse?.data?.btcDominance || null;
    const fearGreedIndex = fearGreedResponse?.data?.[0]?.value ? 
      Number(fearGreedResponse.data[0].value) : null;

    res.json({
      success: true,
      btcDominance,
      fearGreedIndex,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Market sentiment API error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;