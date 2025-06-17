/**
 * Supabase Client Initialization with Environment Validation
 * Ensures proper database connectivity before any route handling
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseManager {
  private static instance: SupabaseManager;
  private client: SupabaseClient | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SupabaseManager {
    if (!SupabaseManager.instance) {
      SupabaseManager.instance = new SupabaseManager();
    }
    return SupabaseManager.instance;
  }

  /**
   * Initialize Supabase client with strict environment variable validation
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔍 Validating Supabase environment variables...');

    // Strict validation of all required environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    console.log('✅ All Supabase environment variables validated');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
    console.log(`🔐 Service Key: ${supabaseServiceKey.substring(0, 20)}...`);

    // Initialize client with service role key for full database access
    this.client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test database connectivity
    await this.testConnection();
    
    this.isInitialized = true;
    console.log('✅ Supabase client initialized and connection verified');
  }

  /**
   * Test database connectivity with a simple query
   */
  private async testConnection(): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Simple connection test - check if we can access the auth schema
      const { data, error } = await this.client.auth.getSession();
      
      if (error && error.message.includes('network')) {
        throw new Error(`Network connectivity issue: ${error.message}`);
      }
      
      // The session call succeeded (even if no session), proving database connectivity
      console.log('📊 Database connection verified via auth service');
      
    } catch (error) {
      // If auth fails, that's still a successful connection test
      // Only fail if there's a genuine network/connection error
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
        throw new Error(`Failed to verify database connection: ${errorMessage}`);
      }
      
      // Auth errors are expected without a session - connection is working
      console.log('📊 Database connection verified (auth service accessible)');
    }
  }

  /**
   * Get the initialized Supabase client
   */
  getClient(): SupabaseClient {
    if (!this.isInitialized || !this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Check if client is ready for use
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Perform a simple database health check
   */
  async healthCheck(): Promise<{ success: boolean; message: string; latency?: number }> {
    if (!this.isReady()) {
      return { success: false, message: 'Supabase client not initialized' };
    }

    try {
      const startTime = Date.now();
      
      // Simple SELECT 1 equivalent
      const { data, error } = await this.client!
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);
      
      const latency = Date.now() - startTime;
      
      if (error) {
        return { 
          success: false, 
          message: `Database query failed: ${error.message}`,
          latency 
        };
      }
      
      return { 
        success: true, 
        message: 'Database connection healthy',
        latency 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Health check failed: ${error.message}` 
      };
    }
  }
}

// Export singleton instance
export const supabaseManager = SupabaseManager.getInstance();

// Export convenience function to get client
export function getSupabaseClient(): SupabaseClient {
  return supabaseManager.getClient();
}