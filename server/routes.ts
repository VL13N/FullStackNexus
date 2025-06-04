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
        "/api/trading/ai-analysis"
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
