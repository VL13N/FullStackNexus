/**
 * News Sentiment Analysis API Routes
 * Endpoints for fetching news, analyzing sentiment, and retrieving sentiment features
 */

import express from 'express';
import NewsSentimentService from '../services/newsSentiment.js';

const router = express.Router();
const sentimentService = new NewsSentimentService();

/**
 * GET /api/sentiment/news
 * Fetch latest SOL-related news headlines
 */
router.get('/news', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    console.log(`Fetching SOL news headlines (limit: ${limit})`);

    const headlines = await sentimentService.fetchSOLNews(parseInt(limit));
    
    res.json({
      success: true,
      headlines: headlines,
      count: headlines.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/sentiment/analyze
 * Analyze sentiment for provided headlines or fetch and analyze latest news
 */
router.post('/analyze', async (req, res) => {
  try {
    const { headlines, fetch_latest = true, limit = 15 } = req.body;

    console.log(`Starting sentiment analysis (fetch_latest: ${fetch_latest})`);

    let newsHeadlines = headlines;
    
    if (fetch_latest || !newsHeadlines) {
      newsHeadlines = await sentimentService.fetchSOLNews(parseInt(limit));
    }

    if (!newsHeadlines || newsHeadlines.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No headlines available for sentiment analysis',
        timestamp: new Date().toISOString()
      });
    }

    const analysis = await sentimentService.analyzeBatchSentiment(newsHeadlines);
    
    if (analysis.success) {
      res.json({
        success: true,
        data: analysis.data,
        message: `Analyzed sentiment for ${analysis.data.headlines_analyzed} headlines`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: analysis.error,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/sentiment/features
 * Get sentiment features for ML pipeline
 */
router.get('/features', async (req, res) => {
  try {
    console.log('Retrieving sentiment features for ML pipeline');

    const features = sentimentService.getSentimentFeatures();
    
    res.json({
      success: true,
      features: features,
      description: {
        news_sentiment_24h: 'Overall sentiment score from -1 to 1 based on last 24h news',
        news_confidence_24h: 'Average confidence of sentiment analysis (0-1)',
        news_volume_24h: 'Number of news articles analyzed in last 24h',
        sentiment_trend_6h: 'Sentiment trend over last 6 hours (-1 to 1)',
        positive_news_ratio: 'Ratio of positive news articles (0-1)',
        negative_news_ratio: 'Ratio of negative news articles (0-1)'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sentiment features error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/sentiment/history
 * Get historical sentiment analysis results
 */
router.get('/history', async (req, res) => {
  try {
    const { hours = 24, limit = 10 } = req.query;

    console.log(`Retrieving sentiment history (${hours}h, limit: ${limit})`);

    const history = sentimentService.getRecentSentiment(parseInt(hours));
    
    res.json({
      success: true,
      history: history.slice(0, parseInt(limit)),
      total_entries: history.length,
      period_hours: parseInt(hours),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sentiment history error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/sentiment/current
 * Get current sentiment analysis with fresh news fetch
 */
router.get('/current', async (req, res) => {
  try {
    const { limit = 15 } = req.query;

    console.log(`Getting current sentiment analysis (limit: ${limit})`);

    // Fetch latest news
    const headlines = await sentimentService.fetchSOLNews(parseInt(limit));
    
    if (headlines.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No news headlines available',
        timestamp: new Date().toISOString()
      });
    }

    // Analyze sentiment
    const analysis = await sentimentService.analyzeBatchSentiment(headlines);
    
    if (analysis.success) {
      // Get features for ML
      const features = sentimentService.getSentimentFeatures();
      
      res.json({
        success: true,
        sentiment_analysis: analysis.data,
        ml_features: features,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: analysis.error,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Current sentiment error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/sentiment/single
 * Analyze sentiment for a single headline
 */
router.post('/single', async (req, res) => {
  try {
    const { headline } = req.body;

    if (!headline) {
      return res.status(400).json({
        success: false,
        error: 'Headline text is required',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`Analyzing single headline sentiment`);

    const sentiment = await sentimentService.computeSentimentScore(headline);
    
    res.json({
      success: true,
      headline: headline,
      sentiment: sentiment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Single sentiment analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/sentiment/cache
 * Clear sentiment analysis cache
 */
router.delete('/cache', async (req, res) => {
  try {
    sentimentService.clearCache();
    
    res.json({
      success: true,
      message: 'Sentiment cache cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/sentiment/sources
 * Get breakdown of sentiment by news source
 */
router.get('/sources', async (req, res) => {
  try {
    const { hours = 24 } = req.query;

    console.log(`Getting sentiment breakdown by source (${hours}h)`);

    const history = sentimentService.getRecentSentiment(parseInt(hours));
    
    if (history.length === 0) {
      return res.json({
        success: true,
        sources: {},
        message: 'No sentiment data available for the specified period',
        timestamp: new Date().toISOString()
      });
    }

    // Get the most recent analysis for source breakdown
    const latest = history[0];
    
    res.json({
      success: true,
      sources: latest.source_breakdown,
      analysis_timestamp: latest.timestamp,
      period_hours: parseInt(hours),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Source breakdown error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;