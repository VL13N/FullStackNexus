import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { registerMLRoutes } from "./mlRoutes.js";
import healthRoutesSimple from "./healthRoutesSimple.js";
import { registerDirectApiRoutes } from "./directApiRoutes.js";
import { ensureJSONResponse, apiRouteProtection } from "./apiMiddleware.js";
import hpoRoutes from "./hpoRoutes.js";
import alertRoutes from "./alertRoutes.js";
import correlationRoutes from "./correlationRoutes.js";
import sentimentRoutes from "./sentimentRoutes.js";
import riskRoutes from "./riskRoutes.js";
import backtestRoutes from "./backtestRoutes.js";

import { setupVite, serveStatic, log } from "./vite";
import scheduler from "../services/scheduler.js";
import modelTrainingScheduler from "../services/modelTrainingScheduler.js";
import AlertsSystem from "../services/alerts.js";
import { initializeSupabase, performDatabaseHealthCheck } from "./supabaseClientSimple.js";

async function startServer() {
  // CRITICAL: Initialize Supabase IMMEDIATELY before any other services
  console.log('🔍 Initializing Supabase at server startup...');
  
  try {
    // Validate environment variables first
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required Supabase environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
    }
    
    initializeSupabase();
    
    // Test database connection with SELECT 1 query
    const healthResult = await performDatabaseHealthCheck();
    if (!healthResult.success) {
      console.error('FATAL: Database connection failed:', healthResult.error || healthResult.message);
      console.error('Please verify your Supabase credentials in Replit Secrets');
      process.exit(1);
    }
    console.log('✅ Supabase initialized and connection verified');
  } catch (error) {
    console.error('FATAL: Supabase initialization failed:', (error as Error).message);
    process.exit(1);
  }

  // Verify critical API keys on startup
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY is required but not found in environment variables');
    console.error('Please add your OpenAI API key to Replit Secrets');
    process.exit(1);
  }

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Register health endpoints FIRST to prevent Vite interception
  app.use((req, res, next) => {
    if (req.path.startsWith('/health') || req.path.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json');
    }
    next();
  });

  // Register direct API routes FIRST to prevent routing conflicts
  registerDirectApiRoutes(app);

  // Add database health endpoint before other routes
  app.get('/health/db', async (req, res) => {
    try {
      const healthResult = await performDatabaseHealthCheck();
      
      if (healthResult.success) {
        res.status(200).json({
          success: true,
          message: healthResult.message,
          latency: healthResult.latency,
          timestamp: new Date().toISOString(),
          database: 'operational'
        });
      } else {
        res.status(503).json({
          success: false,
          message: healthResult.message,
          timestamp: new Date().toISOString(),
          database: 'unavailable'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Database health check failed: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
        database: 'error'
      });
    }
  });

  // Comprehensive health check endpoint - parallel testing of all critical services
  app.get('/health/full', async (req, res) => {
    const startTime = Date.now();
    const results = {};
    const port = app.get('port') || 5000;
    
    try {
      // Parallel health checks for all critical services
      const [dbHealth, taapiHealth, lunarcrushHealth, cryptorankHealth, predictionsHealth] = await Promise.allSettled([
        // Database health check with SELECT 1
        (async () => {
          const dbStart = Date.now();
          const health = await performDatabaseHealthCheck();
          return {
            name: 'database',
            success: health.success,
            latency: Date.now() - dbStart,
            message: health.message || (health.success ? 'Connected' : 'Failed')
          };
        })(),
        
        // TAAPI Pro health check
        (async () => {
          const taapiStart = Date.now();
          try {
            const response = await fetch(`http://localhost:${port}/api/taapi/rsi?interval=1h`);
            const data = await response.json();
            return {
              name: 'taapi',
              success: response.ok && data.success,
              latency: Date.now() - taapiStart,
              message: data.success ? 'Operational' : data.message || 'Failed'
            };
          } catch (error) {
            return {
              name: 'taapi',
              success: false,
              latency: Date.now() - taapiStart,
              message: (error as Error).message
            };
          }
        })(),
        
        // LunarCrush health check
        (async () => {
          const lcStart = Date.now();
          try {
            const response = await fetch(`http://localhost:${port}/api/lunarcrush/metrics`);
            const data = await response.json();
            return {
              name: 'lunarcrush',
              success: response.ok && data.success,
              latency: Date.now() - lcStart,
              message: data.success ? 'Operational' : data.message || 'Failed'
            };
          } catch (error) {
            return {
              name: 'lunarcrush',
              success: false,
              latency: Date.now() - lcStart,
              message: (error as Error).message
            };
          }
        })(),
        
        // CryptoRank health check
        (async () => {
          const crStart = Date.now();
          try {
            const response = await fetch(`http://localhost:${port}/api/cryptorank/global`);
            const data = await response.json();
            return {
              name: 'cryptorank',
              success: response.ok && data.success,
              latency: Date.now() - crStart,
              message: data.success ? 'Operational' : data.message || 'Failed'
            };
          } catch (error) {
            return {
              name: 'cryptorank',
              success: false,
              latency: Date.now() - crStart,
              message: (error as Error).message
            };
          }
        })(),
        
        // Predictions health check
        (async () => {
          const predStart = Date.now();
          try {
            const response = await fetch(`http://localhost:${port}/api/predictions/latest`);
            const data = await response.json();
            return {
              name: 'predictions',
              success: response.ok && data.success,
              latency: Date.now() - predStart,
              message: data.success ? 'Operational' : data.message || 'Failed'
            };
          } catch (error) {
            return {
              name: 'predictions',
              success: false,
              latency: Date.now() - predStart,
              message: (error as Error).message
            };
          }
        })()
      ]);

      // Process results
      [dbHealth, taapiHealth, lunarcrushHealth, cryptorankHealth, predictionsHealth].forEach((result, index) => {
        const serviceName = ['database', 'taapi', 'lunarcrush', 'cryptorank', 'predictions'][index];
        if (result.status === 'fulfilled') {
          results[serviceName] = result.value;
        } else {
          results[serviceName] = {
            name: serviceName,
            success: false,
            latency: 0,
            message: result.reason?.message || 'Health check failed'
          };
        }
      });

      // Calculate overall health
      const successCount = Object.values(results).filter((r: any) => r.success).length;
      const totalServices = Object.keys(results).length;
      const overallHealth = (successCount / totalServices) * 100;
      const allHealthy = successCount === totalServices;

      const response = {
        overall: {
          success: allHealthy,
          health_percentage: Math.round(overallHealth),
          total_latency: Date.now() - startTime,
          services_healthy: successCount,
          services_total: totalServices
        },
        services: results,
        timestamp: new Date().toISOString()
      };

      res.status(allHealthy ? 200 : 503).json(response);
    } catch (error) {
      res.status(500).json({
        overall: {
          success: false,
          health_percentage: 0,
          total_latency: Date.now() - startTime,
          error: (error as Error).message
        },
        timestamp: new Date().toISOString()
      });
    }
  });

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// OpenAI scheduling functions
async function scheduleOpenAITasks(port: number) {
  log('Setting up OpenAI automated scheduling...');
  
  // Hourly news sentiment analysis
  setInterval(async () => {
    try {
      log('[OpenAI Scheduler] Running hourly news sentiment analysis...');
      const response = await fetch(`http://localhost:${port}/api/openai/analyze-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        log('[OpenAI Scheduler] News sentiment analysis completed successfully');
      } else {
        console.error('[OpenAI Scheduler] News sentiment analysis failed:', response.status);
      }
    } catch (error: any) {
      console.error('[OpenAI Scheduler] News sentiment analysis error:', error.message);
    }
  }, 60 * 60 * 1000); // Every hour
  
  // Daily AI summary at midnight UTC
  function scheduleDailySummary() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 0, 0, 0);
    
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    
    setTimeout(async () => {
      try {
        log('[OpenAI Scheduler] Running daily AI summary generation...');
        const response = await fetch(`http://localhost:${port}/api/openai/daily-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          log('[OpenAI Scheduler] Daily summary generated successfully');
        } else {
          console.error('[OpenAI Scheduler] Daily summary failed:', response.status);
        }
      } catch (error: any) {
        console.error('[OpenAI Scheduler] Daily summary error:', error.message);
      }
      
      // Schedule next daily run
      setInterval(async () => {
        try {
          log('[OpenAI Scheduler] Running daily AI summary generation...');
          const response = await fetch(`http://localhost:${port}/api/openai/daily-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            log('[OpenAI Scheduler] Daily summary generated successfully');
          } else {
            console.error('[OpenAI Scheduler] Daily summary failed:', response.status);
          }
        } catch (error: any) {
          console.error('[OpenAI Scheduler] Daily summary error:', error.message);
        }
      }, 24 * 60 * 60 * 1000); // Every 24 hours
      
    }, msUntilMidnight);
    
    log(`[OpenAI Scheduler] Daily summary scheduled for next midnight UTC (${Math.round(msUntilMidnight / 1000 / 60)} minutes)`);
  }
  
  scheduleDailySummary();
  log('[OpenAI Scheduler] Automated scheduling activated');
}

  const server = await registerRoutes(app);
  
  // Initialize alerts system
  const alertsSystem = new AlertsSystem();
  app.locals.alertsSystem = alertsSystem;
  
  // Initialize alerts WebSocket server
  alertsSystem.initializeWebSocket(server);
  
  app.use('/api/health', healthRoutesSimple);
  
  // Register ML routes after direct API routes to prevent conflicts
  await registerMLRoutes(app);
  app.use('/api/ml/hpo', hpoRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/analysis', correlationRoutes);
  app.use('/api/sentiment', sentimentRoutes);
  app.use('/api/risk', riskRoutes);
  backtestRoutes(app);

  // Use environment port or fallback to 5000
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || "5000");

  // Connect scheduler with broadcast function and alerts system
  if ((app as any).broadcastPrediction) {
    scheduler.setBroadcastFunction((app as any).broadcastPrediction);
    scheduler.setAlertsSystem(alertsSystem);
    scheduler.start();
  }

  // Start model training scheduler
  modelTrainingScheduler.start();

  // Initialize and start incremental retraining service
  try {
    const { default: IncrementalRetrainingService } = await import('../services/incrementalRetraining.js');
    const incrementalService = new IncrementalRetrainingService();
    await incrementalService.initialize();
    incrementalService.startPeriodicChecks();
    app.locals.incrementalRetrainingService = incrementalService;
    console.log('✅ Incremental retraining service started with periodic checks');
  } catch (error) {
    console.warn('⚠️ Incremental retraining service failed to start:', error.message);
  }

  // Start OpenAI scheduling after routes are registered
  await scheduleOpenAITasks(port);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
