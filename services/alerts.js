/**
 * Real-Time Alerts Subsystem
 * User-defined threshold rules with WebSocket broadcasting
 */

import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';

class AlertsSystem {
  constructor() {
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.wsClients = new Set();
    this.wss = null;
    this.maxHistoryEntries = 500;
    this.alertsFilePath = 'data/alert_rules.json';
    this.historyFilePath = 'data/alert_history.json';
    
    // Ensure data directory exists
    this.initializeStorage();
    this.loadPersistedData();
  }

  /**
   * Initialize WebSocket server for alert broadcasting
   */
  initializeWebSocket(server) {
    this.wss = new WebSocketServer({ 
      server: server, 
      path: '/ws/alerts' 
    });

    this.wss.on('connection', (ws) => {
      console.log('🔔 Alerts WebSocket client connected');
      this.wsClients.add(ws);
      
      // Send current active alerts to new client
      const activeAlertsArray = Array.from(this.activeAlerts.values());
      if (activeAlertsArray.length > 0) {
        ws.send(JSON.stringify({
          type: 'active_alerts',
          alerts: activeAlertsArray,
          timestamp: new Date().toISOString()
        }));
      }

      ws.on('close', () => {
        console.log('🔔 Alerts WebSocket client disconnected');
        this.wsClients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('🔔 Alerts WebSocket error:', error);
        this.wsClients.delete(ws);
      });
    });

    console.log('✅ Alerts WebSocket server initialized on /ws/alerts');
  }

  /**
   * Initialize storage directories and files
   */
  initializeStorage() {
    try {
      const dataDir = path.dirname(this.alertsFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      console.log('✅ Alerts storage initialized');
    } catch (error) {
      console.error('❌ Failed to initialize alerts storage:', error);
    }
  }

  /**
   * Load persisted alert rules and history
   */
  loadPersistedData() {
    try {
      // Load alert rules
      if (fs.existsSync(this.alertsFilePath)) {
        const rulesData = JSON.parse(fs.readFileSync(this.alertsFilePath, 'utf8'));
        rulesData.forEach(rule => {
          this.alertRules.set(rule.id, rule);
        });
        console.log(`📋 Loaded ${this.alertRules.size} alert rules`);
      }

      // Load alert history
      if (fs.existsSync(this.historyFilePath)) {
        this.alertHistory = JSON.parse(fs.readFileSync(this.historyFilePath, 'utf8'));
        console.log(`📋 Loaded ${this.alertHistory.length} alert history entries`);
      }
    } catch (error) {
      console.error('❌ Failed to load persisted alerts data:', error);
    }
  }

  /**
   * Save alert rules to persistent storage
   */
  saveAlertRules() {
    try {
      const rulesArray = Array.from(this.alertRules.values());
      fs.writeFileSync(this.alertsFilePath, JSON.stringify(rulesArray, null, 2));
    } catch (error) {
      console.error('❌ Failed to save alert rules:', error);
    }
  }

  /**
   * Save alert history to persistent storage
   */
  saveAlertHistory() {
    try {
      // Keep only the most recent entries
      const recentHistory = this.alertHistory.slice(-this.maxHistoryEntries);
      fs.writeFileSync(this.historyFilePath, JSON.stringify(recentHistory, null, 2));
    } catch (error) {
      console.error('❌ Failed to save alert history:', error);
    }
  }

  /**
   * Create a new alert rule
   */
  createAlertRule(ruleConfig) {
    try {
      const rule = {
        id: this.generateRuleId(),
        name: ruleConfig.name || 'Unnamed Rule',
        description: ruleConfig.description || '',
        conditions: ruleConfig.conditions || [],
        enabled: ruleConfig.enabled !== false,
        created_at: new Date().toISOString(),
        triggered_count: 0,
        last_triggered: null
      };

      // Validate rule conditions
      const validation = this.validateRuleConditions(rule.conditions);
      if (!validation.valid) {
        throw new Error(`Invalid rule conditions: ${validation.error}`);
      }

      this.alertRules.set(rule.id, rule);
      this.saveAlertRules();

      console.log(`✅ Created alert rule: ${rule.name} (${rule.id})`);
      return { success: true, rule: rule };

    } catch (error) {
      console.error('❌ Failed to create alert rule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing alert rule
   */
  updateAlertRule(ruleId, updates) {
    try {
      const rule = this.alertRules.get(ruleId);
      if (!rule) {
        throw new Error('Alert rule not found');
      }

      // Validate updated conditions if provided
      if (updates.conditions) {
        const validation = this.validateRuleConditions(updates.conditions);
        if (!validation.valid) {
          throw new Error(`Invalid rule conditions: ${validation.error}`);
        }
      }

      // Update rule properties
      Object.assign(rule, updates, {
        updated_at: new Date().toISOString()
      });

      this.alertRules.set(ruleId, rule);
      this.saveAlertRules();

      console.log(`✅ Updated alert rule: ${rule.name} (${ruleId})`);
      return { success: true, rule: rule };

    } catch (error) {
      console.error('❌ Failed to update alert rule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete an alert rule
   */
  deleteAlertRule(ruleId) {
    try {
      const rule = this.alertRules.get(ruleId);
      if (!rule) {
        throw new Error('Alert rule not found');
      }

      this.alertRules.delete(ruleId);
      this.saveAlertRules();

      // Remove from active alerts if present
      if (this.activeAlerts.has(ruleId)) {
        this.activeAlerts.delete(ruleId);
      }

      console.log(`✅ Deleted alert rule: ${rule.name} (${ruleId})`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to delete alert rule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all alert rules
   */
  getAllRules() {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get alert rule by ID
   */
  getRule(ruleId) {
    return this.alertRules.get(ruleId);
  }

  /**
   * Evaluate prediction against all active alert rules
   */
  evaluatePrediction(predictionData) {
    try {
      console.log('🔍 Evaluating prediction against alert rules...');
      
      const triggeredAlerts = [];
      const currentTime = new Date().toISOString();

      // Check each enabled rule
      for (const [ruleId, rule] of this.alertRules) {
        if (!rule.enabled) continue;

        const isTriggered = this.evaluateRuleConditions(rule.conditions, predictionData);
        
        if (isTriggered) {
          // Update rule statistics
          rule.triggered_count++;
          rule.last_triggered = currentTime;

          // Create alert
          const alert = {
            id: this.generateAlertId(),
            rule_id: ruleId,
            rule_name: rule.name,
            message: this.generateAlertMessage(rule, predictionData),
            prediction_data: predictionData,
            triggered_at: currentTime,
            acknowledged: false,
            severity: this.calculateAlertSeverity(rule, predictionData)
          };

          triggeredAlerts.push(alert);
          this.activeAlerts.set(alert.id, alert);
          this.alertHistory.push(alert);

          console.log(`🚨 Alert triggered: ${rule.name}`);
        }
      }

      // Broadcast alerts if any triggered
      if (triggeredAlerts.length > 0) {
        this.broadcastAlerts(triggeredAlerts);
        this.saveAlertRules();
        this.saveAlertHistory();
      }

      return triggeredAlerts;

    } catch (error) {
      console.error('❌ Failed to evaluate prediction alerts:', error);
      return [];
    }
  }

  /**
   * Validate rule conditions structure
   */
  validateRuleConditions(conditions) {
    try {
      if (!Array.isArray(conditions) || conditions.length === 0) {
        return { valid: false, error: 'Conditions must be a non-empty array' };
      }

      for (const condition of conditions) {
        // Required fields
        if (!condition.field || !condition.operator || condition.value === undefined) {
          return { valid: false, error: 'Each condition must have field, operator, and value' };
        }

        // Valid fields
        const validFields = [
          'predicted_change_percent', 'confidence', 'predicted_price',
          'technical_score', 'social_score', 'fundamental_score', 'astrology_score',
          'direction', 'volatility'
        ];
        
        if (!validFields.includes(condition.field)) {
          return { valid: false, error: `Invalid field: ${condition.field}` };
        }

        // Valid operators
        const validOperators = ['>', '>=', '<', '<=', '==', '!=', 'contains'];
        if (!validOperators.includes(condition.operator)) {
          return { valid: false, error: `Invalid operator: ${condition.operator}` };
        }
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Evaluate rule conditions against prediction data
   */
  evaluateRuleConditions(conditions, predictionData) {
    try {
      return conditions.every(condition => {
        const fieldValue = this.extractFieldValue(condition.field, predictionData);
        return this.evaluateCondition(fieldValue, condition.operator, condition.value);
      });
    } catch (error) {
      console.error('❌ Failed to evaluate rule conditions:', error);
      return false;
    }
  }

  /**
   * Extract field value from prediction data
   */
  extractFieldValue(field, predictionData) {
    const fieldMap = {
      'predicted_change_percent': predictionData.predicted_change_percent,
      'confidence': predictionData.confidence * 100, // Convert to percentage
      'predicted_price': predictionData.predicted_price,
      'technical_score': predictionData.pillar_scores?.technical || 0,
      'social_score': predictionData.pillar_scores?.social || 0,
      'fundamental_score': predictionData.pillar_scores?.fundamental || 0,
      'astrology_score': predictionData.pillar_scores?.astrology || 0,
      'direction': predictionData.direction,
      'volatility': predictionData.volatility || 0
    };

    return fieldMap[field];
  }

  /**
   * Evaluate individual condition
   */
  evaluateCondition(fieldValue, operator, conditionValue) {
    switch (operator) {
      case '>':
        return fieldValue > conditionValue;
      case '>=':
        return fieldValue >= conditionValue;
      case '<':
        return fieldValue < conditionValue;
      case '<=':
        return fieldValue <= conditionValue;
      case '==':
        return fieldValue === conditionValue;
      case '!=':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      default:
        return false;
    }
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(rule, predictionData) {
    const changePercent = predictionData.predicted_change_percent?.toFixed(2) || 'N/A';
    const confidence = (predictionData.confidence * 100)?.toFixed(1) || 'N/A';
    const direction = predictionData.direction || 'NEUTRAL';

    return `${rule.name}: Prediction shows ${changePercent}% ${direction} movement with ${confidence}% confidence`;
  }

  /**
   * Calculate alert severity
   */
  calculateAlertSeverity(rule, predictionData) {
    const changePercent = Math.abs(predictionData.predicted_change_percent || 0);
    const confidence = predictionData.confidence || 0;

    if (changePercent >= 5 && confidence >= 0.8) return 'critical';
    if (changePercent >= 3 && confidence >= 0.6) return 'high';
    if (changePercent >= 2 && confidence >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Broadcast alerts to WebSocket clients
   */
  broadcastAlerts(alerts) {
    if (this.wsClients.size === 0) return;

    const message = JSON.stringify({
      type: 'new_alerts',
      alerts: alerts,
      timestamp: new Date().toISOString()
    });

    this.wsClients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(message);
        } catch (error) {
          console.error('❌ Failed to send alert to client:', error);
          this.wsClients.delete(client);
        }
      }
    });

    console.log(`📡 Broadcasted ${alerts.length} alerts to ${this.wsClients.size} clients`);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.acknowledged = true;
      alert.acknowledged_at = new Date().toISOString();

      // Update in history as well
      const historyIndex = this.alertHistory.findIndex(h => h.id === alertId);
      if (historyIndex !== -1) {
        this.alertHistory[historyIndex] = { ...alert };
      }

      this.saveAlertHistory();

      console.log(`✅ Acknowledged alert: ${alert.rule_name}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to acknowledge alert:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear acknowledged alerts
   */
  clearAcknowledgedAlerts() {
    try {
      const clearedCount = Array.from(this.activeAlerts.values())
        .filter(alert => alert.acknowledged).length;

      // Remove acknowledged alerts from active alerts
      for (const [alertId, alert] of this.activeAlerts) {
        if (alert.acknowledged) {
          this.activeAlerts.delete(alertId);
        }
      }

      console.log(`✅ Cleared ${clearedCount} acknowledged alerts`);
      return { success: true, cleared_count: clearedCount };

    } catch (error) {
      console.error('❌ Failed to clear acknowledged alerts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100, offset = 0) {
    const sortedHistory = this.alertHistory
      .sort((a, b) => new Date(b.triggered_at) - new Date(a.triggered_at))
      .slice(offset, offset + limit);

    return {
      alerts: sortedHistory,
      total: this.alertHistory.length,
      limit,
      offset
    };
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recent24h = this.alertHistory.filter(alert => 
      new Date(alert.triggered_at) > last24h
    );

    const recent7d = this.alertHistory.filter(alert => 
      new Date(alert.triggered_at) > last7d
    );

    return {
      total_rules: this.alertRules.size,
      enabled_rules: Array.from(this.alertRules.values()).filter(r => r.enabled).length,
      active_alerts: this.activeAlerts.size,
      total_history: this.alertHistory.length,
      alerts_24h: recent24h.length,
      alerts_7d: recent7d.length,
      severity_breakdown: this.calculateSeverityBreakdown(this.getActiveAlerts()),
      most_triggered_rule: this.getMostTriggeredRule()
    };
  }

  /**
   * Calculate severity breakdown
   */
  calculateSeverityBreakdown(alerts) {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach(alert => {
      breakdown[alert.severity] = (breakdown[alert.severity] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get most triggered rule
   */
  getMostTriggeredRule() {
    let mostTriggered = null;
    let maxTriggers = 0;

    for (const rule of this.alertRules.values()) {
      if (rule.triggered_count > maxTriggers) {
        maxTriggers = rule.triggered_count;
        mostTriggered = {
          id: rule.id,
          name: rule.name,
          triggered_count: rule.triggered_count
        };
      }
    }

    return mostTriggered;
  }

  /**
   * Generate unique rule ID
   */
  generateRuleId() {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default AlertsSystem;