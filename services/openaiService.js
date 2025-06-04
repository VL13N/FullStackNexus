// OpenAI API Service for AI-powered features

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
  }

  async makeRequest(endpoint, data) {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  // Market Analysis using GPT
  async analyzeMarketData(marketData, symbol) {
    const prompt = `Analyze the following market data for ${symbol}:

Technical Indicators:
${JSON.stringify(marketData.technical, null, 2)}

Social Metrics:
${JSON.stringify(marketData.social, null, 2)}

Market Data:
${JSON.stringify(marketData.market, null, 2)}

Please provide:
1. Overall market sentiment (bullish/bearish/neutral)
2. Key technical signals
3. Social sentiment analysis
4. Risk assessment
5. Trading recommendations

Keep the analysis professional and data-driven.`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional cryptocurrency market analyst with expertise in technical analysis, social sentiment, and risk management.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    return response.choices[0].message.content;
  }

  // Trading Strategy Generation
  async generateTradingStrategy(symbol, timeframe, riskTolerance = 'medium') {
    const prompt = `Generate a comprehensive trading strategy for ${symbol} with ${timeframe} timeframe and ${riskTolerance} risk tolerance.

Include:
1. Entry conditions
2. Exit conditions
3. Stop loss levels
4. Take profit targets
5. Position sizing recommendations
6. Risk management rules

Provide specific, actionable guidelines that can be implemented programmatically.`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert algorithmic trading strategist specializing in cryptocurrency markets.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.2
    });

    return response.choices[0].message.content;
  }

  // News Sentiment Analysis
  async analyzeNewsSentiment(newsArticles) {
    const prompt = `Analyze the sentiment of these cryptocurrency news articles and provide an overall market sentiment score:

${newsArticles.map((article, index) => 
  `${index + 1}. ${article.title}\n${article.description || article.content}\n`
).join('\n')}

Provide:
1. Overall sentiment score (-1 to +1)
2. Key themes identified
3. Impact assessment on market
4. Confidence level of analysis`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a financial news sentiment analyst specializing in cryptocurrency markets.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.1
    });

    return response.choices[0].message.content;
  }

  // Risk Assessment
  async assessPortfolioRisk(portfolio, marketConditions) {
    const prompt = `Assess the risk profile of this cryptocurrency portfolio:

Portfolio:
${JSON.stringify(portfolio, null, 2)}

Market Conditions:
${JSON.stringify(marketConditions, null, 2)}

Provide:
1. Overall risk score (1-10)
2. Diversification analysis
3. Correlation risks
4. Recommended adjustments
5. Hedge recommendations`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a quantitative risk analyst specializing in cryptocurrency portfolio management.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });

    return response.choices[0].message.content;
  }

  // Price Prediction Analysis
  async analyzePricePrediction(historicalData, technicalIndicators, symbol) {
    const prompt = `Based on the following data for ${symbol}, provide a technical analysis and price outlook:

Historical Price Data (last 30 points):
${JSON.stringify(historicalData.slice(-30), null, 2)}

Technical Indicators:
${JSON.stringify(technicalIndicators, null, 2)}

Analyze:
1. Support and resistance levels
2. Trend analysis
3. Momentum indicators
4. Volume analysis
5. Short-term price targets (1 day, 1 week)
6. Confidence levels

Base analysis purely on technical data provided.`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a technical analyst who provides data-driven price analysis based on charts and indicators only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.3
    });

    return response.choices[0].message.content;
  }

  // Trading Signal Explanation
  async explainTradingSignal(signal, marketData) {
    const prompt = `Explain this trading signal in detail:

Signal: ${signal.action} ${signal.symbol} at ${signal.price}
Confidence: ${signal.confidence}
Reasoning: ${signal.reasoning}

Market Context:
${JSON.stringify(marketData, null, 2)}

Provide:
1. Clear explanation of the signal
2. Why this signal was generated
3. Risk factors to consider
4. Expected outcome probability
5. Alternative scenarios`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a trading signal analyst who explains algorithmic trading decisions in clear, educational terms.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.4
    });

    return response.choices[0].message.content;
  }

  // Generate Trading Report
  async generateDailyReport(marketSummary, portfolioPerformance, signals) {
    const prompt = `Generate a comprehensive daily trading report:

Market Summary:
${JSON.stringify(marketSummary, null, 2)}

Portfolio Performance:
${JSON.stringify(portfolioPerformance, null, 2)}

Trading Signals:
${JSON.stringify(signals, null, 2)}

Structure the report with:
1. Executive Summary
2. Market Overview
3. Portfolio Performance Analysis
4. Active Signals Review
5. Risk Assessment
6. Tomorrow's Outlook
7. Action Items

Make it professional and actionable for traders.`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional trading report writer who creates comprehensive, actionable market reports.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    return response.choices[0].message.content;
  }
}

export default new OpenAIService();