/**
 * Automated Prediction Scheduler
 * Runs hourly predictions and monitoring for the trading analysis system
 */

import cron from 'node-cron';
import { runPredictionLive } from './prediction.js';
import { fetchAndScoreNews, generateDailyUpdate, suggestWeights } from './openaiIntegration.js';
import { errorHandler } from '../utils/errorHandler.js';

class SchedulerService {
  constructor() {
    this.lastCategory = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Scheduler already running');
      return;
    }

    console.log('Starting prediction scheduler...');
    
    // Schedule predictions every 15 minutes for more frequent updates
    cron.schedule('*/15 * * * *', async () => {
      await this.runHourlyPrediction();
    });

    // Schedule health check every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await this.runHealthCheck();
    });

    // Schedule daily OpenAI integration at 08:00 UTC
    cron.schedule('0 8 * * *', async () => {
      await this.runDailyOpenAIIntegration();
    });

    this.isRunning = true;
    console.log('Prediction scheduler started - running hourly at :00 minutes, daily OpenAI at 08:00 UTC');
  }

  stop() {
    if (!this.isRunning) {
      console.log('Scheduler not running');
      return;
    }

    // Note: node-cron doesn't provide direct task stopping
    // In production, you'd track tasks and destroy them
    this.isRunning = false;
    console.log('Scheduler stopped');
  }

  async runHourlyPrediction() {
    const startTime = Date.now();
    console.log('=== Automated Prediction Started ===');
    
    const result = await errorHandler.executeWithRetry(
      () => runPredictionLive(),
      'Scheduled Prediction Generation'
    );
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      const prediction = result.data;
      console.log(`Prediction completed in ${duration}ms (attempt ${result.attempt})`);
      console.log(`Result: ${prediction.prediction.percentageChange}% (${prediction.prediction.category})`);
      console.log(`Confidence: ${prediction.prediction.confidence}%`);
      
      // Check for category changes
      if (this.lastCategory && prediction.prediction.category !== this.lastCategory) {
        await this.handleCategoryChange(this.lastCategory, prediction.prediction.category, prediction);
      }
      
      // Check for large predicted moves
      if (Math.abs(prediction.prediction.percentageChange) > 5) {
        await this.handleLargeMove(prediction);
      }
      
      this.lastCategory = prediction.prediction.category;
      console.log('=== Automated Prediction Completed ===');
    } else {
      console.error(`Prediction failed after ${result.attempts} attempts:`, result.error);
      await this.handlePredictionError(new Error(result.error));
    }
  }

  async runHealthCheck() {
    try {
      // Basic health check - ensure prediction service is responsive
      const healthStart = Date.now();
      
      // Test if we can run a quick prediction analysis
      const testResult = await runPredictionLive();
      
      const healthDuration = Date.now() - healthStart;
      
      if (healthDuration > 30000) { // 30 seconds
        console.warn(`Health check slow: ${healthDuration}ms`);
      }
      
      if (!testResult || !testResult.prediction) {
        throw new Error('Health check failed: invalid prediction result');
      }
      
      console.log(`Health check passed in ${healthDuration}ms`);
      
    } catch (error) {
      console.error('Health check failed:', error);
      await this.handleHealthCheckError(error);
    }
  }

  async handleCategoryChange(oldCategory, newCategory, result) {
    const message = `Prediction category changed: ${oldCategory} → ${newCategory} (${result.prediction.percentageChange.toFixed(2)}%)`;
    console.log(`🔄 ${message}`);
    
    // Log significant category changes
    if ((oldCategory === 'BEARISH' && newCategory === 'BULLISH') || 
        (oldCategory === 'BULLISH' && newCategory === 'BEARISH')) {
      console.log('⚠️  Major sentiment reversal detected');
    }
  }

  async handleLargeMove(result) {
    const message = `Large move predicted: ${result.prediction.percentageChange.toFixed(2)}% (${result.prediction.category})`;
    console.log(`🚨 ${message}`);
    console.log(`Pillar breakdown - Tech: ${result.pillarScores.technical}, Social: ${result.pillarScores.social}, Fund: ${result.pillarScores.fundamental}, Astro: ${result.pillarScores.astrology}`);
  }

  async handlePredictionError(error) {
    const errorMessage = `Error in hourly prediction: ${error.message}`;
    console.error('📛', errorMessage);
    
    // Log error details for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  async handleHealthCheckError(error) {
    const errorMessage = `Health check failure: ${error.message}`;
    console.error('💔', errorMessage);
    
    // Consider implementing restart logic here if needed
    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      console.log('Network-related health check failure - will retry next cycle');
    }
  }

  async runDailyOpenAIIntegration() {
    try {
      console.log('=== Daily OpenAI Integration Started ===');
      const startTime = Date.now();
      
      // Fetch and score news
      console.log('Fetching and scoring LunarCrush news...');
      const scoredNews = await fetchAndScoreNews();
      console.log('News scored.');
      
      // Generate daily market update
      console.log('Generating daily market update...');
      const updateText = await generateDailyUpdate();
      console.log(`Daily update: ${updateText.slice(0, 50)}...`);
      
      // Suggest dynamic weights
      console.log('Suggesting dynamic pillar weights...');
      const weights = await suggestWeights();
      console.log(`New weights: ${JSON.stringify(weights)}`);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Daily OpenAI integration completed in ${duration}ms`);
      console.log('=== Daily OpenAI Integration Completed ===');
      
    } catch (error) {
      console.error('Daily OpenAI integration failed:', error);
      await this.handleOpenAIIntegrationError(error);
    }
  }

  async handleOpenAIIntegrationError(error) {
    const errorMessage = `Error in daily OpenAI integration: ${error.message}`;
    console.error('🤖', errorMessage);
    
    // Log error details for debugging
    console.error('OpenAI Integration error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Consider sending Discord alert via /api/alerts.js if available
    try {
      // This would be implemented if alerts system exists
      // await sendDiscordAlert(`OpenAI Integration Failed: ${error.message}`);
    } catch (alertError) {
      console.error('Failed to send alert:', alertError);
    }
  }

  // Manual prediction trigger for testing
  async triggerManualPrediction() {
    console.log('Triggering manual prediction...');
    await this.runHourlyPrediction();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCategory: this.lastCategory,
      nextRun: this.isRunning ? 'Top of next hour' : 'Not scheduled',
      uptime: process.uptime()
    };
  }
}

// Create singleton instance
const scheduler = new SchedulerService();

// Auto-start scheduler when module loads
try {
  scheduler.start();
} catch (error) {
  console.error('Failed to start scheduler:', error);
}

// Export functions for external use
export function startScheduler() {
  scheduler.start();
}

export function stopScheduler() {
  scheduler.stop();
}

export function getSchedulerStatus() {
  return scheduler.getStatus();
}

export function triggerManualPrediction() {
  return scheduler.triggerManualPrediction();
}

export default scheduler;