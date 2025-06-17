/**
 * Scheduler Hardening Service
 * Wraps all scheduled tasks with comprehensive error handling and retry logic
 */

/**
 * Enhanced scheduler wrapper with error handling and retry logic
 */
export class HardenedScheduler {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelayMs = 5000; // 5 seconds initial delay
    this.activeSchedules = new Map();
  }

  /**
   * Wrap any scheduled callback with error handling and retry logic
   */
  wrapScheduledTask(taskName, originalCallback, retryOptions = {}) {
    const {
      maxRetries = this.retryAttempts,
      initialDelay = this.retryDelayMs,
      exponentialBackoff = true
    } = retryOptions;

    return async (...args) => {
      const taskId = `${taskName}_${Date.now()}`;
      const startTime = Date.now();

      console.log(`[SCHEDULER] Task started: ${taskName} | ID: ${taskId} | Timestamp: ${new Date().toISOString()}`);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await originalCallback(...args);
          const duration = Date.now() - startTime;
          
          console.log(`[SCHEDULER] Task completed: ${taskName} | Duration: ${duration}ms | Attempt: ${attempt}/${maxRetries}`);
          return result;

        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`[SCHEDULER] Task failed: ${taskName} | Attempt: ${attempt}/${maxRetries} | Duration: ${duration}ms | Error: ${error.message}`);
          console.error(`[SCHEDULER] Stack trace: ${error.stack}`);

          // If this was the last attempt, log final failure
          if (attempt === maxRetries) {
            console.error(`[SCHEDULER] Task permanently failed: ${taskName} | All ${maxRetries} attempts exhausted | Total duration: ${duration}ms`);
            
            // Schedule a retry after a longer delay for critical tasks
            if (this.isCriticalTask(taskName)) {
              const retryDelay = 30000; // 30 seconds for critical tasks
              console.log(`[SCHEDULER] Critical task ${taskName} will retry in ${retryDelay}ms`);
              setTimeout(() => {
                this.wrapScheduledTask(taskName, originalCallback, retryOptions)();
              }, retryDelay);
            }
            
            throw error;
          }

          // Calculate retry delay with exponential backoff
          const retryDelay = exponentialBackoff 
            ? initialDelay * Math.pow(2, attempt - 1)
            : initialDelay;

          console.log(`[SCHEDULER] Retrying task: ${taskName} in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    };
  }

  /**
   * Determine if a task is critical and should have additional retry logic
   */
  isCriticalTask(taskName) {
    const criticalTasks = [
      'hourly-prediction',
      'data-collection',
      'model-training',
      'database-backup',
      'health-monitoring'
    ];
    
    return criticalTasks.some(critical => taskName.toLowerCase().includes(critical));
  }

  /**
   * Safe interval scheduler with error isolation
   */
  safeInterval(callback, intervalMs, taskName = 'unknown') {
    const wrappedCallback = this.wrapScheduledTask(taskName, callback);
    
    const intervalId = setInterval(() => {
      wrappedCallback().catch(error => {
        console.error(`[SCHEDULER] Interval task ${taskName} failed but scheduler continues: ${error.message}`);
      });
    }, intervalMs);

    this.activeSchedules.set(taskName, intervalId);
    console.log(`[SCHEDULER] Safe interval started: ${taskName} | Interval: ${intervalMs}ms`);
    
    return intervalId;
  }

  /**
   * Safe timeout scheduler with error isolation
   */
  safeTimeout(callback, timeoutMs, taskName = 'unknown') {
    const wrappedCallback = this.wrapScheduledTask(taskName, callback);
    
    const timeoutId = setTimeout(() => {
      wrappedCallback().catch(error => {
        console.error(`[SCHEDULER] Timeout task ${taskName} failed: ${error.message}`);
      });
    }, timeoutMs);

    console.log(`[SCHEDULER] Safe timeout scheduled: ${taskName} | Delay: ${timeoutMs}ms`);
    return timeoutId;
  }

  /**
   * Safe cron-style scheduler (if using node-schedule)
   */
  safeCron(schedule, callback, taskName = 'cron-task') {
    const wrappedCallback = this.wrapScheduledTask(taskName, callback);
    
    try {
      // Try to import node-schedule if available
      const schedule_lib = require('node-schedule');
      
      const job = schedule_lib.scheduleJob(schedule, () => {
        wrappedCallback().catch(error => {
          console.error(`[SCHEDULER] Cron task ${taskName} failed but scheduler continues: ${error.message}`);
        });
      });

      this.activeSchedules.set(taskName, job);
      console.log(`[SCHEDULER] Safe cron scheduled: ${taskName} | Schedule: ${schedule}`);
      
      return job;
    } catch (error) {
      console.warn(`[SCHEDULER] node-schedule not available, falling back to interval for ${taskName}`);
      
      // Fallback to interval if node-schedule not available
      const intervalMs = this.cronToInterval(schedule);
      return this.safeInterval(callback, intervalMs, taskName);
    }
  }

  /**
   * Convert simple cron expressions to interval milliseconds (basic fallback)
   */
  cronToInterval(cronExpression) {
    // Basic cron parsing for common patterns
    if (cronExpression.includes('* * * * *')) return 60000; // Every minute
    if (cronExpression.includes('0 * * * *')) return 3600000; // Every hour
    if (cronExpression.includes('0 0 * * *')) return 86400000; // Every day
    
    // Default to hourly if can't parse
    console.warn(`[SCHEDULER] Could not parse cron expression: ${cronExpression}, defaulting to hourly`);
    return 3600000;
  }

  /**
   * Stop a scheduled task
   */
  stopTask(taskName) {
    const schedule = this.activeSchedules.get(taskName);
    if (schedule) {
      if (typeof schedule.cancel === 'function') {
        schedule.cancel(); // node-schedule job
      } else {
        clearInterval(schedule); // setInterval
      }
      
      this.activeSchedules.delete(taskName);
      console.log(`[SCHEDULER] Task stopped: ${taskName}`);
      return true;
    }
    
    console.warn(`[SCHEDULER] Task not found for stopping: ${taskName}`);
    return false;
  }

  /**
   * Get status of all scheduled tasks
   */
  getStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      activeSchedules: this.activeSchedules.size,
      tasks: {}
    };

    for (const [taskName, schedule] of this.activeSchedules) {
      status.tasks[taskName] = {
        active: true,
        type: typeof schedule.cancel === 'function' ? 'cron' : 'interval',
        schedule: schedule
      };
    }

    return status;
  }

  /**
   * Health check for scheduler system
   */
  async healthCheck() {
    const startTime = Date.now();
    
    try {
      const status = this.getStatus();
      const latencyMs = Date.now() - startTime;
      
      console.log(`[SCHEDULER] Health check completed | Active schedules: ${status.activeSchedules} | Latency: ${latencyMs}ms`);
      
      return {
        healthy: true,
        activeSchedules: status.activeSchedules,
        latencyMs,
        tasks: Object.keys(status.tasks)
      };
      
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      console.error(`[SCHEDULER] Health check failed | Error: ${error.message} | Latency: ${latencyMs}ms`);
      
      return {
        healthy: false,
        error: error.message,
        latencyMs,
        activeSchedules: 0
      };
    }
  }
}

// Export singleton instance
export const hardenedScheduler = new HardenedScheduler();