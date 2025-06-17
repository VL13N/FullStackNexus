import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export function registerHealthRoutes(app) {
  // Database health check endpoint
  app.get('/health/db', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('live_predictions')
        .select('id')
        .limit(1);
      
      if (error) {
        return res.status(500).json({ 
          ok: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({ 
        ok: true, 
        sample: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        ok: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // General health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: {
        supabase_url: !!process.env.SUPABASE_URL,
        supabase_key: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
        cryptorank_key: !!process.env.CRYPTORANK_API_KEY,
        lunarcrush_key: !!process.env.LUNARCRUSH_API_KEY,
        taapi_secret: !!process.env.TAAPI_SECRET,
        openai_key: !!process.env.OPENAI_API_KEY
      }
    });
  });
}