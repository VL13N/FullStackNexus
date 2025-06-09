/**
 * Advanced Alerting System for Cryptocurrency Predictions
 * Supports threshold-based alerts, trend alerts, and confidence-based notifications
 */

import { EventEmitter } from 'events';

class AlertManager extends EventEmitter {
  constructor() {
    super();
    this.alerts = new Map();
    this.activeAlerts = new Set();
    this.alertHistory = [];
    this.subscribers = new Map();
  }

  /**
   * Create a new alert rule
   * @param {Object} rule - Alert configuration
   * @param {string} rule.id - Unique alert identifier
   * @param {string} rule.type - Alert type: 'threshold', 'trend', 'confidence'
   * @param {string} rule.symbol - Cryptocurrency symbol (SOL, ETH, BTC)
   * @param {Object} rule.conditions - Alert trigger conditions
   * @param {Object} rule.notification - Notification settings
   */
  createAlert(rule) {
    const alertId = rule.id || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert = {
      id: alertId,
      type: rule.type,
      symbol: rule.symbol,
      conditions: rule.conditions,
      notification: rule.notification,
      created: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0,
      isActive: true
    };

    this.alerts.set(alertId, alert);
    console.log(`Alert created: ${alertId} for ${rule.symbol} (${rule.type})`);
    
    return alertId;
  }

  /**
   * Process prediction data and check for alert triggers
   * @param {Object} prediction - Latest prediction data
   */
  async checkAlerts(prediction) {
    const alerts = Array.from(this.alerts.values()).filter(alert => 
      alert.isActive && alert.symbol === prediction.symbol
    );

    for (const alert of alerts) {
      const shouldTrigger = this.evaluateAlert(alert, prediction);
      
      if (shouldTrigger && !this.activeAlerts.has(alert.id)) {
        await this.triggerAlert(alert, prediction);
      }
    }
  }

  /**
   * Evaluate if an alert should trigger based on prediction data
   * @param {Object} alert - Alert configuration
   * @param {Object} prediction - Prediction data
   * @returns {boolean} Whether alert should trigger
   */
  evaluateAlert(alert, prediction) {
    const { type, conditions } = alert;

    switch (type) {
      case 'threshold':
        return this.evaluateThresholdAlert(conditions, prediction);
      
      case 'trend':
        return this.evaluateTrendAlert(conditions, prediction);
      
      case 'confidence':
        return this.evaluateConfidenceAlert(conditions, prediction);
      
      default:
        console.warn(`Unknown alert type: ${type}`);
        return false;
    }
  }

  /**
   * Evaluate threshold-based alerts (price target, score levels)
   */
  evaluateThresholdAlert(conditions, prediction) {
    const { metric, operator, value } = conditions;
    const actualValue = this.getMetricValue(prediction, metric);

    if (actualValue === null) return false;

    switch (operator) {
      case 'greater_than':
        return actualValue > value;
      case 'less_than':
        return actualValue < value;
      case 'equal':
        return Math.abs(actualValue - value) < 0.01;
      case 'greater_equal':
        return actualValue >= value;
      case 'less_equal':
        return actualValue <= value;
      default:
        return false;
    }
  }

  /**
   * Evaluate trend-based alerts (direction changes, momentum shifts)
   */
  evaluateTrendAlert(conditions, prediction) {
    const { direction, duration, minConfidence } = conditions;
    
    // Check if prediction matches expected direction
    const predictionDirection = prediction.prediction > 0 ? 'bullish' : 'bearish';
    const directionMatch = direction === 'any' || direction === predictionDirection;
    
    // Check confidence threshold
    const confidenceMatch = !minConfidence || prediction.confidence >= minConfidence;
    
    return directionMatch && confidenceMatch;
  }

  /**
   * Evaluate confidence-based alerts (high/low confidence predictions)
   */
  evaluateConfidenceAlert(conditions, prediction) {
    const { minConfidence, maxConfidence, requireSignificantMove } = conditions;
    
    let confidenceMatch = true;
    if (minConfidence !== undefined) {
      confidenceMatch = confidenceMatch && prediction.confidence >= minConfidence;
    }
    if (maxConfidence !== undefined) {
      confidenceMatch = confidenceMatch && prediction.confidence <= maxConfidence;
    }

    if (requireSignificantMove) {
      const significantMove = Math.abs(prediction.prediction) >= 2.0; // 2%+ move
      return confidenceMatch && significantMove;
    }

    return confidenceMatch;
  }

  /**
   * Extract metric value from prediction data
   */
  getMetricValue(prediction, metric) {
    const metricMap = {
      'prediction': prediction.prediction,
      'confidence': prediction.confidence,
      'technical_score': prediction.technical_score,
      'social_score': prediction.social_score,
      'fundamental_score': prediction.fundamental_score,
      'astrology_score': prediction.astrology_score,
      'overall_score': prediction.overall_score
    };

    return metricMap[metric] || null;
  }

  /**
   * Trigger an alert and send notifications
   */
  async triggerAlert(alert, prediction) {
    const alertData = {
      alertId: alert.id,
      symbol: alert.symbol,
      type: alert.type,
      prediction: prediction,
      timestamp: new Date().toISOString(),
      message: this.generateAlertMessage(alert, prediction)
    };

    // Mark alert as active to prevent spam
    this.activeAlerts.add(alert.id);
    
    // Update alert statistics
    alert.lastTriggered = alertData.timestamp;
    alert.triggerCount++;

    // Add to history
    this.alertHistory.push(alertData);
    
    // Emit alert event
    this.emit('alertTriggered', alertData);

    // Send notifications
    await this.sendNotifications(alert, alertData);

    // Schedule alert cooldown
    setTimeout(() => {
      this.activeAlerts.delete(alert.id);
    }, alert.notification.cooldownMinutes * 60 * 1000 || 300000); // 5 min default

    console.log(`Alert triggered: ${alert.id} for ${alert.symbol}`);
  }

  /**
   * Generate human-readable alert message
   */
  generateAlertMessage(alert, prediction) {
    const symbol = alert.symbol;
    const direction = prediction.prediction > 0 ? 'BULLISH' : 'BEARISH';
    const magnitude = Math.abs(prediction.prediction).toFixed(2);
    const confidence = (prediction.confidence * 100).toFixed(1);

    switch (alert.type) {
      case 'threshold':
        return `${symbol} threshold alert: ${direction} ${magnitude}% prediction with ${confidence}% confidence`;
      
      case 'trend':
        return `${symbol} trend alert: ${direction} signal detected with ${confidence}% confidence`;
      
      case 'confidence':
        return `${symbol} confidence alert: ${confidence}% confidence ${direction} prediction (${magnitude}%)`;
      
      default:
        return `${symbol} alert: ${direction} ${magnitude}% prediction`;
    }
  }

  /**
   * Send notifications through configured channels
   */
  async sendNotifications(alert, alertData) {
    const { notification } = alert;

    // Console notification (always enabled for development)
    console.log(`🚨 ALERT: ${alertData.message}`);

    // Email notifications (requires SMTP configuration)
    if (notification.email && process.env.SMTP_ENABLED) {
      await this.sendEmailAlert(notification.email, alertData);
    }

    // Webhook notifications
    if (notification.webhook) {
      await this.sendWebhookAlert(notification.webhook, alertData);
    }

    // Browser notifications (via Server-Sent Events)
    if (notification.browser) {
      this.sendBrowserAlert(alertData);
    }
  }

  /**
   * Send email alert notification
   */
  async sendEmailAlert(emailConfig, alertData) {
    // Email implementation would go here
    // For now, log the intent
    console.log(`Email alert would be sent to: ${emailConfig.recipients}`);
  }

  /**
   * Send webhook alert notification
   */
  async sendWebhookAlert(webhookConfig, alertData) {
    try {
      const response = await fetch(webhookConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhookConfig.headers
        },
        body: JSON.stringify({
          alert: alertData,
          timestamp: alertData.timestamp
        })
      });

      if (!response.ok) {
        console.error(`Webhook alert failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Webhook alert error:', error.message);
    }
  }

  /**
   * Send browser alert via Server-Sent Events
   */
  sendBrowserAlert(alertData) {
    this.emit('browserAlert', alertData);
  }

  /**
   * Get all active alerts
   */
  getAlerts() {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Delete an alert
   */
  deleteAlert(alertId) {
    const deleted = this.alerts.delete(alertId);
    this.activeAlerts.delete(alertId);
    return deleted;
  }

  /**
   * Update alert configuration
   */
  updateAlert(alertId, updates) {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    Object.assign(alert, updates);
    return true;
  }
}

// Export singleton instance
export const alertManager = new AlertManager();

/**
 * Predefined alert templates for common use cases
 */
export const alertTemplates = {
  highConfidenceBullish: {
    type: 'confidence',
    conditions: {
      minConfidence: 0.8,
      requireSignificantMove: true
    },
    notification: {
      browser: true,
      cooldownMinutes: 30
    }
  },

  strongBearishSignal: {
    type: 'trend',
    conditions: {
      direction: 'bearish',
      minConfidence: 0.7
    },
    notification: {
      browser: true,
      cooldownMinutes: 15
    }
  },

  technicalBreakout: {
    type: 'threshold',
    conditions: {
      metric: 'technical_score',
      operator: 'greater_than',
      value: 80
    },
    notification: {
      browser: true,
      cooldownMinutes: 60
    }
  }
};