/**
 * Comprehensive Database Logger for Hardened Supabase Operations
 * Logs every database operation with detailed request/response tracking
 */

import { supabase } from './supabase.js';

/**
 * Enhanced Supabase wrapper with comprehensive logging
 */
export class DatabaseManager {
  constructor() {
    this.requestId = 0;
  }

  generateRequestId() {
    return `db_${Date.now()}_${++this.requestId}`;
  }

  logOperation(operation, details) {
    console.log(`[DB] ${operation} | ${JSON.stringify(details)} | Timestamp: ${new Date().toISOString()}`);
  }

  logError(operation, error, details = {}) {
    console.error(`[DB] ERROR: ${operation} | Error: ${error.message} | Details: ${JSON.stringify(details)} | Stack: ${error.stack}`);
  }

  logSuccess(operation, result, latencyMs, details = {}) {
    console.log(`[DB] SUCCESS: ${operation} | Latency: ${latencyMs}ms | Rows: ${result?.data?.length || 0} | Details: ${JSON.stringify(details)}`);
  }

  /**
   * Enhanced SELECT with comprehensive logging
   */
  async select(tableName, columns = '*', filters = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.logOperation('SELECT_START', {
      requestId,
      table: tableName,
      columns,
      filters
    });

    try {
      let query = supabase.from(tableName).select(columns);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const result = await query;
      const latencyMs = Date.now() - startTime;

      if (result.error) {
        this.logError('SELECT_FAILED', result.error, {
          requestId,
          table: tableName,
          latencyMs
        });
        throw new Error(`Database SELECT failed: ${result.error.message}`);
      }

      this.logSuccess('SELECT', result, latencyMs, {
        requestId,
        table: tableName,
        rowCount: result.data?.length || 0
      });

      return result;

    } catch (error) {
      const latencyMs = Date.now() - startTime;
      this.logError('SELECT_EXCEPTION', error, {
        requestId,
        table: tableName,
        latencyMs
      });
      throw error;
    }
  }

  /**
   * Enhanced INSERT with comprehensive logging
   */
  async insert(tableName, payload, options = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.logOperation('INSERT_START', {
      requestId,
      table: tableName,
      payloadKeys: Object.keys(payload),
      options
    });

    try {
      // Sanitize payload for logging (remove sensitive data)
      const sanitizedPayload = { ...payload };
      if (sanitizedPayload.features) {
        sanitizedPayload.features = '[FEATURES_OBJECT]';
      }

      console.log(`[DB] INSERT_PAYLOAD: ${JSON.stringify(sanitizedPayload).substring(0, 500)}...`);

      let query = supabase.from(tableName).insert([payload]);

      if (options.select) {
        query = query.select();
      }

      const result = await query;
      const latencyMs = Date.now() - startTime;

      if (result.error) {
        this.logError('INSERT_FAILED', result.error, {
          requestId,
          table: tableName,
          latencyMs,
          errorCode: result.error.code,
          errorDetails: result.error.details
        });
        throw new Error(`Database INSERT failed: ${result.error.message}`);
      }

      this.logSuccess('INSERT', result, latencyMs, {
        requestId,
        table: tableName,
        insertedRows: result.data?.length || 1
      });

      return result;

    } catch (error) {
      const latencyMs = Date.now() - startTime;
      this.logError('INSERT_EXCEPTION', error, {
        requestId,
        table: tableName,
        latencyMs
      });
      throw error;
    }
  }

  /**
   * Enhanced UPDATE with comprehensive logging
   */
  async update(tableName, payload, filters = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.logOperation('UPDATE_START', {
      requestId,
      table: tableName,
      payloadKeys: Object.keys(payload),
      filters
    });

    try {
      let query = supabase.from(tableName).update(payload);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const result = await query;
      const latencyMs = Date.now() - startTime;

      if (result.error) {
        this.logError('UPDATE_FAILED', result.error, {
          requestId,
          table: tableName,
          latencyMs
        });
        throw new Error(`Database UPDATE failed: ${result.error.message}`);
      }

      this.logSuccess('UPDATE', result, latencyMs, {
        requestId,
        table: tableName,
        affectedRows: result.count || 0
      });

      return result;

    } catch (error) {
      const latencyMs = Date.now() - startTime;
      this.logError('UPDATE_EXCEPTION', error, {
        requestId,
        table: tableName,
        latencyMs
      });
      throw error;
    }
  }

  /**
   * Enhanced UPSERT with comprehensive logging
   */
  async upsert(tableName, payload, options = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.logOperation('UPSERT_START', {
      requestId,
      table: tableName,
      payloadKeys: Object.keys(payload),
      options
    });

    try {
      let query = supabase.from(tableName).upsert([payload], options);

      if (options.select) {
        query = query.select();
      }

      const result = await query;
      const latencyMs = Date.now() - startTime;

      if (result.error) {
        this.logError('UPSERT_FAILED', result.error, {
          requestId,
          table: tableName,
          latencyMs
        });
        throw new Error(`Database UPSERT failed: ${result.error.message}`);
      }

      this.logSuccess('UPSERT', result, latencyMs, {
        requestId,
        table: tableName,
        upsertedRows: result.data?.length || 1
      });

      return result;

    } catch (error) {
      const latencyMs = Date.now() - startTime;
      this.logError('UPSERT_EXCEPTION', error, {
        requestId,
        table: tableName,
        latencyMs
      });
      throw error;
    }
  }

  /**
   * Enhanced DELETE with comprehensive logging
   */
  async delete(tableName, filters = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.logOperation('DELETE_START', {
      requestId,
      table: tableName,
      filters
    });

    try {
      let query = supabase.from(tableName).delete();

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const result = await query;
      const latencyMs = Date.now() - startTime;

      if (result.error) {
        this.logError('DELETE_FAILED', result.error, {
          requestId,
          table: tableName,
          latencyMs
        });
        throw new Error(`Database DELETE failed: ${result.error.message}`);
      }

      this.logSuccess('DELETE', result, latencyMs, {
        requestId,
        table: tableName,
        deletedRows: result.count || 0
      });

      return result;

    } catch (error) {
      const latencyMs = Date.now() - startTime;
      this.logError('DELETE_EXCEPTION', error, {
        requestId,
        table: tableName,
        latencyMs
      });
      throw error;
    }
  }

  /**
   * Health check with read/write validation
   */
  async healthCheck() {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.logOperation('HEALTH_CHECK_START', { requestId });

    try {
      // Test read access
      const readResult = await this.select('predictions', 'id', {});
      
      // Test write access with temporary data
      const testData = {
        prediction: 0,
        confidence: 0,
        direction: 'HEALTH_TEST',
        technical_score: 0,
        social_score: 0,
        fundamental_score: 0,
        astrology_score: 0,
        features: { test: true },
        pillar_scores: { test: true },
        created_at: new Date().toISOString()
      };

      const writeResult = await this.insert('predictions', testData, { select: true });

      // Clean up test data
      if (writeResult.data && writeResult.data[0]) {
        await this.delete('predictions', { id: writeResult.data[0].id });
      }

      const latencyMs = Date.now() - startTime;
      
      this.logSuccess('HEALTH_CHECK', { read: true, write: true }, latencyMs, {
        requestId,
        readRows: readResult.data?.length || 0
      });

      return {
        healthy: true,
        latencyMs,
        operations: {
          read: true,
          write: true,
          delete: true
        }
      };

    } catch (error) {
      const latencyMs = Date.now() - startTime;
      this.logError('HEALTH_CHECK_FAILED', error, {
        requestId,
        latencyMs
      });

      return {
        healthy: false,
        latencyMs,
        error: error.message,
        operations: {
          read: false,
          write: false,
          delete: false
        }
      };
    }
  }
}

// Export singleton instance
export const dbManager = new DatabaseManager();