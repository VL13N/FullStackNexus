/**
 * CryptoRank V2 API Routes
 * Proxies all Basic plan endpoints with proper error handling
 */

import express from 'express';
import {
  fetchGlobalStats,
  fetchCurrencyMap,
  searchCurrencies,
  fetchCategories,
  fetchTags,
  fetchFiatCurrencies,
  fetchAllCurrencies,
  fetchCurrencyById,
  fetchCurrencyMetadata,
  fetchCurrencySparkline,
  fetchSolanaData,
  fetchSolanaMetadata,
  fetchSolanaSparkline,
  fetchFundsMap,
  fetchExchangesMap,
  CryptoRankV2Service
} from '../services/cryptoRankService.js';

const router = express.Router();
const service = new CryptoRankV2Service();

// Global market statistics
router.get('/global', async (req, res) => {
  try {
    const data = await fetchGlobalStats();
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Currency mapping
router.get('/currencies/map', async (req, res) => {
  try {
    const data = await fetchCurrencyMap();
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Categories
router.get('/currencies/categories', async (req, res) => {
  try {
    const data = await fetchCategories();
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Tags
router.get('/currencies/tags', async (req, res) => {
  try {
    const data = await fetchTags();
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Fiat currencies
router.get('/currencies/fiat', async (req, res) => {
  try {
    const data = await fetchFiatCurrencies();
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// All currencies with pagination
router.get('/currencies', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const data = await fetchAllCurrencies(limit, offset);
    res.json({ 
      success: true, 
      data: data.data,
      pagination: {
        limit,
        offset,
        total: data.meta?.total || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Currency search (must come before /:id route)
router.get('/currencies/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
        timestamp: new Date().toISOString()
      });
    }
    
    const data = await searchCurrencies(q);
    res.json({ 
      success: true, 
      data: data.data,
      query: q,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Single currency by ID
router.get('/currencies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchCurrencyById(id);
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Currency metadata
router.get('/currencies/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchCurrencyMetadata(id);
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Currency sparkline
router.get('/currencies/:id/sparkline', async (req, res) => {
  try {
    const { id } = req.params;
    const interval = req.query.interval || '24h';
    
    const data = await fetchCurrencySparkline(id, interval);
    res.json({ 
      success: true, 
      data: data.data,
      interval,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Funds mapping
router.get('/funds/map', async (req, res) => {
  try {
    const data = await fetchFundsMap();
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Exchanges mapping
router.get('/exchanges/map', async (req, res) => {
  try {
    const data = await fetchExchangesMap();
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Solana-specific endpoints
router.get('/solana', async (req, res) => {
  try {
    const data = await fetchSolanaData();
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/solana/metadata', async (req, res) => {
  try {
    const data = await fetchSolanaMetadata();
    res.json({ 
      success: true, 
      data: data.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/solana/sparkline', async (req, res) => {
  try {
    const data = await fetchSolanaSparkline();
    res.json({ 
      success: true, 
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Comprehensive market overview
router.get('/market-overview', async (req, res) => {
  try {
    const data = await service.getMarketOverview();
    res.json({ 
      success: true, 
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Comprehensive Solana analysis
router.get('/solana/comprehensive', async (req, res) => {
  try {
    const data = await service.getComprehensiveSolanaAnalysis();
    res.json({ 
      success: true, 
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cache management
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = service.getCacheStats();
    res.json({ 
      success: true, 
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/cache', async (req, res) => {
  try {
    service.clearCache();
    res.json({ 
      success: true, 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;