import { createServer } from "http";
import { createClient } from "@supabase/supabase-js";
import mlPredictor from "./ml/predictor.js";
import { alertManager, alertTemplates } from "./alerts/alerting.js";

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log("Supabase configuration available");
  
  // Quick persistence check
  (async () => {
    try {
      const { error } = await supabase.from('live_predictions').select('id').limit(1);
      if (!error) {
        console.log('Persistence check: Database connection successful');
      } else {
        console.warn('Persistence check failed:', error.message);
      }
    } catch (err) {
      console.warn('Persistence check error:', err.message);
    }
  })();
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

  app.get("/api/predictions/live", async (req, res) => {
    try {
      const predictionService = await import('../services/prediction.js');
      const result = await predictionService.runPredictionLive();
      
      res.json({
        success: true,
        prediction: result.prediction,
        confidence: result.confidence,
        category: result.category,
        timestamp: result.timestamp,
        pillarScores: {
          technical: result.pillarScores?.technical || 50,
          social: result.pillarScores?.social || 50,
          fundamental: result.pillarScores?.fundamental || 50,
          astrology: result.pillarScores?.astrology || 50
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Live prediction failed",
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.post("/api/predictions/trigger", async (req, res) => {
    try {
      const predictionService = await import('../services/prediction.js');
      const result = await predictionService.runPredictionLive();
      
      res.json({
        success: true,
        message: "Prediction triggered successfully",
        result: {
          prediction: result.prediction,
          confidence: result.confidence,
          category: result.category,
          timestamp: result.timestamp
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to trigger prediction",
        details: error.message
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

  // Configuration endpoints
  app.get("/api/config/scheduler", async (req, res) => {
    res.json({
      success: true,
      config: {
        predictionInterval: process.env.PREDICTION_INTERVAL_MINUTES || 15,
        healthCheckInterval: process.env.HEALTH_CHECK_INTERVAL_MINUTES || 15,
        dashboardRefreshInterval: process.env.DASHBOARD_REFRESH_SECONDS || 30,
        maxRetryAttempts: process.env.MAX_RETRY_ATTEMPTS || 3
      },
      timestamp: new Date().toISOString()
    });
  });

  app.post("/api/config/scheduler", async (req, res) => {
    try {
      const { predictionInterval, healthCheckInterval, dashboardRefreshInterval, maxRetryAttempts } = req.body;
      
      // Store configuration (in production, this would persist to database)
      const config = {
        predictionInterval: predictionInterval || 15,
        healthCheckInterval: healthCheckInterval || 15,
        dashboardRefreshInterval: dashboardRefreshInterval || 30,
        maxRetryAttempts: maxRetryAttempts || 3,
        updatedAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: "Configuration updated successfully",
        config,
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

  // Error monitoring endpoint
  app.get("/api/system/errors", async (req, res) => {
    try {
      const { errorHandler } = await import('../utils/errorHandler.js');
      const summary = errorHandler.getErrorSummary();
      
      res.json({
        success: true,
        data: summary,
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

  // Backtest endpoint for model performance analysis
  app.get("/api/analytics/backtest", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: "Database not available for backtesting",
          timestamp: new Date().toISOString()
        });
      }

      const days = parseInt(req.query.days) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('live_predictions')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      // Analyze prediction patterns and accuracy trends
      const analysis = {
        totalPredictions: data.length,
        confidenceStats: {
          average: data.reduce((sum, p) => sum + p.confidence, 0) / data.length,
          min: Math.min(...data.map(p => p.confidence)),
          max: Math.max(...data.map(p => p.confidence))
        },
        categoryDistribution: {
          BULLISH: data.filter(p => p.category === 'BULLISH').length,
          BEARISH: data.filter(p => p.category === 'BEARISH').length,
          NEUTRAL: data.filter(p => p.category === 'NEUTRAL').length
        },
        pillarContributions: {
          technical: data.reduce((sum, p) => sum + p.tech_score, 0) / data.length,
          social: data.reduce((sum, p) => sum + p.social_score, 0) / data.length,
          fundamental: data.reduce((sum, p) => sum + p.fund_score, 0) / data.length,
          astrology: data.reduce((sum, p) => sum + p.astro_score, 0) / data.length
        }
      };

      res.json({
        success: true,
        data: analysis,
        predictions: data,
        timeframe: `${days} days`,
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

  // ML Prediction Endpoints
  app.post("/api/ml/predict", async (req, res) => {
    try {
      const features = req.body;
      
      if (!features || typeof features !== 'object') {
        return res.status(400).json({
          success: false,
          error: "Invalid feature data. Expected object with numeric features.",
          required_features: [
            'rsi_1h', 'macd_histogram', 'ema_20', 
            'market_cap_usd', 'volume_24h_usd', 
            'social_score', 'astro_score'
          ]
        });
      }

      const prediction = await mlPredictor.predict(features);
      
      res.json({
        success: true,
        ...prediction,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('ML prediction error:', error);
      
      if (error.message.includes('Model not available')) {
        return res.status(503).json({
          success: false,
          error: "ML model not trained. Run: python3 server/ml/train_model.py",
          details: error.message
        });
      }
      
      if (error.message.includes('Missing required features')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          required_features: [
            'rsi_1h', 'macd_histogram', 'ema_20', 
            'market_cap_usd', 'volume_24h_usd', 
            'social_score', 'astro_score'
          ]
        });
      }

      res.status(500).json({
        success: false,
        error: "Prediction failed",
        details: error.message
      });
    }
  });

  app.get("/api/ml/model/info", async (req, res) => {
    try {
      const info = await mlPredictor.getModelInfo();
      res.json({
        success: true,
        data: info,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to get model info",
        details: error.message
      });
    }
  });

  app.post("/api/ml/predict/batch", async (req, res) => {
    try {
      const { features_array } = req.body;
      
      if (!Array.isArray(features_array)) {
        return res.status(400).json({
          success: false,
          error: "Expected 'features_array' as array of feature objects"
        });
      }

      const predictions = await mlPredictor.batchPredict(features_array);
      
      res.json({
        success: true,
        predictions,
        count: predictions.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Batch prediction failed",
        details: error.message
      });
    }
  });

  // Multi-asset prediction endpoints
  app.get("/api/predictions/latest", async (req, res) => {
    try {
      const { symbol = 'SOL' } = req.query;
      
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
        .eq('symbol', symbol.toUpperCase())
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: data[0] || null,
        symbol: symbol.toUpperCase(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch prediction",
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/predictions/all", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: "Database not available",
          timestamp: new Date().toISOString()
        });
      }

      // Get watchlist from environment or default
      const watchlist = (process.env.WATCHLIST || 'SOL,ETH,BTC').split(',');
      
      const predictions = [];
      
      for (const symbol of watchlist) {
        try {
          const { data, error } = await supabase
            .from('live_predictions')
            .select('*')
            .eq('symbol', symbol.trim().toUpperCase())
            .order('timestamp', { ascending: false })
            .limit(1);

          if (data && data[0]) {
            predictions.push({
              symbol: symbol.trim().toUpperCase(),
              prediction: data[0].predicted_pct,
              confidence: data[0].confidence,
              composite_score: data[0].tech_score + data[0].social_score + data[0].fund_score + data[0].astro_score,
              category: data[0].category,
              timestamp: data[0].timestamp
            });
          }
        } catch (error) {
          console.error(`Error fetching prediction for ${symbol}:`, error);
        }
      }

      res.json({
        success: true,
        data: predictions,
        watchlist,
        count: predictions.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch all predictions",
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Server-Sent Events for real-time predictions
  let clients = [];

  app.get("/api/stream/predictions", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    // Send initial connection message
    res.write("data: {\"type\":\"connected\"}\n\n");

    // Add client to the list
    clients.push(res);

    // Remove client when connection closes
    req.on("close", () => {
      clients = clients.filter(client => client !== res);
    });

    req.on("aborted", () => {
      clients = clients.filter(client => client !== res);
    });
  });

  // Function to broadcast predictions to all connected clients
  const broadcastPrediction = (predictionData) => {
    const payload = JSON.stringify({
      type: "prediction_update",
      data: predictionData,
      timestamp: new Date().toISOString()
    });

    clients.forEach(client => {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (error) {
        console.error("Error broadcasting to client:", error);
      }
    });

    // Clean up dead connections
    clients = clients.filter(client => !client.destroyed);
  };

  // Export broadcast function for use in scheduler
  app.broadcastPrediction = broadcastPrediction;

  // Alert Management Endpoints
  app.post("/api/alerts", (req, res) => {
    try {
      const { type, symbol, conditions, notification } = req.body;
      
      if (!type || !symbol || !conditions) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: type, symbol, conditions"
        });
      }

      const alertId = alertManager.createAlert({
        type,
        symbol: symbol.toUpperCase(),
        conditions,
        notification: notification || { browser: true, cooldownMinutes: 15 }
      });

      res.json({
        success: true,
        alertId,
        message: "Alert created successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create alert",
        details: error.message
      });
    }
  });

  app.get("/api/alerts", (req, res) => {
    try {
      const alerts = alertManager.getAlerts();
      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch alerts",
        details: error.message
      });
    }
  });

  app.get("/api/alerts/history", (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const history = alertManager.getAlertHistory(parseInt(limit));
      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch alert history",
        details: error.message
      });
    }
  });

  app.delete("/api/alerts/:alertId", (req, res) => {
    try {
      const { alertId } = req.params;
      const deleted = alertManager.deleteAlert(alertId);
      
      if (deleted) {
        res.json({
          success: true,
          message: "Alert deleted successfully"
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Alert not found"
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to delete alert",
        details: error.message
      });
    }
  });

  app.get("/api/alerts/templates", (req, res) => {
    try {
      res.json({
        success: true,
        templates: alertTemplates
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch alert templates",
        details: error.message
      });
    }
  });

  // Set up alert broadcasting via SSE
  const broadcastAlert = (alertData) => {
    const payload = JSON.stringify({
      type: "alert_triggered",
      alert: alertData,
      timestamp: new Date().toISOString()
    });

    clients.forEach(client => {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (error) {
        console.error("Error broadcasting alert to client:", error);
      }
    });

    clients = clients.filter(client => !client.destroyed);
  };

  // Listen for alert events
  alertManager.on('alertTriggered', broadcastAlert);
  alertManager.on('browserAlert', broadcastAlert);

  const httpServer = createServer(app);
  return httpServer;
}