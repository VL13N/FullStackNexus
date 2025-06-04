// services/openaiIntegration.js
/**
 * OpenAI Integration Service for Phase 7
 * Handles news sentiment analysis and daily market predictions
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Analyze news sentiment using OpenAI GPT-4
 */
export async function analyzeNewsSentiment(articles) {
  if (!articles || articles.length === 0) {
    return { error: 'No articles provided for analysis' };
  }

  try {
    const articlesText = articles.map(article => 
      `Title: ${article.title}\nContent: ${article.content || article.summary || 'No content'}`
    ).join('\n\n---\n\n');

    const prompt = `
Analyze the sentiment of these Solana-related news articles. For each article, provide:

1. Overall sentiment: positive, negative, or neutral
2. Sentiment score: -1.0 (very negative) to 1.0 (very positive)
3. Confidence level: 0.0 to 1.0
4. Key sentiment drivers (3-5 words)

Articles:
${articlesText}

Respond in JSON format:
{
  "articles": [
    {
      "sentiment": "positive|negative|neutral",
      "score": 0.5,
      "confidence": 0.8,
      "drivers": ["adoption", "price", "ecosystem"]
    }
  ],
  "overall_sentiment": "positive",
  "overall_score": 0.3,
  "market_impact": "bullish|bearish|neutral"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional cryptocurrency market analyst specializing in sentiment analysis. Provide accurate, unbiased sentiment scores based on factual content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    let responseContent = response.choices[0].message.content;
    
    // Extract JSON from response if wrapped in markdown or other text
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseContent = jsonMatch[0];
    }
    
    const analysis = JSON.parse(responseContent);
    
    // Store sentiment data in database
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const sentiment = analysis.articles[i];
      
      await supabase
        .from('news_sentiment')
        .insert({
          article_title: article.title,
          article_content: article.content || article.summary,
          sentiment_score: sentiment.score,
          sentiment_label: sentiment.sentiment,
          confidence_score: sentiment.confidence,
          source: article.source || 'LunarCrush',
          published_at: article.published_at || new Date().toISOString()
        });
    }

    return {
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('OpenAI sentiment analysis error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generate daily market analysis using comprehensive data
 */
export async function generateDailyAnalysis(marketData) {
  try {
    const {
      technicalData = {},
      fundamentalData = {},
      socialData = {},
      onChainData = {},
      astrologicalData = {},
      newssentiment = {}
    } = marketData;

    const prompt = `
As a professional Solana market analyst, provide a comprehensive daily analysis based on this data:

TECHNICAL INDICATORS:
- RSI: ${technicalData.rsi || 'N/A'}
- MACD: ${technicalData.macdHistogram || 'N/A'} 
- EMA 200: ${technicalData.ema200 || 'N/A'}
- Price: $${fundamentalData.currentPrice || 'N/A'}

FUNDAMENTAL DATA:
- Market Cap: $${fundamentalData.marketCap || 'N/A'}
- 24h Volume: $${fundamentalData.volume24h || 'N/A'}
- 24h Change: ${fundamentalData.priceChange24h || 'N/A'}%

SOCIAL METRICS:
- Galaxy Score: ${socialData.galaxyScore || 'N/A'}
- Social Volume: ${socialData.socialVolume || 'N/A'}
- AltRank: ${socialData.altRank || 'N/A'}

ON-CHAIN DATA:
- Active Validators: ${onChainData.activeValidators || 'N/A'}
- Average APY: ${onChainData.averageApy || 'N/A'}%
- Total Stake: ${onChainData.totalStake || 'N/A'} SOL

ASTROLOGICAL INFLUENCES:
- Moon Phase: ${astrologicalData.moonPhaseName || 'N/A'}
- Planetary Aspects: ${astrologicalData.majorAspectsCount || 'N/A'}

NEWS SENTIMENT:
- Overall Sentiment: ${newssentiment.overall_sentiment || 'neutral'}
- Sentiment Score: ${newssentiment.overall_score || '0.0'}

Provide analysis in JSON format:
{
  "overall_sentiment": "bullish|bearish|neutral",
  "confidence_level": "high|medium|low",
  "price_prediction": "Brief prediction with target range",
  "key_insights": ["insight1", "insight2", "insight3"],
  "market_drivers": ["driver1", "driver2"],
  "risk_factors": ["risk1", "risk2"],
  "recommendation": "buy|hold|sell",
  "time_horizon": "24h outlook"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a senior cryptocurrency market analyst with expertise in technical analysis, fundamental analysis, social sentiment, and market psychology. Provide professional, actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 1000
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    // Store daily analysis in database
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('daily_market_analysis')
      .upsert({
        analysis_date: today,
        overall_sentiment: analysis.overall_sentiment,
        key_insights: analysis.key_insights,
        price_prediction: analysis.price_prediction,
        confidence_level: analysis.confidence_level,
        market_drivers: analysis.market_drivers,
        risk_factors: analysis.risk_factors
      });

    return {
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('OpenAI daily analysis error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get historical sentiment trends from database
 */
export async function getSentimentTrends(days = 7) {
  try {
    const { data, error } = await supabase
      .from('news_sentiment')
      .select('sentiment_score, sentiment_label, analyzed_at')
      .gte('analyzed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('analyzed_at', { ascending: true });

    if (error) throw error;

    // Calculate daily averages
    const dailyAverages = {};
    data.forEach(row => {
      const date = row.analyzed_at.split('T')[0];
      if (!dailyAverages[date]) {
        dailyAverages[date] = { scores: [], count: 0 };
      }
      dailyAverages[date].scores.push(row.sentiment_score);
      dailyAverages[date].count++;
    });

    const trends = Object.entries(dailyAverages).map(([date, data]) => ({
      date,
      average_score: data.scores.reduce((a, b) => a + b, 0) / data.count,
      article_count: data.count
    }));

    return {
      success: true,
      trends,
      summary: {
        total_articles: data.length,
        avg_sentiment: data.reduce((acc, row) => acc + row.sentiment_score, 0) / data.length,
        period_days: days
      }
    };

  } catch (error) {
    console.error('Sentiment trends error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get latest daily analysis from database
 */
export async function getLatestAnalysis() {
  try {
    const { data, error } = await supabase
      .from('daily_market_analysis')
      .select('*')
      .order('analysis_date', { ascending: false })
      .limit(1);

    if (error) throw error;

    return {
      success: true,
      analysis: data[0] || null,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Get latest analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}