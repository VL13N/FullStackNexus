/**
 * Centralized error handling and retry logic for API failures
 */

export class ApiErrorHandler {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.errorLog = [];
  }

  async executeWithRetry(operation, context = 'API Operation') {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Clear any previous errors for this context on success
        this.clearErrors(context);
        
        return {
          success: true,
          data: result,
          attempt: attempt + 1
        };
      } catch (error) {
        lastError = error;
        
        // Log the error with context
        this.logError(context, error, attempt + 1);
        
        // Don't retry on final attempt
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`${context} failed (attempt ${attempt + 1}), retrying in ${delay.toFixed(0)}ms...`);
      }
    }
    
    return {
      success: false,
      error: lastError.message,
      attempts: this.maxRetries + 1,
      context
    };
  }

  logError(context, error, attempt) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      attempt,
      stack: error.stack
    };
    
    this.errorLog.push(errorEntry);
    
    // Keep only last 50 errors
    if (this.errorLog.length > 50) {
      this.errorLog = this.errorLog.slice(-50);
    }
    
    console.error(`[${context}] Attempt ${attempt} failed:`, error.message);
  }

  clearErrors(context) {
    this.errorLog = this.errorLog.filter(entry => entry.context !== context);
  }

  getRecentErrors(context = null, minutes = 30) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.errorLog.filter(entry => {
      const errorTime = new Date(entry.timestamp);
      const matchesContext = !context || entry.context === context;
      return errorTime > cutoff && matchesContext;
    });
  }

  getErrorSummary() {
    const now = new Date();
    const last24Hours = this.errorLog.filter(entry => {
      const errorTime = new Date(entry.timestamp);
      return (now - errorTime) < 24 * 60 * 60 * 1000;
    });

    const byContext = {};
    last24Hours.forEach(entry => {
      if (!byContext[entry.context]) {
        byContext[entry.context] = [];
      }
      byContext[entry.context].push(entry);
    });

    return {
      totalErrors: last24Hours.length,
      errorsByContext: byContext,
      lastError: this.errorLog[this.errorLog.length - 1] || null
    };
  }
}

// Export singleton instance
export const errorHandler = new ApiErrorHandler();

// Helper function for pillar-specific error handling
export async function fetchPillarWithFallback(pillarName, primaryFetch, fallbackValue = null) {
  const result = await errorHandler.executeWithRetry(
    primaryFetch,
    `${pillarName} Pillar Data`
  );
  
  if (result.success) {
    return result.data;
  }
  
  console.warn(`${pillarName} pillar fetch failed, using fallback value:`, fallbackValue);
  return fallbackValue;
}