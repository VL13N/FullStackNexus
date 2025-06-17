import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { registerMLRoutes } from "./mlRoutes.js";
import { registerHealthRoutes } from "./healthRoutes.js";
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

// Verify critical API keys on startup
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is required but not found in environment variables');
  console.error('Please add your OpenAI API key to Replit Secrets');
  process.exit(1);
}

// Verify Supabase credentials
console.log('🔍 Checking Supabase configuration...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing Supabase credentials - please define SUPABASE_URL and SUPABASE_ANON_KEY in Replit Secrets');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  const server = await registerRoutes(app);
  await registerMLRoutes(app);
  
  // Initialize alerts system
  const alertsSystem = new AlertsSystem();
  app.locals.alertsSystem = alertsSystem;
  
  // Initialize alerts WebSocket server
  alertsSystem.initializeWebSocket(server);
  
  // Register route handlers
  registerRoutes(app);
  registerMLRoutes(app);
  registerHealthRoutes(app);
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
})();
