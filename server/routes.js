import { createServer } from "http";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("Supabase client initialized successfully");
} else {
  console.warn("Supabase credentials not found - database endpoints will be unavailable");
}

console.log("TAAPI key in use:", process.env.TAAPI_API_KEY);
if (!process.env.TAAPI_API_KEY) {
  throw new Error("TAAPI_API_KEY is undefined—check Replit Secrets and restart.");
}

export async function registerRoutes(app) {
  // Prediction endpoints
  app.get("/api/predictions/latest", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: "Database not available",
          timestamp: new Date().toISOString()
        });
      }

      const { data, error } = await supabase
        .from('live_predictions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: data[0] || null,
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

  app.get("/api/predictions/history", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: "Database not available",
          timestamp: new Date().toISOString()
        });
      }

      const limit = parseInt(req.query.limit) || 24;
      
      const { data, error } = await supabase
        .from('live_predictions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: data || [],
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

  // Endpoint to trigger manual prediction generation
  app.post("/api/predictions/generate", async (req, res) => {
    try {
      const { generateFreshPrediction } = await import('../scripts/generatePrediction.js');
      const prediction = await generateFreshPrediction();
      
      res.json({
        success: true,
        message: "Prediction generated successfully",
        data: prediction,
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

  // Basic API endpoints for data sources
  app.get("/api/cryptorank/data", async (req, res) => {
    try {
      const { CryptoRankService } = await import('../api/cryptorank.js');
      const service = new CryptoRankService();
      const data = await service.getSolanaData();
      
      res.json({
        success: true,
        type: "fundamental_data",
        data: data,
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

  app.get("/api/lunarcrush/metrics", async (req, res) => {
    try {
      const { LunarCrushService } = await import('../api/lunarcrush.js');
      const service = new LunarCrushService();
      const data = await service.getSolanaMetrics();
      
      res.json({
        success: true,
        type: "social_metrics",
        data: data,
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

  app.get("/api/astrology/moon-phase", async (req, res) => {
    try {
      const { AstrologyService } = await import('../api/astrology.js');
      const service = new AstrologyService();
      const data = service.getMoonPhase();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        source: "astronomy-engine",
        moonPhase: data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Add basic routes for other data sources
  app.get("/api/news/recent", async (req, res) => {
    res.json({
      success: true,
      data: [],
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/updates/today", async (req, res) => {
    res.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}