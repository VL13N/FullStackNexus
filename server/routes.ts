import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // LunarCrush API v4 integration - Updated endpoint
  app.get("/api/lunarcrush/metrics", async (req, res) => {
    try {
      const { symbol = 'sol' } = req.query;
      
      if (!process.env.LUNARCRUSH_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "LunarCrush API key not configured",
          timestamp: new Date().toISOString()
        });
      }

      const url = `https://lunarcrush.com/api4/public/coins/${symbol}/v1`;
      console.log('LunarCrush API v4 Request URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('LunarCrush API Response Status:', response.status, response.statusText);

      const data = await response.json();
      console.log('LunarCrush API Response Data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${data.error || response.statusText}`);
      }

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
        timeframe: timeframe as string,
        currency: currency as string
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
        exchange: exchange as string,
        symbol: 'SOL/USDT',
        interval: interval as string,
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
        period: parseInt(period as string),
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
        exchange: exchange as string,
        symbol: 'SOL/USDT',
        interval: interval as string,
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
          fastPeriod: parseInt(fastPeriod as string),
          slowPeriod: parseInt(slowPeriod as string),
          signalPeriod: parseInt(signalPeriod as string)
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
        exchange: exchange as string,
        symbol: 'SOL/USDT',
        interval: interval as string,
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
        period: parseInt(period as string),
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
        exchange: exchange as string,
        symbol: 'SOL/USDT',
        interval: interval as string,
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
        exchange: exchange as string,
        symbol,
        interval: interval as string
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
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
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
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
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
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const orb = req.query.orb ? parseFloat(req.query.orb as string) : 8;
      
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
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      
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
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
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

  const httpServer = createServer(app);
  return httpServer;
}
