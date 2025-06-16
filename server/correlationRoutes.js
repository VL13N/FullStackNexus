/**
 * Correlation Analysis API Routes
 * Cross-asset and inter-pillar correlation endpoints
 */

import express from 'express';
import CorrelationAnalysisService from '../services/correlation.js';

const router = express.Router();
const correlationService = new CorrelationAnalysisService();

/**
 * GET /api/analysis/correlations
 * Get latest correlation analysis or compute new one
 */
router.get('/correlations', async (req, res) => {
  try {
    const { 
      days = 30, 
      force_refresh = false 
    } = req.query;

    console.log(`Computing correlations for ${days} days (force_refresh: ${force_refresh})`);

    // Get latest analysis if available and not forcing refresh
    if (!force_refresh) {
      const latest = correlationService.getLatestCorrelation();
      if (latest.success) {
        const ageMinutes = (Date.now() - new Date(latest.data.timestamp).getTime()) / (1000 * 60);
        
        // Return cached if less than 30 minutes old
        if (ageMinutes < 30) {
          return res.json({
            success: true,
            data: latest.data,
            cached: true,
            age_minutes: Math.round(ageMinutes),
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // Compute new correlation analysis
    const result = await correlationService.calculateCorrelations(parseInt(days));
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        cached: false,
        computation_time: 'real-time',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Correlation analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/analysis/correlations/compute
 * Force computation of new correlation analysis
 */
router.post('/correlations/compute', async (req, res) => {
  try {
    const { days = 30 } = req.body;

    console.log(`Force computing correlations for ${days} days`);

    const result = await correlationService.calculateCorrelations(parseInt(days));
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Correlation analysis computed successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Correlation computation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/correlations/history
 * Get correlation analysis history
 */
router.get('/correlations/history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const history = correlationService.getCorrelationHistory(parseInt(limit));
    
    res.json({
      success: true,
      history: history.history,
      total_entries: history.total_entries,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Correlation history error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/correlations/matrix
 * Get correlation matrix only (for heatmap visualization)
 */
router.get('/correlations/matrix', async (req, res) => {
  try {
    const latest = correlationService.getLatestCorrelation();
    
    if (!latest.success) {
      return res.status(404).json({
        success: false,
        error: 'No correlation data available. Run analysis first.',
        timestamp: new Date().toISOString()
      });
    }

    const matrix = latest.data.correlation_matrix;
    const variables = latest.data.variables;

    // Transform matrix for heatmap visualization
    const heatmapData = [];
    variables.forEach((var1, i) => {
      variables.forEach((var2, j) => {
        heatmapData.push({
          x: var1,
          y: var2,
          value: matrix[var1][var2],
          correlation: matrix[var1][var2]
        });
      });
    });

    res.json({
      success: true,
      matrix: matrix,
      variables: variables,
      heatmap_data: heatmapData,
      data_points: latest.data.data_points,
      period_days: latest.data.period_days,
      timestamp: latest.data.timestamp
    });

  } catch (error) {
    console.error('Correlation matrix error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/analysis/correlations/insights
 * Get correlation insights and interpretations
 */
router.get('/correlations/insights', async (req, res) => {
  try {
    const latest = correlationService.getLatestCorrelation();
    
    if (!latest.success) {
      return res.status(404).json({
        success: false,
        error: 'No correlation data available. Run analysis first.',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      insights: latest.data.insights,
      period_days: latest.data.period_days,
      data_points: latest.data.data_points,
      timestamp: latest.data.timestamp
    });

  } catch (error) {
    console.error('Correlation insights error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/analysis/correlations/cache
 * Clear correlation cache
 */
router.delete('/correlations/cache', async (req, res) => {
  try {
    correlationService.clearCache();
    
    res.json({
      success: true,
      message: 'Correlation cache cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;