/**
 * Real-Time Alerts API Routes
 * RESTful endpoints for alert rule management and monitoring
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/alerts/rules
 * Get all alert rules
 */
router.get('/rules', async (req, res) => {
  try {
    const { alertsSystem } = req.app.locals;
    
    if (!alertsSystem) {
      return res.status(500).json({
        success: false,
        error: 'Alerts system not initialized'
      });
    }

    const rules = alertsSystem.getAllRules();
    
    res.json({
      success: true,
      rules: rules,
      count: rules.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/rules
 * Create a new alert rule
 */
router.post('/rules', async (req, res) => {
  try {
    const { alertsSystem } = req.app.locals;
    
    if (!alertsSystem) {
      return res.status(500).json({
        success: false,
        error: 'Alerts system not initialized'
      });
    }

    const result = alertsSystem.createAlertRule(req.body);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        rule: result.rule,
        message: 'Alert rule created successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Create rule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/rules/:id
 * Get specific alert rule by ID
 */
router.get('/rules/:id', async (req, res) => {
  try {
    const { alertsSystem } = req.app.locals;
    const { id } = req.params;
    
    if (!alertsSystem) {
      return res.status(500).json({
        success: false,
        error: 'Alerts system not initialized'
      });
    }

    const rule = alertsSystem.getRule(id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    }

    res.json({
      success: true,
      rule: rule,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get rule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/alerts/rules/:id
 * Update an existing alert rule
 */
router.put('/rules/:id', async (req, res) => {
  try {
    const { alertsSystem } = req.app.locals;
    const { id } = req.params;
    
    if (!alertsSystem) {
      return res.status(500).json({
        success: false,
        error: 'Alerts system not initialized'
      });
    }

    const result = alertsSystem.updateAlertRule(id, req.body);
    
    if (result.success) {
      res.json({
        success: true,
        rule: result.rule,
        message: 'Alert rule updated successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/alerts/rules/:id
 * Delete an alert rule
 */
router.delete('/rules/:id', async (req, res) => {
  try {
    const { alertsSystem } = req.app.locals;
    const { id } = req.params;
    
    if (!alertsSystem) {
      return res.status(500).json({
        success: false,
        error: 'Alerts system not initialized'
      });
    }

    const result = alertsSystem.deleteAlertRule(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Alert rule deleted successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/active
 * Get all active alerts
 */
router.get('/active', async (req, res) => {
  try {
    const { alertsSystem } = req.app.locals;
    
    if (!alertsSystem) {
      return res.status(500).json({
        success: false,
        error: 'Alerts system not initialized'
      });
    }

    const activeAlerts = alertsSystem.getActiveAlerts();
    
    res.json({
      success: true,
      alerts: activeAlerts,
      count: activeAlerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get active alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { alertsSystem } = req.app.locals;
    const { id } = req.params;
    
    if (!alertsSystem) {
      return res.status(500).json({
        success: false,
        error: 'Alerts system not initialized'
      });
    }

    const result = alertsSystem.acknowledgeAlert(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Alert acknowledged successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/clear-acknowledged
 * Clear all acknowledged alerts
 */
router.post('/clear-acknowledged', async (req, res) => {
  try {
    const { alertsSystem } = req.app.locals;
    
    if (!alertsSystem) {
      return res.status(500).json({
        success: false,
        error: 'Alerts system not initialized'
      });
    }

    const result = alertsSystem.clearAcknowledgedAlerts();
    
    res.json({
      success: true,
      cleared_count: result.cleared_count,
      message: `Cleared ${result.cleared_count} acknowledged alerts`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear acknowledged alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/history
 * Get alert history with pagination
 */
router.get('/history', async (req, res) => {
  try {
    const { alertsSystem } = req.app.locals;
    const { limit = 50, offset = 0 } = req.query;
    
    if (!alertsSystem) {
      return res.status(500).json({
        success: false,
        error: 'Alerts system not initialized'
      });
    }

    const history = alertsSystem.getAlertHistory(
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      history: history.alerts,
      pagination: {
        total: history.total,
        limit: history.limit,
        offset: history.offset,
        has_more: (history.offset + history.limit) < history.total
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get alert history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/statistics
 * Get alert system statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const { alertsSystem } = req.app.locals;
    
    if (!alertsSystem) {
      return res.status(500).json({
        success: false,
        error: 'Alerts system not initialized'
      });
    }

    const statistics = alertsSystem.getAlertStatistics();
    
    res.json({
      success: true,
      statistics: statistics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get alert statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/fields
 * Get available fields for alert conditions
 */
router.get('/fields', async (req, res) => {
  try {
    const availableFields = [
      {
        field: 'predicted_change_percent',
        name: 'Predicted Change %',
        type: 'number',
        description: 'Predicted price change percentage',
        operators: ['>', '>=', '<', '<=', '==', '!=']
      },
      {
        field: 'confidence',
        name: 'Confidence',
        type: 'number',
        description: 'Prediction confidence percentage (0-100)',
        operators: ['>', '>=', '<', '<=', '==', '!=']
      },
      {
        field: 'predicted_price',
        name: 'Predicted Price',
        type: 'number',
        description: 'Predicted price in USD',
        operators: ['>', '>=', '<', '<=', '==', '!=']
      },
      {
        field: 'technical_score',
        name: 'Technical Score',
        type: 'number',
        description: 'Technical analysis pillar score (0-100)',
        operators: ['>', '>=', '<', '<=', '==', '!=']
      },
      {
        field: 'social_score',
        name: 'Social Score',
        type: 'number',
        description: 'Social sentiment pillar score (0-100)',
        operators: ['>', '>=', '<', '<=', '==', '!=']
      },
      {
        field: 'fundamental_score',
        name: 'Fundamental Score',
        type: 'number',
        description: 'Fundamental analysis pillar score (0-100)',
        operators: ['>', '>=', '<', '<=', '==', '!=']
      },
      {
        field: 'astrology_score',
        name: 'Astrology Score',
        type: 'number',
        description: 'Astrological analysis pillar score (0-100)',
        operators: ['>', '>=', '<', '<=', '==', '!=']
      },
      {
        field: 'direction',
        name: 'Direction',
        type: 'string',
        description: 'Prediction direction (BULLISH, BEARISH, NEUTRAL)',
        operators: ['==', '!=', 'contains']
      },
      {
        field: 'volatility',
        name: 'Volatility',
        type: 'number',
        description: 'Market volatility indicator',
        operators: ['>', '>=', '<', '<=', '==', '!=']
      }
    ];

    res.json({
      success: true,
      fields: availableFields,
      operators: ['>', '>=', '<', '<=', '==', '!=', 'contains'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get alert fields error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;