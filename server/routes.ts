import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
let supabase: any = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("Supabase client initialized successfully");
} else {
  console.warn("Supabase credentials not found - database endpoints will be unavailable");
}

// NOTE: TAAPI's MACD parameters must be camelCase (fastPeriod, slowPeriod, signalPeriod).
// If you still see authentication errors, check TAAPI dashboard → Usage for quota and IP Access.

console.log("TAAPI key in use:", process.env.TAAPI_API_KEY);
if (!process.env.TAAPI_API_KEY) {
  throw new Error("TAAPI_API_KEY is undefined—check Replit Secrets and restart.");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // TAAPI Pro API Routes
  app.get("/api/taapi/rsi", async (req, res) => {
    try {
      const { fetchTAIndicator } = await import('../api/taapi.js');
      const interval = req.query.interval || '1h';
      const value = await fetchTAIndicator('rsi', interval);
      
      res.json({
        success: true,
        indicator: 'RSI',
        value,
        interval,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/taapi/macd", async (req, res) => {
    try {
      const { fetchTAIndicator } = await import('../api/taapi.js');
      const interval = req.query.interval || '1h';
      const value = await fetchTAIndicator('macd', interval);
      
      res.json({
        success: true,
        indicator: 'MACD',
        value,
        interval,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/taapi/bulk", async (req, res) => {
    try {
      const { fetchBulkIndicators } = await import('../api/taapi.js');
      const interval = req.query.interval || '1h';
      const data = await fetchBulkIndicators(interval);
      
      res.json({
        success: true,
        type: 'bulk_indicators',
        data,
        interval,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // CryptoRank V2 API Routes
  app.get("/api/cryptorank/current", async (req, res) => {
    try {
      const { fetchSolanaCurrent } = await import('../api/cryptorank.js');
      const data = await fetchSolanaCurrent();
      
      res.json({
        success: true,
        type: 'current_data',
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/historical", (_req, res) => {
    return res
      .status(403)
      .json({
        success: false,
        error: "Historical price data not available on your CryptoRank plan.",
        timestamp: new Date().toISOString()
      });
  });

  // Health check endpoint with API key validation
  app.get("/api/health", (req, res) => {
    const apiKeys = {
      TAAPI_API_KEY: !!process.env.TAAPI_API_KEY,
      LUNARCRUSH_API_KEY: !!process.env.LUNARCRUSH_API_KEY,
      CRYPTORANK_API_KEY: !!process.env.CRYPTORANK_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL
    };

    const allConfigured = Object.values(apiKeys).every(Boolean);

    res.json({ 
      status: allConfigured ? 'OK' : 'PARTIAL',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      apiKeys,
      allConfigured
    });
  });

  // LunarCrush API v4 test endpoint
  app.get("/api/lunarcrush/test", async (req, res) => {
    try {
      if (!process.env.LUNARCRUSH_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "LunarCrush API key not configured. Please set LUNARCRUSH_API_KEY environment variable.",
          timestamp: new Date().toISOString()
        });
      }

      // Test with a simple public endpoint
      const url = 'https://lunarcrush.com/api4/public/coins/sol/v1';
      console.log('LunarCrush API v4 Test URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('LunarCrush Test Response Status:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('LunarCrush Test Response Body:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      res.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        authenticated: response.status !== 401 && response.status !== 403,
        data: response.ok ? data : null,
        error: !response.ok ? data.error || responseText : null,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('LunarCrush API Test Error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // LunarCrush API v4 integration - Updated endpoint with proper typing
  app.get("/api/lunarcrush/metrics", async (req, res) => {
    try {
      const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : 'sol';
      
      if (!process.env.LUNARCRUSH_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "LunarCrush API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const url = `https://lunarcrush.com/api4/public/coins/${symbol.toLowerCase()}/v1`;
      console.log('LunarCrush API v4 Request URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('LunarCrush API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LunarCrush API Error Response:', errorText);
        throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      console.log('LunarCrush API Response Data:', JSON.stringify(data, null, 2));

      if (data.error) {
        throw new Error(`LunarCrush API Error: ${data.error}`);
      }

      if (data.data) {
        const coinData = data.data;
        
        const metrics = {
          symbol: coinData.symbol || symbol.toUpperCase(),
          name: coinData.name || 'Solana',
          price: coinData.price || null,
          priceChange24h: coinData.percent_change_24h || null,
          volume24h: coinData.volume_24h || null,
          marketCap: coinData.market_cap || null,
          galaxyScore: coinData.galaxy_score || null,
          altRank: coinData.alt_rank || null,
          socialVolume: coinData.social_volume_24h || null,
          socialScore: coinData.social_score || null,
          socialContributors: coinData.social_contributors || null,
          socialDominance: coinData.social_dominance || null,
          marketDominance: coinData.market_dominance || null,
          correlationRank: coinData.correlation_rank || null,
          volatility: coinData.volatility || null
        };

        res.json({
          success: true,
          type: 'social_metrics',
          symbol: symbol.toUpperCase(),
          data: metrics,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No data found for the specified symbol');
      }
    } catch (error: any) {
      console.error('LunarCrush API Error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/lunarcrush/social", async (req, res) => {
    try {
      if (!process.env.LUNARCRUSH_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "LunarCrush API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const url = `https://lunarcrush.com/api4/public/coins/sol/time-series/v2`;
      console.log('LunarCrush Social API v4 Request URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const solana = data.data[0];
        
        const socialMetrics = {
          symbol: 'SOL',
          name: 'Solana',
          socialMetrics: {
            galaxyScore: {
              value: solana.gs,
              description: 'Galaxy Score™ - Overall health and performance metric'
            },
            altRank: {
              value: solana.acr,
              description: 'AltRank™ - Alternative ranking based on social activity'
            },
            socialVolume: {
              value: solana.sv,
              description: 'Total social media mentions and discussions'
            },
            socialScore: {
              value: solana.ss,
              description: 'Social engagement and sentiment score'
            },
            socialContributors: {
              value: solana.sc,
              description: 'Number of unique social contributors'
            },
            socialDominance: {
              value: solana.sd,
              description: 'Social dominance compared to other cryptocurrencies'
            }
          },
          marketMetrics: {
            price: solana.p,
            priceChange24h: solana.pc,
            volume24h: solana.v,
            marketCap: solana.mc,
            marketDominance: solana.md,
            correlationRank: solana.cr,
            volatility: solana.volatility
          }
        };

        res.json({
          success: true,
          type: 'detailed_social_metrics',
          data: socialMetrics,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No social metrics data found for Solana');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // CryptoRank API integration - Direct implementation
  app.get("/api/cryptorank/data", async (req, res) => {
    try {
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "CryptoRank API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_key: process.env.CRYPTORANK_API_KEY
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana?${params}`);
      const data = await response.json();

      if (data.data) {
        const solana = data.data;
        
        const fundamentalData = {
          id: solana.id,
          symbol: solana.symbol,
          name: solana.name,
          slug: solana.slug,
          currentPrice: {
            usd: solana.values?.USD?.price || null,
            btc: solana.values?.BTC?.price || null,
            eth: solana.values?.ETH?.price || null
          },
          marketCap: {
            usd: solana.values?.USD?.marketCap || null,
            rank: solana.values?.USD?.marketCapRank || null
          },
          volume24h: {
            usd: solana.values?.USD?.volume24h || null
          },
          priceChange: {
            percent1h: solana.values?.USD?.percentChange1h || null,
            percent24h: solana.values?.USD?.percentChange24h || null,
            percent7d: solana.values?.USD?.percentChange7d || null,
            percent30d: solana.values?.USD?.percentChange30d || null,
            percent1y: solana.values?.USD?.percentChange1y || null
          },
          supply: {
            circulating: solana.circulatingSupply || null,
            total: solana.totalSupply || null,
            max: solana.maxSupply || null
          },
          allTimeHigh: {
            price: solana.values?.USD?.athPrice || null,
            date: solana.values?.USD?.athDate || null,
            percentFromAth: solana.values?.USD?.percentFromAth || null
          },
          allTimeLow: {
            price: solana.values?.USD?.atlPrice || null,
            date: solana.values?.USD?.atlDate || null,
            percentFromAtl: solana.values?.USD?.percentFromAtl || null
          }
        };

        res.json({
          success: true,
          type: 'fundamental_data',
          data: fundamentalData,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No fundamental data found for Solana');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/historical", async (req, res) => {
    try {
      const { timeframe = '30d', currency = 'USD' } = req.query;
      
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "CryptoRank API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_key: process.env.CRYPTORANK_API_KEY,
        timeframe: timeframe,
        currency: currency
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana/chart?${params}`);
      const data = await response.json();

      if (data.data) {
        const historicalData = {
          symbol: 'SOL',
          currency,
          timeframe,
          prices: data.data.map((point: any) => ({
            timestamp: point.timestamp,
            date: new Date(point.timestamp * 1000).toISOString(),
            price: point.price,
            volume: point.volume || null,
            marketCap: point.marketCap || null
          })),
          metadata: {
            totalPoints: data.data.length,
            startDate: data.data.length > 0 ? new Date(data.data[0].timestamp * 1000).toISOString() : null,
            endDate: data.data.length > 0 ? new Date(data.data[data.data.length - 1].timestamp * 1000).toISOString() : null
          }
        };

        res.json({
          success: true,
          type: 'historical_prices',
          timeframe,
          currency,
          data: historicalData,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No historical data found for Solana');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/stats", async (req, res) => {
    try {
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "CryptoRank API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_key: process.env.CRYPTORANK_API_KEY
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana?${params}`);
      const data = await response.json();

      if (data.data) {
        const solana = data.data;
        
        const marketStats = {
          symbol: 'SOL',
          name: 'Solana',
          marketMetrics: {
            rank: solana.values?.USD?.marketCapRank || null,
            marketCap: solana.values?.USD?.marketCap || null,
            volume24h: solana.values?.USD?.volume24h || null,
            volumeMarketCapRatio: solana.values?.USD?.volume24h && solana.values?.USD?.marketCap ? 
              (solana.values.USD.volume24h / solana.values.USD.marketCap) : null,
            circulatingSupply: solana.circulatingSupply || null,
            totalSupply: solana.totalSupply || null,
            maxSupply: solana.maxSupply || null,
            supplyPercentage: solana.circulatingSupply && solana.totalSupply ? 
              (solana.circulatingSupply / solana.totalSupply * 100) : null
          },
          priceMetrics: {
            currentPrice: solana.values?.USD?.price || null,
            athPrice: solana.values?.USD?.athPrice || null,
            athDate: solana.values?.USD?.athDate || null,
            percentFromAth: solana.values?.USD?.percentFromAth || null,
            atlPrice: solana.values?.USD?.atlPrice || null,
            atlDate: solana.values?.USD?.atlDate || null,
            percentFromAtl: solana.values?.USD?.percentFromAtl || null
          },
          performanceMetrics: {
            change1h: solana.values?.USD?.percentChange1h || null,
            change24h: solana.values?.USD?.percentChange24h || null,
            change7d: solana.values?.USD?.percentChange7d || null,
            change30d: solana.values?.USD?.percentChange30d || null,
            change1y: solana.values?.USD?.percentChange1y || null
          }
        };

        res.json({
          success: true,
          type: 'market_statistics',
          data: marketStats,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No market statistics found for Solana');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/price", async (req, res) => {
    try {
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "CryptoRank API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_key: process.env.CRYPTORANK_API_KEY
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana?${params}`);
      const data = await response.json();

      if (data.data) {
        const solana = data.data;
        
        const priceData = {
          symbol: 'SOL',
          name: 'Solana',
          prices: {
            usd: solana.values?.USD?.price || null,
            btc: solana.values?.BTC?.price || null,
            eth: solana.values?.ETH?.price || null
          },
          changes: {
            percent1h: solana.values?.USD?.percentChange1h || null,
            percent24h: solana.values?.USD?.percentChange24h || null,
            percent7d: solana.values?.USD?.percentChange7d || null
          },
          volume: {
            usd24h: solana.values?.USD?.volume24h || null
          },
          marketCap: {
            usd: solana.values?.USD?.marketCap || null,
            rank: solana.values?.USD?.marketCapRank || null
          },
          lastUpdated: solana.lastUpdated || new Date().toISOString()
        };

        res.json({
          success: true,
          type: 'real_time_price',
          data: priceData,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No real-time price data found for Solana');
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Solana On-Chain Metrics API integration - Direct implementation
  app.get("/api/onchain/metrics", async (req, res) => {
    try {
      // Get epoch info from Solana RPC
      const epochPayload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getEpochInfo"
      };

      const epochResponse = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(epochPayload)
      });

      const epochData = await epochResponse.json();
      const epochInfo = epochData.result || {};

      // Get current slot
      const slotPayload = {
        jsonrpc: "2.0",
        id: 2,
        method: "getSlot"
      };

      const slotResponse = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotPayload)
      });

      const slotData = await slotResponse.json();
      const currentSlot = slotData.result || null;

      // Get block height
      const blockHeightPayload = {
        jsonrpc: "2.0",
        id: 3,
        method: "getBlockHeight"
      };

      const blockHeightResponse = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blockHeightPayload)
      });

      const blockHeightData = await blockHeightResponse.json();
      const blockHeight = blockHeightData.result || null;

      const metrics = {
        timestamp: new Date().toISOString(),
        source: 'solana_rpc',
        network: {
          currentSlot: currentSlot,
          blockHeight: blockHeight,
          epoch: epochInfo.epoch || null,
          slotIndex: epochInfo.slotIndex || null,
          slotsInEpoch: epochInfo.slotsInEpoch || null,
          absoluteSlot: epochInfo.absoluteSlot || null,
          transactionCount: epochInfo.transactionCount || null,
          epochProgress: epochInfo.slotIndex && epochInfo.slotsInEpoch ? 
            ((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(2) : null
        },
        note: "Real-time Solana blockchain data. For TPS and validator metrics, enhanced APIs available with authentication."
      };

      res.json({
        success: true,
        type: 'network_metrics',
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/onchain/validators", async (req, res) => {
    try {
      const response = await fetch('https://api.solanatracker.io/v1/validators');
      const data = await response.json();

      const validatorStats = {
        source: 'solana_tracker',
        timestamp: new Date().toISOString(),
        overview: {
          totalValidators: data.total_validators || null,
          activeValidators: data.active_validators || null,
          averageApy: data.average_apy || null,
          totalStake: data.total_stake || null,
          averageCommission: data.average_commission || null
        },
        topValidators: (data.validators || []).slice(0, 20).map((validator: any) => ({
          identity: validator.identity || null,
          name: validator.name || null,
          voteAccount: validator.vote_account || null,
          commission: validator.commission || null,
          lastVote: validator.last_vote || null,
          rootSlot: validator.root_slot || null,
          activatedStake: validator.activated_stake || null,
          epochVoteAccount: validator.epoch_vote_account || null,
          epochCredits: validator.epoch_credits || null,
          version: validator.version || null,
          apy: validator.apy || null
        }))
      };

      res.json({
        success: true,
        type: 'validator_stats',
        data: validatorStats,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/onchain/staking", async (req, res) => {
    try {
      const [validatorsResponse, epochResponse] = await Promise.all([
        fetch('https://api.solanatracker.io/v1/validators'),
        fetch('https://api.solanatracker.io/v1/epoch')
      ]);
      
      const [validatorsData, epochData] = await Promise.all([
        validatorsResponse.json(),
        epochResponse.json()
      ]);

      const stakingInfo = {
        source: 'solana_tracker',
        timestamp: new Date().toISOString(),
        overview: {
          averageApy: validatorsData.average_apy || null,
          totalStake: validatorsData.total_stake || null,
          averageCommission: validatorsData.average_commission || null,
          activeValidators: validatorsData.active_validators || null
        },
        epochInfo: {
          currentEpoch: epochData.epoch || null,
          epochProgress: epochData.slot_index && epochData.slots_in_epoch ? 
            (epochData.slot_index / epochData.slots_in_epoch * 100) : null,
          slotsRemaining: epochData.slot_index && epochData.slots_in_epoch ? 
            (epochData.slots_in_epoch - epochData.slot_index) : null,
          slotIndex: epochData.slot_index || null,
          slotsInEpoch: epochData.slots_in_epoch || null,
          absoluteSlot: epochData.absolute_slot || null
        }
      };

      // Calculate yield distribution if validator data available
      const validatorApys = (validatorsData.validators || [])
        .map((v: any) => v.apy)
        .filter((apy: any) => apy !== null && apy !== undefined)
        .sort((a: number, b: number) => b - a);

      if (validatorApys.length > 0) {
        (stakingInfo as any).yieldDistribution = {
          highest: validatorApys[0],
          median: validatorApys[Math.floor(validatorApys.length / 2)],
          lowest: validatorApys[validatorApys.length - 1],
          topQuartile: validatorApys[Math.floor(validatorApys.length * 0.25)],
          bottomQuartile: validatorApys[Math.floor(validatorApys.length * 0.75)]
        };
      }

      res.json({
        success: true,
        type: 'staking_yields',
        data: stakingInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/onchain/epoch", async (req, res) => {
    try {
      const response = await fetch('https://api.solanatracker.io/v1/epoch');
      const data = await response.json();

      const epochInfo = {
        source: 'solana_tracker',
        timestamp: new Date().toISOString(),
        currentEpoch: {
          epoch: data.epoch || null,
          slotIndex: data.slot_index || null,
          slotsInEpoch: data.slots_in_epoch || null,
          absoluteSlot: data.absolute_slot || null,
          blockHeight: data.block_height || null,
          transactionCount: data.transaction_count || null,
          progress: data.slot_index && data.slots_in_epoch ? 
            (data.slot_index / data.slots_in_epoch * 100) : null,
          slotsRemaining: data.slot_index && data.slots_in_epoch ? 
            (data.slots_in_epoch - data.slot_index) : null
        }
      };

      res.json({
        success: true,
        type: 'epoch_info',
        data: epochInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/onchain/tps", async (req, res) => {
    try {
      const response = await fetch('https://api.solanatracker.io/v1/network');
      const data = await response.json();

      const tpsData = {
        timestamp: new Date().toISOString(),
        source: 'solana_tracker',
        currentTps: data.tps || null,
        averageBlockTime: data.average_block_time || null,
        blockHeight: data.block_height || null,
        totalTransactions: data.total_transactions || null,
        metrics: {
          tps: data.tps || null,
          blockTime: data.average_block_time || null,
          throughput: data.tps && data.average_block_time ? 
            (data.tps * data.average_block_time) : null
        }
      };

      res.json({
        success: true,
        type: 'tps_monitoring',
        data: tpsData,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/onchain/overview", async (req, res) => {
    try {
      const [networkResponse, validatorsResponse, epochResponse] = await Promise.all([
        fetch('https://api.solanatracker.io/v1/network'),
        fetch('https://api.solanatracker.io/v1/validators'),
        fetch('https://api.solanatracker.io/v1/epoch')
      ]);

      const [networkData, validatorsData, epochData] = await Promise.all([
        networkResponse.json(),
        validatorsResponse.json(),
        epochResponse.json()
      ]);

      const overview = {
        timestamp: new Date().toISOString(),
        source: 'solana_tracker',
        network: {
          tps: networkData.tps || null,
          blockHeight: networkData.block_height || null,
          totalTransactions: networkData.total_transactions || null,
          averageBlockTime: networkData.average_block_time || null
        },
        validators: {
          total: validatorsData.total_validators || null,
          active: validatorsData.active_validators || null,
          averageApy: validatorsData.average_apy || null,
          totalStake: validatorsData.total_stake || null,
          averageCommission: validatorsData.average_commission || null
        },
        epoch: {
          current: epochData.epoch || null,
          progress: epochData.slot_index && epochData.slots_in_epoch ? 
            (epochData.slot_index / epochData.slots_in_epoch * 100) : null,
          slotIndex: epochData.slot_index || null,
          slotsInEpoch: epochData.slots_in_epoch || null,
          absoluteSlot: epochData.absolute_slot || null,
          blockHeight: epochData.block_height || null,
          transactionCount: epochData.transaction_count || null
        },
        health: {
          networkActive: networkData.tps ? networkData.tps > 0 : false,
          validatorsHealthy: validatorsData.active_validators && validatorsData.total_validators ? 
            (validatorsData.active_validators / validatorsData.total_validators > 0.8) : false,
          epochProgressing: epochData.slot_index && epochData.slots_in_epoch ? 
            (epochData.slot_index > 0) : false
        }
      };

      res.json({
        success: true,
        type: 'blockchain_overview',
        data: overview,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Solana TAAPI Pro integration - Direct implementation
  app.get("/api/solana/rsi", async (req, res) => {
    try {
      const { exchange = 'binance', interval = '1h', period = 14 } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "TAAPI API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        secret: process.env.TAAPI_API_KEY,
        exchange: exchange,
        symbol: 'SOL/USDT',
        interval: interval,
        period: period.toString()
      });

      const response = await fetch(`https://api.taapi.io/rsi?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        indicator: 'RSI',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        period: parseInt(period),
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/solana/macd", async (req, res) => {
    try {
      const { 
        exchange = 'binance', 
        interval = '1h', 
        fastPeriod = 12, 
        slowPeriod = 26, 
        signalPeriod = 9 
      } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "TAAPI API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        secret: process.env.TAAPI_API_KEY,
        exchange: exchange,
        symbol: 'SOL/USDT',
        interval: interval,
        fast_period: fastPeriod.toString(),
        slow_period: slowPeriod.toString(),
        signal_period: signalPeriod.toString()
      });

      const response = await fetch(`https://api.taapi.io/macd?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        indicator: 'MACD',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        parameters: {
          fastPeriod: parseInt(fastPeriod),
          slowPeriod: parseInt(slowPeriod),
          signalPeriod: parseInt(signalPeriod)
        },
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/solana/ema", async (req, res) => {
    try {
      const { exchange = 'binance', interval = '1h', period = 20 } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "TAAPI API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        secret: process.env.TAAPI_API_KEY,
        exchange: exchange,
        symbol: 'SOL/USDT',
        interval: interval,
        period: period.toString()
      });

      const response = await fetch(`https://api.taapi.io/ema?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        indicator: 'EMA',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        period: parseInt(period),
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/solana/analysis", async (req, res) => {
    try {
      const { exchange = 'binance', interval = '1h' } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "TAAPI API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      // Fetch multiple indicators for comprehensive analysis
      const indicators = ['rsi', 'macd', 'ema', 'sma'];
      const params = new URLSearchParams({
        secret: process.env.TAAPI_API_KEY,
        exchange: exchange,
        symbol: 'SOL/USDT',
        interval: interval,
        indicators: indicators.join(',')
      });

      const response = await fetch(`https://api.taapi.io/bulk?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        type: 'comprehensive_analysis',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        indicators,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Trading API endpoints
  app.get("/api/trading/test", (req, res) => {
    res.json({
      success: true,
      message: "Trading API endpoint is working",
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        "/api/trading/indicators/:symbol",
        "/api/trading/social/:symbol", 
        "/api/trading/market/:symbol",
        "/api/trading/ai-analysis",
        "/api/solana/rsi",
        "/api/solana/macd",
        "/api/solana/ema",
        "/api/solana/analysis"
      ]
    });
  });

  // Technical indicators endpoint
  app.get("/api/trading/indicators/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const { exchange = 'binance', interval = '1h' } = req.query;

    if (!process.env.TAAPI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "TAAPI API key not configured",
        timestamp: new Date().toISOString()
      });
    }

    try {
      const params = new URLSearchParams({
        secret: process.env.TAAPI_API_KEY,
        exchange: exchange,
        symbol,
        interval: interval
      });

      const response = await fetch(`https://api.taapi.io/rsi?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        symbol,
        exchange,
        interval,
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

  // Social metrics endpoint
  app.get("/api/trading/social/:symbol", async (req, res) => {
    const { symbol } = req.params;

    if (!process.env.LUNARCRUSH_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "LunarCrush API key not configured",
        timestamp: new Date().toISOString()
      });
    }

    try {
      const params = new URLSearchParams({
        data: 'assets',
        key: process.env.LUNARCRUSH_API_KEY,
        symbol
      });

      const response = await fetch(`https://api.lunarcrush.com/v2?${params}`);
      const data = await response.json();

      res.json({
        success: true,
        symbol,
        data: data.data?.[0] || null,
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

  // Market data endpoint
  app.get("/api/trading/market/:symbol", async (req, res) => {
    const { symbol } = req.params;

    if (!process.env.CRYPTORANK_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "CryptoRank API key not configured",
        timestamp: new Date().toISOString()
      });
    }

    try {
      const response = await fetch(`https://api.cryptorank.io/v1/currencies/${symbol}`, {
        headers: {
          'X-API-KEY': process.env.CRYPTORANK_API_KEY
        }
      });
      const data = await response.json();

      res.json({
        success: true,
        symbol,
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

  // AI analysis endpoint
  app.post("/api/trading/ai-analysis", async (req, res) => {
    const { marketData, symbol } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "OpenAI API key not configured",
        timestamp: new Date().toISOString()
      });
    }

    if (!marketData || !symbol) {
      return res.status(400).json({
        success: false,
        error: "Market data and symbol are required",
        timestamp: new Date().toISOString()
      });
    }

    try {
      const prompt = `Analyze the following market data for ${symbol}:

${JSON.stringify(marketData, null, 2)}

Provide a brief analysis including:
1. Overall sentiment (bullish/bearish/neutral)
2. Key technical signals
3. Risk assessment

Keep response concise and professional.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional cryptocurrency market analyst.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      const aiData = await response.json();

      res.json({
        success: true,
        symbol,
        analysis: aiData.choices[0].message.content,
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

  // Astrological Data API integration - Direct implementation using Astronomy Engine
  app.get("/api/astrology/moon-phase", async (req, res) => {
    try {
      const astroModule = await import('astronomy-engine');
      const Astronomy = astroModule.default || astroModule;
      const date = req.query.date ? new Date(req.query.date) : new Date();
      
      const astroDate = new Astronomy.AstroTime(date);
      const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, astroDate);
      const moonPhase = Astronomy.MoonPhase(astroDate);
      const moonPos = Astronomy.EclipticGeoMoon(astroDate);
      
      const zodiacSigns = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
      ];
      
      const zodiacIndex = Math.floor(moonPos.lon / 30);
      const zodiacSign = zodiacSigns[zodiacIndex];
      const degreeInSign = moonPos.lon % 30;
      
      const getMoonPhaseName = (phase: number) => {
        if (phase < 0.125) return 'New Moon';
        if (phase < 0.25) return 'Waxing Crescent';
        if (phase < 0.375) return 'First Quarter';
        if (phase < 0.5) return 'Waxing Gibbous';
        if (phase < 0.625) return 'Full Moon';
        if (phase < 0.75) return 'Waning Gibbous';
        if (phase < 0.875) return 'Last Quarter';
        return 'Waning Crescent';
      };

      res.json({
        success: true,
        timestamp: date.toISOString(),
        source: 'astronomy_engine',
        moonPhase: {
          phase: moonPhase,
          phaseName: getMoonPhaseName(moonPhase),
          illumination: moonIllum.fraction * 100,
          position: {
            longitude: moonPos.lon,
            latitude: moonPos.lat,
            zodiacSign: zodiacSign,
            degreeInSign: degreeInSign.toFixed(2)
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/planetary-positions", async (req, res) => {
    try {
      const astroModule = await import('astronomy-engine');
      const Astronomy = astroModule.default || astroModule;
      const date = req.query.date ? new Date(req.query.date) : new Date();
      
      const astroDate = new Astronomy.AstroTime(date);
      const zodiacSigns = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
      ];
      
      const planets = {
        sun: Astronomy.Body.Sun,
        moon: Astronomy.Body.Moon,
        mercury: Astronomy.Body.Mercury,
        venus: Astronomy.Body.Venus,
        mars: Astronomy.Body.Mars,
        jupiter: Astronomy.Body.Jupiter,
        saturn: Astronomy.Body.Saturn,
        uranus: Astronomy.Body.Uranus,
        neptune: Astronomy.Body.Neptune,
        pluto: Astronomy.Body.Pluto
      };
      
      const positions: Record<string, any> = {};
      
      // Calculate each planet's position individually
      try {
        // Moon position (special case)
        const moonPos = Astronomy.EclipticGeoMoon(astroDate);
        const moonZodiacIndex = Math.floor((moonPos as any).lon / 30);
        positions.moon = {
          longitude: (moonPos as any).lon,
          latitude: (moonPos as any).lat,
          zodiacSign: zodiacSigns[moonZodiacIndex],
          degreeInSign: ((moonPos as any).lon % 30).toFixed(2)
        };
      } catch (error) {
        positions.moon = { error: 'Calculation failed' };
      }

      // Sun and planets using GeoVector and Ecliptic conversion
      const planetBodies = {
        sun: Astronomy.Body.Sun,
        mercury: Astronomy.Body.Mercury,
        venus: Astronomy.Body.Venus,
        mars: Astronomy.Body.Mars,
        jupiter: Astronomy.Body.Jupiter,
        saturn: Astronomy.Body.Saturn,
        uranus: Astronomy.Body.Uranus,
        neptune: Astronomy.Body.Neptune,
        pluto: Astronomy.Body.Pluto
      };

      Object.entries(planetBodies).forEach(([name, body]) => {
        try {
          const vector = Astronomy.GeoVector(body, astroDate, false);
          const pos = Astronomy.Ecliptic(vector);
          
          const zodiacIndex = Math.floor((pos as any).elon / 30);
          const zodiacSign = zodiacSigns[zodiacIndex];
          const degreeInSign = (pos as any).elon % 30;
          
          positions[name] = {
            longitude: (pos as any).elon,
            latitude: (pos as any).elat,
            zodiacSign: zodiacSign,
            degreeInSign: degreeInSign.toFixed(2)
          };
        } catch (planetError) {
          positions[name] = { error: `Calculation failed: ${planetError}` };
        }
      });

      res.json({
        success: true,
        timestamp: date.toISOString(),
        source: 'astronomy_engine',
        positions: positions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/aspects", async (req, res) => {
    try {
      const astroModule = await import('astronomy-engine');
      const Astronomy = astroModule.default || astroModule;
      const date = req.query.date ? new Date(req.query.date) : new Date();
      const orb = req.query.orb ? parseFloat(req.query.orb) : 8;
      
      res.json({
        success: true,
        timestamp: date.toISOString(),
        source: 'astronomy_engine',
        aspects: {
          note: 'Planetary aspects calculation - feature under development',
          orb: orb,
          date: date.toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/lunar-calendar", async (req, res) => {
    try {
      const astroModule = await import('astronomy-engine');
      const Astronomy = astroModule.default || astroModule;
      const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        source: 'astronomy_engine',
        lunarCalendar: {
          year: year,
          month: month,
          note: 'Lunar calendar calculation - feature under development'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/report", async (req, res) => {
    try {
      const astroModule = await import('astronomy-engine');
      const Astronomy = astroModule.default || astroModule;
      const date = req.query.date ? new Date(req.query.date) : new Date();
      
      res.json({
        success: true,
        timestamp: date.toISOString(),
        source: 'astronomy_engine',
        report: {
          date: date.toISOString(),
          note: 'Comprehensive astrological report - feature under development'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Simple unified data endpoint without caching (for now)
  app.get("/api/unified/analysis", async (req, res) => {
    try {
      const allApiData: any = {};

      // Collect data from all APIs
      try {
        const taapiResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/api/taapi/indicators/multiple?symbol=SOL/USDT`);
        if (taapiResponse.ok) {
          allApiData.taapi = await taapiResponse.json();
        }
      } catch (error) {
        allApiData.taapi = { success: false, error: 'Failed to fetch TAAPI data' };
      }

      try {
        const lunarResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/api/lunarcrush/metrics?symbol=SOL`);
        if (lunarResponse.ok) {
          allApiData.lunarcrush = await lunarResponse.json();
        }
      } catch (error) {
        allApiData.lunarcrush = { success: false, error: 'Failed to fetch LunarCrush data' };
      }

      try {
        const cryptorankResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/api/cryptorank/solana`);
        if (cryptorankResponse.ok) {
          allApiData.cryptorank = await cryptorankResponse.json();
        }
      } catch (error) {
        allApiData.cryptorank = { success: false, error: 'Failed to fetch CryptoRank data' };
      }

      try {
        const onchainResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/api/onchain/overview`);
        if (onchainResponse.ok) {
          allApiData.onchain = await onchainResponse.json();
        }
      } catch (error) {
        allApiData.onchain = { success: false, error: 'Failed to fetch on-chain data' };
      }

      try {
        const astrologyResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/api/astrology/report`);
        if (astrologyResponse.ok) {
          allApiData.astrology = await astrologyResponse.json();
        }
      } catch (error) {
        allApiData.astrology = { success: false, error: 'Failed to fetch astrology data' };
      }

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        source: 'live_aggregation',
        data: allApiData,
        meta: {
          apis_queried: Object.keys(allApiData).length,
          note: 'Advanced caching and normalization features available - see documentation'
        }
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Comprehensive Trading Analysis Endpoint
  app.get("/api/analysis/complete", async (req, res) => {
    try {
      // Import scoring and normalization modules
      const { 
        computeMasterScore, 
        getScoreBreakdown, 
        interpretMasterScore 
      } = await import('../services/scorers.js');
      
      const { 
        normalizeMetrics, 
        initializeNormalization 
      } = await import('../services/normalize.js');

      // Initialize normalization bounds if not already done
      try {
        await initializeNormalization();
      } catch (initError) {
        console.warn('Normalization initialization failed, using defaults:', initError);
      }

      // Collect raw metrics from all API sources
      const rawMetrics: Record<string, number> = {};
      
      // Technical metrics from TAAPI
      if (process.env.TAAPI_API_KEY) {
        try {
          const technicalIndicators = ['rsi', 'ema', 'sma', 'macd', 'bbands', 'atr', 'vwap'];
          for (const indicator of technicalIndicators) {
            const url = `https://api.taapi.io/${indicator}?secret=${process.env.TAAPI_API_KEY}&exchange=binance&symbol=SOL/USDT&interval=1h`;
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              
              switch (indicator) {
                case 'rsi':
                  rawMetrics.rsi_1h = data.value;
                  break;
                case 'ema':
                  // Get multiple EMA periods
                  const ema8Url = `https://api.taapi.io/ema?secret=${process.env.TAAPI_API_KEY}&exchange=binance&symbol=SOL/USDT&interval=1h&period=8`;
                  const ema21Url = `https://api.taapi.io/ema?secret=${process.env.TAAPI_API_KEY}&exchange=binance&symbol=SOL/USDT&interval=1h&period=21`;
                  
                  const ema8Response = await fetch(ema8Url);
                  const ema21Response = await fetch(ema21Url);
                  
                  if (ema8Response.ok) {
                    const ema8Data = await ema8Response.json();
                    rawMetrics.ema8 = ema8Data.value;
                  }
                  if (ema21Response.ok) {
                    const ema21Data = await ema21Response.json();
                    rawMetrics.ema21 = ema21Data.value;
                  }
                  break;
                case 'sma':
                  // Get multiple SMA periods
                  const sma50Url = `https://api.taapi.io/sma?secret=${process.env.TAAPI_API_KEY}&exchange=binance&symbol=SOL/USDT&interval=1h&period=50`;
                  const sma200Url = `https://api.taapi.io/sma?secret=${process.env.TAAPI_API_KEY}&exchange=binance&symbol=SOL/USDT&interval=4h&period=200`;
                  
                  const sma50Response = await fetch(sma50Url);
                  const sma200Response = await fetch(sma200Url);
                  
                  if (sma50Response.ok) {
                    const sma50Data = await sma50Response.json();
                    rawMetrics.sma50 = sma50Data.value;
                  }
                  if (sma200Response.ok) {
                    const sma200Data = await sma200Response.json();
                    rawMetrics.sma200 = sma200Data.value;
                  }
                  break;
                case 'macd':
                  rawMetrics.macd_1h = data.valueMACD;
                  break;
                case 'bbands':
                  if (data.valueUpperBand && data.valueLowerBand) {
                    rawMetrics.bollingerWidth_1h = data.valueUpperBand - data.valueLowerBand;
                  }
                  break;
                case 'atr':
                  rawMetrics.atr_1h = data.value;
                  break;
                case 'vwap':
                  rawMetrics.vwap_price_spread = data.value;
                  break;
              }
            }
          }
        } catch (error) {
          console.warn('TAAPI data collection failed:', error);
        }
      }

      // Social metrics from LunarCrush
      if (process.env.LUNARCRUSH_API_KEY) {
        try {
          const lunarCrushUrl = 'https://lunarcrush.com/api4/public/coins/sol/v1';
          const response = await fetch(lunarCrushUrl, {
            headers: {
              'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              rawMetrics.galaxyScore = data.data.galaxy_score;
              rawMetrics.socialVolume = data.data.social_volume;
              rawMetrics.lunarcrushSentiment = data.data.sentiment;
              rawMetrics.tweetCount = data.data.tweets;
            }
          }
        } catch (error) {
          console.warn('LunarCrush data collection failed:', error);
        }
      }

      // Fundamental metrics from CryptoRank
      if (process.env.CRYPTORANK_API_KEY) {
        try {
          const cryptoRankUrl = `https://api.cryptorank.io/v1/currencies/solana?api_key=${process.env.CRYPTORANK_API_KEY}`;
          const response = await fetch(cryptoRankUrl);
          
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              rawMetrics.marketCapUsd = data.data.values.USD.marketCap;
              rawMetrics.fullyDilutedValuation = data.data.values.USD.fullyDilutedValuation;
              rawMetrics.circulatingSupplyPct = (data.data.circulatingSupply / data.data.maxSupply) * 100;
            }
          }
        } catch (error) {
          console.warn('CryptoRank data collection failed:', error);
        }
      }

      // On-chain metrics
      try {
        const solanaTrackerUrl = 'https://data.solanatracker.io/performance';
        const response = await fetch(solanaTrackerUrl);
        
        if (response.ok) {
          const data = await response.json();
          rawMetrics.tps = data.tps;
          rawMetrics.activeAddresses = data.activeAddresses || 0;
        }
      } catch (error) {
        console.warn('On-chain data collection failed:', error);
      }

      // Astrological metrics
      try {
        const astroModule = await import('astronomy-engine');
        const Astronomy = astroModule.default || astroModule;
        const astroDate = new Astronomy.AstroTime(new Date());
        
        // Lunar phase calculation
        const moonIllumination = Astronomy.Illumination(Astronomy.Body.Moon, astroDate);
        rawMetrics.lunarPhasePercentile = (moonIllumination as any).phase_fraction * 100;
        
        // Lunar distance calculation
        const moonPos = Astronomy.GeoVector(Astronomy.Body.Moon, astroDate, false);
        rawMetrics.lunarPerigeeApogeeDist = moonPos.length;
        
        // Planetary aspects
        const sunPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Sun, astroDate, false));
        const marsPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Mars, astroDate, false));
        const saturnPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Saturn, astroDate, false));
        const jupiterPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Jupiter, astroDate, false));
        
        // Calculate aspect angles
        let marsSunAngle = Math.abs((sunPos as any).elon - (marsPos as any).elon);
        if (marsSunAngle > 180) marsSunAngle = 360 - marsSunAngle;
        rawMetrics.marsSunAspect = marsSunAngle;
        
        let saturnJupiterAngle = Math.abs((saturnPos as any).elon - (jupiterPos as any).elon);
        if (saturnJupiterAngle > 180) saturnJupiterAngle = 360 - saturnJupiterAngle;
        rawMetrics.saturnJupiterAspect = saturnJupiterAngle;
        
        // Solar ingress indicators
        rawMetrics.solarIngressAries = Math.abs((sunPos as any).elon) < 1 ? 1 : 0;
        rawMetrics.solarIngressLibra = Math.abs((sunPos as any).elon - 180) < 1 ? 1 : 0;
        
        // Default values for other astrological metrics
        rawMetrics.northNodeSolanaLongitude = (sunPos as any).elon; // Simplified
        rawMetrics.nodeIngressData = 0;
        rawMetrics.siriusRisingIndicator = 0;
        rawMetrics.aldebaranConjunctionIndicator = 0;
        
      } catch (error) {
        console.warn('Astrological data calculation failed:', error);
      }

      // Add default values for missing metrics
      const defaultMetrics = {
        // Technical
        rsi_4h: rawMetrics.rsi_1h || 50,
        macd_4h: rawMetrics.macd_1h || 0,
        bookDepthImbalance: 0,
        dexCexVolumeRatio: 1,
        
        // Social  
        telegramPostVolume: 0,
        twitterPolarity: 0,
        whaleTxCount: 0,
        cryptoNewsHeadlineCount: 0,
        githubReleaseNewsCount: 0,
        
        // Fundamental
        stakingYield: 7,
        defiTvl: 0,
        whaleFlowUsd: 0,
        githubCommitsCount: 0,
        githubPullsCount: 0,
        btcDominance: 55,
        totalCryptoMarketCapExStablecoins: 2500000000000
      };

      // Merge default values for missing metrics
      Object.entries(defaultMetrics).forEach(([key, value]) => {
        if (rawMetrics[key] === undefined) {
          rawMetrics[key] = value;
        }
      });

      // Normalize all metrics to 0-100 scale
      const normalizedMetrics = normalizeMetrics(rawMetrics);
      
      // Calculate comprehensive scores
      const scoreBreakdown = getScoreBreakdown(normalizedMetrics);
      const masterScore = computeMasterScore(normalizedMetrics);
      const tradingSignal = interpretMasterScore(masterScore);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        analysis: {
          rawMetrics,
          normalizedMetrics,
          scores: {
            breakdown: scoreBreakdown,
            master: masterScore,
            signal: tradingSignal
          },
          interpretation: {
            overall: `Master Score: ${masterScore.toFixed(1)}/100`,
            signal: `${tradingSignal.signal} (${tradingSignal.confidence} confidence)`,
            summary: `Technical: ${scoreBreakdown.mainPillars.technical}, Social: ${scoreBreakdown.mainPillars.social}, Fundamental: ${scoreBreakdown.mainPillars.fundamental}, Astrology: ${scoreBreakdown.mainPillars.astrology}`
          }
        },
        dataSource: {
          technical: process.env.TAAPI_API_KEY ? 'TAAPI Pro' : 'Unavailable',
          social: process.env.LUNARCRUSH_API_KEY ? 'LunarCrush v4' : 'Unavailable',
          fundamental: process.env.CRYPTORANK_API_KEY ? 'CryptoRank' : 'Unavailable',
          onchain: 'Solana Tracker',
          astrology: 'Astronomy Engine'
        }
      });

    } catch (error: any) {
      console.error('Complete analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Dashboard API endpoints for live predictions
  app.get("/api/predictions/latest", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: "Database not configured - Supabase credentials required",
          timestamp: new Date().toISOString()
        });
      }

      const { data, error } = await supabase
        .from('live_predictions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      res.json({
        success: true,
        data: data || null,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error fetching latest prediction:", error.message || error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/news/recent", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: "Database not configured - Supabase credentials required",
          timestamp: new Date().toISOString()
        });
      }

      const limit = parseInt(req.query.limit) || 20;
      
      const { data, error } = await supabase
        .from('news_scores')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: data || [],
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error fetching recent news scores:", error.message || error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/updates/today", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: "Database not configured - Supabase credentials required",
          timestamp: new Date().toISOString()
        });
      }

      const todayDate = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_updates')
        .select('*')
        .eq('date', todayDate)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      res.json({
        success: true,
        data: data || null,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error fetching today's update:", error.message || error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // ADVANCED FINANCIAL ASTROLOGY ENDPOINTS
  app.get("/api/astrology/financial-index", async (req, res) => {
    try {
      const { computeFinancialAstrologyIndex } = await import('../services/financialAstrology.js');
      const date = req.query.date ? new Date(req.query.date) : new Date();
      
      const financialIndex = computeFinancialAstrologyIndex(date);
      
      res.json({
        success: true,
        data: financialIndex,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Financial astrology index error:", error.message || error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/weighted-aspects", async (req, res) => {
    try {
      const { computeWeightedAspectScore } = await import('../services/financialAstrology.js');
      const date = req.query.date ? new Date(req.query.date) : new Date();
      
      const aspectScore = computeWeightedAspectScore(date);
      
      res.json({
        success: true,
        data: aspectScore,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Weighted aspects error:", error.message || error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/planetary-stations", async (req, res) => {
    try {
      const { computeStationScore } = await import('../services/financialAstrology.js');
      const date = req.query.date ? new Date(req.query.date) : new Date();
      
      const stationScore = computeStationScore(date);
      
      res.json({
        success: true,
        data: stationScore,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Planetary stations error:", error.message || error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Store new prediction in database
  app.post("/api/predictions/store", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: "Database not configured - Supabase credentials required",
          timestamp: new Date().toISOString()
        });
      }

      const prediction = req.body;
      
      // Normalize values to proper score ranges while preserving authentic data
      const normalizeScore = (value: number) => {
        if (typeof value !== 'number' || isNaN(value)) return 0;
        
        // Handle extremely large values (like market cap data) by normalizing to 0-100 scale
        if (value > 1000) {
          // Log scale normalization for very large numbers
          const logValue = Math.log10(value);
          const normalizedValue = Math.min(100, (logValue - 1) * 10); // Scales log values to 0-100
          return Math.round(normalizedValue * 100) / 100;
        }
        
        // Normal range scores (0-100)
        return Math.min(Math.max(0, Math.round(value * 100) / 100), 100);
      };
      
      const clampConfidence = (value: number) => {
        if (typeof value !== 'number' || isNaN(value)) return 0;
        return Math.min(Math.max(0, Math.round(value * 10000) / 10000), 1);
      };
      
      const { data, error } = await supabase
        .from('live_predictions')
        .insert({
          overall_score: normalizeScore(prediction.overall_score),
          classification: prediction.classification || 'Neutral',
          confidence: clampConfidence(prediction.confidence),
          technical_score: normalizeScore(prediction.technical_score),
          social_score: normalizeScore(prediction.social_score),
          fundamental_score: normalizeScore(prediction.fundamental_score),
          astrology_score: normalizeScore(prediction.astrology_score),
          price_target: prediction.price_target ? normalizeScore(prediction.price_target) : null,
          risk_level: prediction.risk_level || 'Medium'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Automatically trigger weight suggestions after storing prediction
      try {
        const response = await fetch('http://localhost:5000/api/openai/suggest-weights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          console.log('[Auto Weight Suggestion] Weight suggestions generated after prediction storage');
        } else {
          console.warn('[Auto Weight Suggestion] Failed to generate weights:', response.status);
        }
      } catch (weightError: any) {
        console.warn('[Auto Weight Suggestion] Error generating weights:', weightError.message);
        // Don't fail the prediction storage if weight suggestions fail
      }

      res.json({
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error storing prediction:", error.message || error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/predictions/history", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: "Database not configured",
          timestamp: new Date().toISOString()
        });
      }

      const limit = parseInt(req.query.limit) || 24;
      
      const { data, error } = await supabase
        .from('live_predictions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: data || [],
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Endpoint to trigger manual prediction generation
  app.post("/api/predictions/generate", async (req, res) => {
    try {
      const { runPredictionLive } = await import('../services/prediction.js');
      await runPredictionLive();
      
      res.json({
        success: true,
        message: "Prediction generated successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
