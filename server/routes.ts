import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint with API key validation
  app.get("/api/health", (req, res) => {
    const apiKeys = {
      TAAPI_API_KEY: !!process.env.TAAPI_API_KEY,
      LUNARCRUSH_API_KEY: !!process.env.LUNARCRUSH_API_KEY,
      CRYPTORANK_API_KEY: !!process.env.CRYPTORANK_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL
    };

    const allConfigured = Object.values(apiKeys).every(Boolean);

    res.json({ 
      status: allConfigured ? 'OK' : 'PARTIAL',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      apiKeys,
      allConfigured
    });
  });

  // LunarCrush API integration - Direct implementation
  app.get("/api/lunarcrush/metrics", async (req, res) => {
    try {
      const { symbol = 'SOL', interval = '1d' } = req.query;
      
      if (!process.env.LUNARCRUSH_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "LunarCrush API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        data: 'assets',
        key: process.env.LUNARCRUSH_API_KEY,
        symbol: symbol as string,
        interval: interval as string
      });

      const response = await fetch(`https://api.lunarcrush.com/v2?${params}`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const solanaData = data.data[0];
        
        const metrics = {
          symbol: solanaData.s || symbol,
          name: solanaData.n || 'Solana',
          price: solanaData.p || null,
          priceChange24h: solanaData.pc || null,
          volume24h: solanaData.v || null,
          marketCap: solanaData.mc || null,
          galaxyScore: solanaData.gs || null,
          altRank: solanaData.acr || null,
          socialVolume: solanaData.sv || null,
          socialScore: solanaData.ss || null,
          socialContributors: solanaData.sc || null,
          socialDominance: solanaData.sd || null,
          marketDominance: solanaData.md || null,
          correlationRank: solanaData.cr || null,
          volatility: solanaData.volatility || null
        };

        res.json({
          success: true,
          type: 'social_metrics',
          symbol,
          interval,
          data: metrics,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No data found for the specified symbol');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/lunarcrush/social", async (req, res) => {
    try {
      if (!process.env.LUNARCRUSH_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "LunarCrush API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        data: 'assets',
        key: process.env.LUNARCRUSH_API_KEY,
        symbol: 'SOL'
      });

      const response = await fetch(`https://api.lunarcrush.com/v2?${params}`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const solana = data.data[0];
        
        const socialMetrics = {
          symbol: 'SOL',
          name: 'Solana',
          socialMetrics: {
            galaxyScore: {
              value: solana.gs,
              description: 'Galaxy Score™ - Overall health and performance metric'
            },
            altRank: {
              value: solana.acr,
              description: 'AltRank™ - Alternative ranking based on social activity'
            },
            socialVolume: {
              value: solana.sv,
              description: 'Total social media mentions and discussions'
            },
            socialScore: {
              value: solana.ss,
              description: 'Social engagement and sentiment score'
            },
            socialContributors: {
              value: solana.sc,
              description: 'Number of unique social contributors'
            },
            socialDominance: {
              value: solana.sd,
              description: 'Social dominance compared to other cryptocurrencies'
            }
          },
          marketMetrics: {
            price: solana.p,
            priceChange24h: solana.pc,
            volume24h: solana.v,
            marketCap: solana.mc,
            marketDominance: solana.md,
            correlationRank: solana.cr,
            volatility: solana.volatility
          }
        };

        res.json({
          success: true,
          type: 'detailed_social_metrics',
          data: socialMetrics,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No social metrics data found for Solana');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // CryptoRank API integration - Direct implementation
  app.get("/api/cryptorank/data", async (req, res) => {
    try {
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "CryptoRank API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_key: process.env.CRYPTORANK_API_KEY
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana?${params}`);
      const data = await response.json();

      if (data.data) {
        const solana = data.data;
        
        const fundamentalData = {
          id: solana.id,
          symbol: solana.symbol,
          name: solana.name,
          slug: solana.slug,
          currentPrice: {
            usd: solana.values?.USD?.price || null,
            btc: solana.values?.BTC?.price || null,
            eth: solana.values?.ETH?.price || null
          },
          marketCap: {
            usd: solana.values?.USD?.marketCap || null,
            rank: solana.values?.USD?.marketCapRank || null
          },
          volume24h: {
            usd: solana.values?.USD?.volume24h || null
          },
          priceChange: {
            percent1h: solana.values?.USD?.percentChange1h || null,
            percent24h: solana.values?.USD?.percentChange24h || null,
            percent7d: solana.values?.USD?.percentChange7d || null,
            percent30d: solana.values?.USD?.percentChange30d || null,
            percent1y: solana.values?.USD?.percentChange1y || null
          },
          supply: {
            circulating: solana.circulatingSupply || null,
            total: solana.totalSupply || null,
            max: solana.maxSupply || null
          },
          allTimeHigh: {
            price: solana.values?.USD?.athPrice || null,
            date: solana.values?.USD?.athDate || null,
            percentFromAth: solana.values?.USD?.percentFromAth || null
          },
          allTimeLow: {
            price: solana.values?.USD?.atlPrice || null,
            date: solana.values?.USD?.atlDate || null,
            percentFromAtl: solana.values?.USD?.percentFromAtl || null
          }
        };

        res.json({
          success: true,
          type: 'fundamental_data',
          data: fundamentalData,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No fundamental data found for Solana');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/historical", async (req, res) => {
    try {
      const { timeframe = '30d', currency = 'USD' } = req.query;
      
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "CryptoRank API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_key: process.env.CRYPTORANK_API_KEY,
        timeframe: timeframe as string,
        currency: currency as string
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana/chart?${params}`);
      const data = await response.json();

      if (data.data) {
        const historicalData = {
          symbol: 'SOL',
          currency,
          timeframe,
          prices: data.data.map((point: any) => ({
            timestamp: point.timestamp,
            date: new Date(point.timestamp * 1000).toISOString(),
            price: point.price,
            volume: point.volume || null,
            marketCap: point.marketCap || null
          })),
          metadata: {
            totalPoints: data.data.length,
            startDate: data.data.length > 0 ? new Date(data.data[0].timestamp * 1000).toISOString() : null,
            endDate: data.data.length > 0 ? new Date(data.data[data.data.length - 1].timestamp * 1000).toISOString() : null
          }
        };

        res.json({
          success: true,
          type: 'historical_prices',
          timeframe,
          currency,
          data: historicalData,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No historical data found for Solana');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/stats", async (req, res) => {
    try {
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "CryptoRank API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_key: process.env.CRYPTORANK_API_KEY
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana?${params}`);
      const data = await response.json();

      if (data.data) {
        const solana = data.data;
        
        const marketStats = {
          symbol: 'SOL',
          name: 'Solana',
          marketMetrics: {
            rank: solana.values?.USD?.marketCapRank || null,
            marketCap: solana.values?.USD?.marketCap || null,
            volume24h: solana.values?.USD?.volume24h || null,
            volumeMarketCapRatio: solana.values?.USD?.volume24h && solana.values?.USD?.marketCap ? 
              (solana.values.USD.volume24h / solana.values.USD.marketCap) : null,
            circulatingSupply: solana.circulatingSupply || null,
            totalSupply: solana.totalSupply || null,
            maxSupply: solana.maxSupply || null,
            supplyPercentage: solana.circulatingSupply && solana.totalSupply ? 
              (solana.circulatingSupply / solana.totalSupply * 100) : null
          },
          priceMetrics: {
            currentPrice: solana.values?.USD?.price || null,
            athPrice: solana.values?.USD?.athPrice || null,
            athDate: solana.values?.USD?.athDate || null,
            percentFromAth: solana.values?.USD?.percentFromAth || null,
            atlPrice: solana.values?.USD?.atlPrice || null,
            atlDate: solana.values?.USD?.atlDate || null,
            percentFromAtl: solana.values?.USD?.percentFromAtl || null
          },
          performanceMetrics: {
            change1h: solana.values?.USD?.percentChange1h || null,
            change24h: solana.values?.USD?.percentChange24h || null,
            change7d: solana.values?.USD?.percentChange7d || null,
            change30d: solana.values?.USD?.percentChange30d || null,
            change1y: solana.values?.USD?.percentChange1y || null
          }
        };

        res.json({
          success: true,
          type: 'market_statistics',
          data: marketStats,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No market statistics found for Solana');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/price", async (req, res) => {
    try {
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "CryptoRank API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_key: process.env.CRYPTORANK_API_KEY
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana?${params}`);
      const data = await response.json();

      if (data.data) {
        const solana = data.data;
        
        const priceData = {
          symbol: 'SOL',
          name: 'Solana',
          prices: {
            usd: solana.values?.USD?.price || null,
            btc: solana.values?.BTC?.price || null,
            eth: solana.values?.ETH?.price || null
          },
          changes: {
            percent1h: solana.values?.USD?.percentChange1h || null,
            percent24h: solana.values?.USD?.percentChange24h || null,
            percent7d: solana.values?.USD?.percentChange7d || null
          },
          volume: {
            usd24h: solana.values?.USD?.volume24h || null
          },
          marketCap: {
            usd: solana.values?.USD?.marketCap || null,
            rank: solana.values?.USD?.marketCapRank || null
          },
          lastUpdated: solana.lastUpdated || new Date().toISOString()
        };

        res.json({
          success: true,
          type: 'real_time_price',
          data: priceData,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No real-time price data found for Solana');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Solana TAAPI Pro integration - Direct implementation
  app.get("/api/solana/rsi", async (req, res) => {
    try {
      const { exchange = 'binance', interval = '1h', period = 14 } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "TAAPI API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        secret: process.env.TAAPI_API_KEY,
        exchange: exchange as string,
        symbol: 'SOL/USDT',
        interval: interval as string,
        period: period.toString()
      });

      const response = await fetch(`https://api.taapi.io/rsi?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        indicator: 'RSI',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        period: parseInt(period as string),
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/solana/macd", async (req, res) => {
    try {
      const { 
        exchange = 'binance', 
        interval = '1h', 
        fastPeriod = 12, 
        slowPeriod = 26, 
        signalPeriod = 9 
      } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "TAAPI API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        secret: process.env.TAAPI_API_KEY,
        exchange: exchange as string,
        symbol: 'SOL/USDT',
        interval: interval as string,
        fast_period: fastPeriod.toString(),
        slow_period: slowPeriod.toString(),
        signal_period: signalPeriod.toString()
      });

      const response = await fetch(`https://api.taapi.io/macd?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        indicator: 'MACD',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        parameters: {
          fastPeriod: parseInt(fastPeriod as string),
          slowPeriod: parseInt(slowPeriod as string),
          signalPeriod: parseInt(signalPeriod as string)
        },
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/solana/ema", async (req, res) => {
    try {
      const { exchange = 'binance', interval = '1h', period = 20 } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "TAAPI API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        secret: process.env.TAAPI_API_KEY,
        exchange: exchange as string,
        symbol: 'SOL/USDT',
        interval: interval as string,
        period: period.toString()
      });

      const response = await fetch(`https://api.taapi.io/ema?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        indicator: 'EMA',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        period: parseInt(period as string),
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/solana/analysis", async (req, res) => {
    try {
      const { exchange = 'binance', interval = '1h' } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "TAAPI API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      // Fetch multiple indicators for comprehensive analysis
      const indicators = ['rsi', 'macd', 'ema', 'sma'];
      const params = new URLSearchParams({
        secret: process.env.TAAPI_API_KEY,
        exchange: exchange as string,
        symbol: 'SOL/USDT',
        interval: interval as string,
        indicators: indicators.join(',')
      });

      const response = await fetch(`https://api.taapi.io/bulk?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        type: 'comprehensive_analysis',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        indicators,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Trading API endpoints
  app.get("/api/trading/test", (req, res) => {
    res.json({
      success: true,
      message: "Trading API endpoint is working",
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        "/api/trading/indicators/:symbol",
        "/api/trading/social/:symbol", 
        "/api/trading/market/:symbol",
        "/api/trading/ai-analysis",
        "/api/solana/rsi",
        "/api/solana/macd",
        "/api/solana/ema",
        "/api/solana/analysis"
      ]
    });
  });

  // Technical indicators endpoint
  app.get("/api/trading/indicators/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const { exchange = 'binance', interval = '1h' } = req.query;

    if (!process.env.TAAPI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "TAAPI API key not configured",
        timestamp: new Date().toISOString()
      });
    }

    try {
      const params = new URLSearchParams({
        secret: process.env.TAAPI_API_KEY,
        exchange: exchange as string,
        symbol,
        interval: interval as string
      });

      const response = await fetch(`https://api.taapi.io/rsi?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        symbol,
        exchange,
        interval,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Social metrics endpoint
  app.get("/api/trading/social/:symbol", async (req, res) => {
    const { symbol } = req.params;

    if (!process.env.LUNARCRUSH_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "LunarCrush API key not configured",
        timestamp: new Date().toISOString()
      });
    }

    try {
      const params = new URLSearchParams({
        data: 'assets',
        key: process.env.LUNARCRUSH_API_KEY,
        symbol
      });

      const response = await fetch(`https://api.lunarcrush.com/v2?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        symbol,
        data: data.data?.[0] || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Market data endpoint
  app.get("/api/trading/market/:symbol", async (req, res) => {
    const { symbol } = req.params;

    if (!process.env.CRYPTORANK_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "CryptoRank API key not configured",
        timestamp: new Date().toISOString()
      });
    }

    try {
      const response = await fetch(`https://api.cryptorank.io/v1/currencies/${symbol}`, {
        headers: {
          'X-API-KEY': process.env.CRYPTORANK_API_KEY
        }
      });
      const data = await response.json();

      res.json({
        success: true,
        symbol,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // AI analysis endpoint
  app.post("/api/trading/ai-analysis", async (req, res) => {
    const { marketData, symbol } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "OpenAI API key not configured",
        timestamp: new Date().toISOString()
      });
    }

    if (!marketData || !symbol) {
      return res.status(400).json({
        success: false,
        error: "Market data and symbol are required",
        timestamp: new Date().toISOString()
      });
    }

    try {
      const prompt = `Analyze the following market data for ${symbol}:

${JSON.stringify(marketData, null, 2)}

Provide a brief analysis including:
1. Overall sentiment (bullish/bearish/neutral)
2. Key technical signals
3. Risk assessment

Keep response concise and professional.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional cryptocurrency market analyst.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      const aiData = await response.json();

      res.json({
        success: true,
        symbol,
        analysis: aiData.choices[0].message.content,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
