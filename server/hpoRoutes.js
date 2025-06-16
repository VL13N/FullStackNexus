/**
 * Hyperparameter Optimization API Routes
 * Optuna-based Bayesian optimization endpoints for ML model tuning
 */

import express from 'express';
import OptunaTuner from '../services/optunaTuner.js';

const router = express.Router();
const tuner = new OptunaTuner();

/**
 * GET /api/ml/hpo/search-spaces
 * Get available hyperparameter search spaces
 */
router.get('/search-spaces', async (req, res) => {
  try {
    const searchSpaces = tuner.getSearchSpaces();
    
    res.json({
      success: true,
      search_spaces: searchSpaces,
      available_types: Object.keys(searchSpaces),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search spaces error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ml/hpo/start
 * Start hyperparameter optimization study
 */
router.post('/start', async (req, res) => {
  try {
    const {
      optimization_type = 'ensemble',
      n_trials = 50,
      study_name = null,
      timeout = 3600000
    } = req.body;

    console.log(`Starting ${optimization_type} optimization with ${n_trials} trials`);

    // Validate optimization type
    const searchSpaces = tuner.getSearchSpaces();
    if (!searchSpaces[optimization_type]) {
      return res.status(400).json({
        success: false,
        error: `Invalid optimization type. Available types: ${Object.keys(searchSpaces).join(', ')}`
      });
    }

    // Start optimization (non-blocking)
    const optimizationPromise = tuner.startOptimization({
      optimizationType: optimization_type,
      nTrials: n_trials,
      studyName: study_name,
      timeout: timeout
    });

    // Return immediately with job started confirmation
    res.json({
      success: true,
      message: 'Hyperparameter optimization started',
      optimization_type: optimization_type,
      n_trials: n_trials,
      estimated_duration_minutes: Math.ceil(n_trials * 2),
      start_time: new Date().toISOString(),
      status_endpoint: '/api/ml/hpo/status'
    });

    // Handle optimization completion in background
    optimizationPromise
      .then(result => {
        console.log('Optimization completed:', result);
      })
      .catch(error => {
        console.error('Optimization failed:', error);
      });

  } catch (error) {
    console.error('HPO start error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ml/hpo/status
 * Get current hyperparameter optimization status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await tuner.getTuningStatus();
    
    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('HPO status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ml/hpo/stop
 * Stop current hyperparameter optimization
 */
router.post('/stop', async (req, res) => {
  try {
    const stopped = tuner.stopOptimization();
    
    res.json({
      success: true,
      stopped: stopped,
      message: stopped ? 'Optimization stopped' : 'No active optimization to stop',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('HPO stop error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ml/hpo/history
 * Get optimization trial history
 */
router.get('/history', async (req, res) => {
  try {
    const { study_name, limit = 50 } = req.query;
    
    const history = await tuner.getOptimizationHistory(study_name);
    const limitedHistory = history.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      history: limitedHistory,
      total_trials: history.length,
      study_name: study_name || 'all',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('HPO history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ml/hpo/best-params/:optimization_type
 * Get best parameters for specific optimization type
 */
router.get('/best-params/:optimization_type', async (req, res) => {
  try {
    const { optimization_type } = req.params;
    
    const result = await tuner.getBestParameters(optimization_type);
    
    if (result.success) {
      res.json({
        success: true,
        optimization_type: optimization_type,
        best_params: result.best_params,
        best_value: result.best_value,
        n_trials: result.n_trials,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error || 'No optimization results found',
        optimization_type: optimization_type
      });
    }
  } catch (error) {
    console.error('HPO best params error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ml/hpo/statistics/:optimization_type
 * Get detailed study statistics and analysis
 */
router.get('/statistics/:optimization_type', async (req, res) => {
  try {
    const { optimization_type } = req.params;
    
    const statistics = await tuner.getStudyStatistics(optimization_type);
    
    res.json({
      success: true,
      optimization_type: optimization_type,
      statistics: statistics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('HPO statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ml/hpo/apply-best/:optimization_type
 * Apply best parameters to production models
 */
router.post('/apply-best/:optimization_type', async (req, res) => {
  try {
    const { optimization_type } = req.params;
    
    const bestParams = await tuner.getBestParameters(optimization_type);
    
    if (!bestParams.success) {
      return res.status(404).json({
        success: false,
        error: 'No best parameters found for this optimization type'
      });
    }

    // Here you would integrate with your model training services
    // For now, we'll return the parameters that should be applied
    
    res.json({
      success: true,
      message: 'Best parameters identified for application',
      optimization_type: optimization_type,
      parameters_to_apply: bestParams.best_params,
      performance_improvement: bestParams.best_value,
      application_status: 'ready_for_deployment',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('HPO apply best error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ml/hpo/dashboard-data
 * Get comprehensive data for HPO dashboard
 */
router.get('/dashboard-data', async (req, res) => {
  try {
    const { optimization_type = 'ensemble' } = req.query;
    
    // Get all relevant data for dashboard
    const [status, history, bestParams, statistics] = await Promise.all([
      tuner.getTuningStatus(),
      tuner.getOptimizationHistory().then(h => h.slice(0, 20)),
      tuner.getBestParameters(optimization_type),
      tuner.getStudyStatistics(optimization_type)
    ]);

    const searchSpaces = tuner.getSearchSpaces();

    res.json({
      success: true,
      dashboard_data: {
        current_status: status,
        recent_history: history,
        best_parameters: bestParams,
        statistics: statistics,
        search_spaces: searchSpaces,
        available_types: Object.keys(searchSpaces)
      },
      optimization_type: optimization_type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('HPO dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;