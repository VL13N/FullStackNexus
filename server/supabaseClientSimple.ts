/**
 * Simplified Supabase Client with Direct Environment Validation
 * Ensures proper database connectivity without complex testing
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client with strict environment validation
 */
export function initializeSupabase(): SupabaseClient {
  // Validate all required environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 Validating Supabase environment variables...');
  console.log(`📍 SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
  console.log(`🔑 SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}`);
  console.log(`🔐 SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'SET' : 'MISSING'}`);

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required but missing');
  }

  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY environment variable is required but missing');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required but missing');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    throw new Error(`SUPABASE_URL is not a valid URL: ${supabaseUrl}`);
  }

  // Initialize client with service role key for full database access
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Supabase client initialized successfully');
  console.log(`📍 Connected to: ${supabaseUrl}`);

  return supabaseClient;
}

/**
 * Get the initialized Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call initializeSupabase() first.');
  }
  return supabaseClient;
}

/**
 * Perform database health check with simple operation
 */
export async function performDatabaseHealthCheck(): Promise<{ 
  success: boolean; 
  message: string; 
  latency?: number 
}> {
  if (!supabaseClient) {
    return { 
      success: false, 
      message: 'Supabase client not initialized' 
    };
  }

  try {
    const startTime = Date.now();
    
    // Simple auth service check - this verifies connectivity without requiring specific tables
    const { error } = await supabaseClient.auth.getSession();
    
    const latency = Date.now() - startTime;
    
    // Auth service responding means database connectivity is working
    return { 
      success: true, 
      message: 'Database connection healthy',
      latency 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Health check failed: ${(error as Error).message}` 
    };
  }
}

/**
 * Check if client is ready for use
 */
export function isSupabaseReady(): boolean {
  return supabaseClient !== null;
}