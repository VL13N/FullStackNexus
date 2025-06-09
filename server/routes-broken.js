// Removed TypeScript import - using standard JavaScript
import { createServer } from "http";
import { storage } from "./storage";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
let supabasey = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URLSUPABASE_KEY);
  console.log("Supabase client initialized successfully");
} else {
  console.warn("Supabase credentials not found - database endpoints will be unavailable");
}

// NOTEAPI's MACD parameters must be camelCase (fastPeriodslowPeriodsignalPeriod).
// If you still see authentication errorscheck TAAPI dashboard → Usage for quota and IP Access.

console.log("TAAPI key in use:"process.env.TAAPI_API_KEY);
if (!process.env.TAAPI_API_KEY) {
  throw new Error("TAAPI_API_KEY is undefined—check Replit Secrets and restart.");
}

export async function registerRoutes(app)omise<Server> {
  // TAAPI Pro API Routes
  app.get("/api/taapi/rsi"async (reqres) => {
    try {
      const { fetchTAIndicator } = await import('../api/taapi.js');
      const interval = req.query.interval || '1h';
      const value = await fetchTAIndicator('rsi'interval);
      
      res.json({
        successue,
        indicator: 'RSI',
        value,
        interval,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/taapi/macd"async (reqres) => {
    try {
      const { fetchTAIndicator } = await import('../api/taapi.js');
      const interval = req.query.interval || '1h';
      const value = await fetchTAIndicator('macd'interval);
      
      res.json({
        successue,
        indicator: 'MACD',
        value,
        interval,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/taapi/bulk"async (reqres) => {
    try {
      const { fetchBulkIndicators } = await import('../api/taapi.js');
      const interval = req.query.interval || '1h';
      const data = await fetchBulkIndicators(interval);
      
      res.json({
        successue,
        type: 'bulk_indicators',
        data,
        interval,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // CryptoRank V2 API Routes
  app.get("/api/cryptorank/current"async (reqres) => {
    try {
      const { fetchSolanaCurrent } = await import('../api/cryptorank.js');
      const data = await fetchSolanaCurrent();
      
      res.json({
        successue,
        type: 'current_data',
        data,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/historical"(_reqres) => {
    return res
      .status(403)
      .json({
        successlse,
        error: "Historical price data not available on your CryptoRank plan.",
        timestampw Date().toISOString()
      });
  });

  // Health check endpoint with API key validation
  app.get("/api/health"(reqres) => {
    const apiKeys = {
      TAAPI_API_KEY: !!process.env.TAAPI_API_KEY,
      LUNARCRUSH_API_KEY: !!process.env.LUNARCRUSH_API_KEY,
      CRYPTORANK_API_KEY: !!process.env.CRYPTORANK_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL
    };

    const allConfigured = Object.values(apiKeys).every(Boolean);

    res.json({ 
      statuslConfigured ? 'OK' : 'PARTIAL',
      timestampw Date().toISOString(),
      environmentocess.env.NODE_ENV || 'development',
      apiKeys,
      allConfigured
    });
  });

  // LunarCrush API v4 test endpoint
  app.get("/api/lunarcrush/test"async (reqres) => {
    try {
      if (!process.env.LUNARCRUSH_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "LunarCrush API key not configured. Please set LUNARCRUSH_API_KEY environment variable.",
          timestampw Date().toISOString()
        });
      }

      // Test with a simple public endpoint
      const url = 'https://lunarcrush.com/api4/public/coins/sol/v1';
      console.log('LunarCrush API v4 Test URL:'url);

      const response = await fetch(url{
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('LunarCrush Test Response Status:'response.statusresponse.statusText);
      
      const responseText = await response.text();
      console.log('LunarCrush Test Response Body:'responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      res.json({
        successsponse.ok,
        statussponse.status,
        statusTextsponse.statusText,
        authenticatedsponse.status !== 401 && response.status !== 403,
        datasponse.ok ? data ll,
        error: !response.ok ? data.error || responseText ll,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      console.error('LunarCrush API Test Error:'error);
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // LunarCrush API v4 integration - Updated endpoint with proper typing
  app.get("/api/lunarcrush/metrics"async (reqres) => {
    try {
      const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : 'sol';
      
      if (!process.env.LUNARCRUSH_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "LunarCrush API key not configured",
          timestampw Date().toISOString()
        });
      }

      const url = `https://lunarcrush.com/api4/public/coins/${symbol.toLowerCase()}/v1`;
      console.log('LunarCrush API v4 Request URL:'url);

      const response = await fetch(url{
        headers: {
          'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('LunarCrush API Response Status:'response.statusresponse.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LunarCrush API Error Response:'errorText);
        throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      console.log('LunarCrush API Response Data:'JSON.stringify(datanull2));

      if (data.error) {
        throw new Error(`LunarCrush API Error: ${data.error}`);
      }

      if (data.data) {
        const coinData = data.data;
        
        const metrics = {
          symbolinData.symbol || symbol.toUpperCase(),
          nameinData.name || 'Solana',
          priceinData.price || null,
          priceChange24hinData.percent_change_24h || null,
          volume24hinData.volume_24h || null,
          marketCapinData.market_cap || null,
          galaxyScoreinData.galaxy_score || null,
          altRankinData.alt_rank || null,
          socialVolumeinData.social_volume_24h || null,
          socialScoreinData.social_score || null,
          socialContributorsinData.social_contributors || null,
          socialDominanceinData.social_dominance || null,
          marketDominanceinData.market_dominance || null,
          correlationRankinData.correlation_rank || null,
          volatilityinData.volatility || null
        };

        res.json({
          successue,
          type: 'social_metrics',
          symbolmbol.toUpperCase(),
          datatrics,
          timestampw Date().toISOString()
        });
      } else {
        throw new Error('No data found for the specified symbol');
      }
    } catch (errory) {
      console.error('LunarCrush API Error:'error);
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/lunarcrush/social"async (reqres) => {
    try {
      if (!process.env.LUNARCRUSH_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "LunarCrush API key not configured",
          timestampw Date().toISOString()
        });
      }

      const url = `https://lunarcrush.com/api4/public/coins/sol/time-series/v2`;
      console.log('LunarCrush Social API v4 Request URL:'url);

      const response = await fetch(url{
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
              valuelana.gs,
              description: 'Galaxy Score™ - Overall health and performance metric'
            },
            altRank: {
              valuelana.acr,
              description: 'AltRank™ - Alternative ranking based on social activity'
            },
            socialVolume: {
              valuelana.sv,
              description: 'Total social media mentions and discussions'
            },
            socialScore: {
              valuelana.ss,
              description: 'Social engagement and sentiment score'
            },
            socialContributors: {
              valuelana.sc,
              description: 'Number of unique social contributors'
            },
            socialDominance: {
              valuelana.sd,
              description: 'Social dominance compared to other cryptocurrencies'
            }
          },
          marketMetrics: {
            pricelana.p,
            priceChange24hlana.pc,
            volume24hlana.v,
            marketCaplana.mc,
            marketDominancelana.md,
            correlationRanklana.cr,
            volatilitylana.volatility
          }
        };

        res.json({
          successue,
          type: 'detailed_social_metrics',
          datacialMetrics,
          timestampw Date().toISOString()
        });
      } else {
        throw new Error('No social metrics data found for Solana');
      }
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // CryptoRank API integration - Direct implementation
  app.get("/api/cryptorank/data"async (reqres) => {
    try {
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "CryptoRank API key not configured",
          timestampw Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_keyocess.env.CRYPTORANK_API_KEY
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana?${params}`);
      const data = await response.json();

      if (data.data) {
        const solana = data.data;
        
        const fundamentalData = {
          idlana.id,
          symbollana.symbol,
          namelana.name,
          sluglana.slug,
          currentPrice: {
            usdlana.values?.USD?.price || null,
            btclana.values?.BTC?.price || null,
            ethlana.values?.ETH?.price || null
          },
          marketCap: {
            usdlana.values?.USD?.marketCap || null,
            ranklana.values?.USD?.marketCapRank || null
          },
          volume24h: {
            usdlana.values?.USD?.volume24h || null
          },
          priceChange: {
            percent1hlana.values?.USD?.percentChange1h || null,
            percent24hlana.values?.USD?.percentChange24h || null,
            percent7dlana.values?.USD?.percentChange7d || null,
            percent30dlana.values?.USD?.percentChange30d || null,
            percent1ylana.values?.USD?.percentChange1y || null
          },
          supply: {
            circulatinglana.circulatingSupply || null,
            totallana.totalSupply || null,
            maxlana.maxSupply || null
          },
          allTimeHigh: {
            pricelana.values?.USD?.athPrice || null,
            datelana.values?.USD?.athDate || null,
            percentFromAthlana.values?.USD?.percentFromAth || null
          },
          allTimeLow: {
            pricelana.values?.USD?.atlPrice || null,
            datelana.values?.USD?.atlDate || null,
            percentFromAtllana.values?.USD?.percentFromAtl || null
          }
        };

        res.json({
          successue,
          type: 'fundamental_data',
          datandamentalData,
          timestampw Date().toISOString()
        });
      } else {
        throw new Error('No fundamental data found for Solana');
      }
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/historical"async (reqres) => {
    try {
      const { timeframe = '30d'currency = 'USD' } = req.query;
      
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "CryptoRank API key not configured",
          timestampw Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_keyocess.env.CRYPTORANK_API_KEY,
        timeframemeframe,
        currencyrrency
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana/chart?${params}`);
      const data = await response.json();

      if (data.data) {
        const historicalData = {
          symbol: 'SOL',
          currency,
          timeframe,
          pricesta.data.map((pointy) => ({
            timestampint.timestamp,
            datew Date(point.timestamp * 1000).toISOString(),
            priceint.price,
            volumeint.volume || null,
            marketCapint.marketCap || null
          })),
          metadata: {
            totalPointsta.data.length,
            startDateta.data.length > 0 ? new Date(data.data[0].timestamp * 1000).toISOString() ll,
            endDateta.data.length > 0 ? new Date(data.data[data.data.length - 1].timestamp * 1000).toISOString() ll
          }
        };

        res.json({
          successue,
          type: 'historical_prices',
          timeframe,
          currency,
          datastoricalData,
          timestampw Date().toISOString()
        });
      } else {
        throw new Error('No historical data found for Solana');
      }
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/stats"async (reqres) => {
    try {
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "CryptoRank API key not configured",
          timestampw Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_keyocess.env.CRYPTORANK_API_KEY
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana?${params}`);
      const data = await response.json();

      if (data.data) {
        const solana = data.data;
        
        const marketStats = {
          symbol: 'SOL',
          name: 'Solana',
          marketMetrics: {
            ranklana.values?.USD?.marketCapRank || null,
            marketCaplana.values?.USD?.marketCap || null,
            volume24hlana.values?.USD?.volume24h || null,
            volumeMarketCapRatiolana.values?.USD?.volume24h && solana.values?.USD?.marketCap ? 
              (solana.values.USD.volume24h / solana.values.USD.marketCap) ll,
            circulatingSupplylana.circulatingSupply || null,
            totalSupplylana.totalSupply || null,
            maxSupplylana.maxSupply || null,
            supplyPercentagelana.circulatingSupply && solana.totalSupply ? 
              (solana.circulatingSupply / solana.totalSupply * 100) ll
          },
          priceMetrics: {
            currentPricelana.values?.USD?.price || null,
            athPricelana.values?.USD?.athPrice || null,
            athDatelana.values?.USD?.athDate || null,
            percentFromAthlana.values?.USD?.percentFromAth || null,
            atlPricelana.values?.USD?.atlPrice || null,
            atlDatelana.values?.USD?.atlDate || null,
            percentFromAtllana.values?.USD?.percentFromAtl || null
          },
          performanceMetrics: {
            change1hlana.values?.USD?.percentChange1h || null,
            change24hlana.values?.USD?.percentChange24h || null,
            change7dlana.values?.USD?.percentChange7d || null,
            change30dlana.values?.USD?.percentChange30d || null,
            change1ylana.values?.USD?.percentChange1y || null
          }
        };

        res.json({
          successue,
          type: 'market_statistics',
          datarketStats,
          timestampw Date().toISOString()
        });
      } else {
        throw new Error('No market statistics found for Solana');
      }
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/cryptorank/price"async (reqres) => {
    try {
      if (!process.env.CRYPTORANK_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "CryptoRank API key not configured",
          timestampw Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        api_keyocess.env.CRYPTORANK_API_KEY
      });

      const response = await fetch(`https://api.cryptorank.io/v0/coins/solana?${params}`);
      const data = await response.json();

      if (data.data) {
        const solana = data.data;
        
        const priceData = {
          symbol: 'SOL',
          name: 'Solana',
          prices: {
            usdlana.values?.USD?.price || null,
            btclana.values?.BTC?.price || null,
            ethlana.values?.ETH?.price || null
          },
          changes: {
            percent1hlana.values?.USD?.percentChange1h || null,
            percent24hlana.values?.USD?.percentChange24h || null,
            percent7dlana.values?.USD?.percentChange7d || null
          },
          volume: {
            usd24hlana.values?.USD?.volume24h || null
          },
          marketCap: {
            usdlana.values?.USD?.marketCap || null,
            ranklana.values?.USD?.marketCapRank || null
          },
          lastUpdatedlana.lastUpdated || new Date().toISOString()
        };

        res.json({
          successue,
          type: 'real_time_price',
          dataiceData,
          timestampw Date().toISOString()
        });
      } else {
        throw new Error('No real-time price data found for Solana');
      }
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Solana On-Chain Metrics API integration - Direct implementation
  app.get("/api/onchain/metrics"async (reqres) => {
    try {
      // Get epoch info from Solana RPC
      const epochPayload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getEpochInfo"
      };

      const epochResponse = await fetch('https://api.mainnet-beta.solana.com'{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        bodyON.stringify(epochPayload)
      });

      const epochData = await epochResponse.json();
      const epochInfo = epochData.result || {};

      // Get current slot
      const slotPayload = {
        jsonrpc: "2.0",
        id: 2,
        method: "getSlot"
      };

      const slotResponse = await fetch('https://api.mainnet-beta.solana.com'{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        bodyON.stringify(slotPayload)
      });

      const slotData = await slotResponse.json();
      const currentSlot = slotData.result || null;

      // Get block height
      const blockHeightPayload = {
        jsonrpc: "2.0",
        id: 3,
        method: "getBlockHeight"
      };

      const blockHeightResponse = await fetch('https://api.mainnet-beta.solana.com'{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        bodyON.stringify(blockHeightPayload)
      });

      const blockHeightData = await blockHeightResponse.json();
      const blockHeight = blockHeightData.result || null;

      const metrics = {
        timestampw Date().toISOString(),
        source: 'solana_rpc',
        network: {
          currentSlotrrentSlot,
          blockHeightockHeight,
          epochochInfo.epoch || null,
          slotIndexochInfo.slotIndex || null,
          slotsInEpochochInfo.slotsInEpoch || null,
          absoluteSlotochInfo.absoluteSlot || null,
          transactionCountochInfo.transactionCount || null,
          epochProgressochInfo.slotIndex && epochInfo.slotsInEpoch ? 
            ((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(2) ll
        },
        note: "Real-time Solana blockchain data. For TPS and validator metricsenhanced APIs available with authentication."
      };

      res.json({
        successue,
        type: 'network_metrics',
        datatrics,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/onchain/validators"async (reqres) => {
    try {
      const response = await fetch('https://api.solanatracker.io/v1/validators');
      const data = await response.json();

      const validatorStats = {
        source: 'solana_tracker',
        timestampw Date().toISOString(),
        overview: {
          totalValidatorsta.total_validators || null,
          activeValidatorsta.active_validators || null,
          averageApyta.average_apy || null,
          totalStaketa.total_stake || null,
          averageCommissionta.average_commission || null
        },
        topValidators: (data.validators || []).slice(020).map((validatory) => ({
          identitylidator.identity || null,
          namelidator.name || null,
          voteAccountlidator.vote_account || null,
          commissionlidator.commission || null,
          lastVotelidator.last_vote || null,
          rootSlotlidator.root_slot || null,
          activatedStakelidator.activated_stake || null,
          epochVoteAccountlidator.epoch_vote_account || null,
          epochCreditslidator.epoch_credits || null,
          versionlidator.version || null,
          apylidator.apy || null
        }))
      };

      res.json({
        successue,
        type: 'validator_stats',
        datalidatorStats,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/onchain/staking"async (reqres) => {
    try {
      const [validatorsResponseepochResponse] = await Promise.all([
        fetch('https://api.solanatracker.io/v1/validators'),
        fetch('https://api.solanatracker.io/v1/epoch')
      ]);
      
      const [validatorsDataepochData] = await Promise.all([
        validatorsResponse.json(),
        epochResponse.json()
      ]);

      const stakingInfo = {
        source: 'solana_tracker',
        timestampw Date().toISOString(),
        overview: {
          averageApylidatorsData.average_apy || null,
          totalStakelidatorsData.total_stake || null,
          averageCommissionlidatorsData.average_commission || null,
          activeValidatorslidatorsData.active_validators || null
        },
        epochInfo: {
          currentEpochochData.epoch || null,
          epochProgressochData.slot_index && epochData.slots_in_epoch ? 
            (epochData.slot_index / epochData.slots_in_epoch * 100) ll,
          slotsRemainingochData.slot_index && epochData.slots_in_epoch ? 
            (epochData.slots_in_epoch - epochData.slot_index) ll,
          slotIndexochData.slot_index || null,
          slotsInEpochochData.slots_in_epoch || null,
          absoluteSlotochData.absolute_slot || null
        }
      };

      // Calculate yield distribution if validator data available
      const validatorApys = (validatorsData.validators || [])
        .map((vy) => v.apy)
        .filter((apyy) => apy !== null && apy !== undefined)
        .sort((amberbmber) => b - a);

      if (validatorApys.length > 0) {
        (stakingInfo).yieldDistribution = {
          highestlidatorApys[0],
          medianlidatorApys[Math.floor(validatorApys.length / 2)],
          lowestlidatorApys[validatorApys.length - 1],
          topQuartilelidatorApys[Math.floor(validatorApys.length * 0.25)],
          bottomQuartilelidatorApys[Math.floor(validatorApys.length * 0.75)]
        };
      }

      res.json({
        successue,
        type: 'staking_yields',
        dataakingInfo,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/onchain/epoch"async (reqres) => {
    try {
      const response = await fetch('https://api.solanatracker.io/v1/epoch');
      const data = await response.json();

      const epochInfo = {
        source: 'solana_tracker',
        timestampw Date().toISOString(),
        currentEpoch: {
          epochta.epoch || null,
          slotIndexta.slot_index || null,
          slotsInEpochta.slots_in_epoch || null,
          absoluteSlotta.absolute_slot || null,
          blockHeightta.block_height || null,
          transactionCountta.transaction_count || null,
          progressta.slot_index && data.slots_in_epoch ? 
            (data.slot_index / data.slots_in_epoch * 100) ll,
          slotsRemainingta.slot_index && data.slots_in_epoch ? 
            (data.slots_in_epoch - data.slot_index) ll
        }
      };

      res.json({
        successue,
        type: 'epoch_info',
        dataochInfo,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/onchain/tps"async (reqres) => {
    try {
      const response = await fetch('https://api.solanatracker.io/v1/network');
      const data = await response.json();

      const tpsData = {
        timestampw Date().toISOString(),
        source: 'solana_tracker',
        currentTpsta.tps || null,
        averageBlockTimeta.average_block_time || null,
        blockHeightta.block_height || null,
        totalTransactionsta.total_transactions || null,
        metrics: {
          tpsta.tps || null,
          blockTimeta.average_block_time || null,
          throughputta.tps && data.average_block_time ? 
            (data.tps * data.average_block_time) ll
        }
      };

      res.json({
        successue,
        type: 'tps_monitoring',
        datasData,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/onchain/overview"async (reqres) => {
    try {
      const [networkResponsevalidatorsResponseepochResponse] = await Promise.all([
        fetch('https://api.solanatracker.io/v1/network'),
        fetch('https://api.solanatracker.io/v1/validators'),
        fetch('https://api.solanatracker.io/v1/epoch')
      ]);

      const [networkDatavalidatorsDataepochData] = await Promise.all([
        networkResponse.json(),
        validatorsResponse.json(),
        epochResponse.json()
      ]);

      const overview = {
        timestampw Date().toISOString(),
        source: 'solana_tracker',
        network: {
          tpstworkData.tps || null,
          blockHeighttworkData.block_height || null,
          totalTransactionstworkData.total_transactions || null,
          averageBlockTimetworkData.average_block_time || null
        },
        validators: {
          totallidatorsData.total_validators || null,
          activelidatorsData.active_validators || null,
          averageApylidatorsData.average_apy || null,
          totalStakelidatorsData.total_stake || null,
          averageCommissionlidatorsData.average_commission || null
        },
        epoch: {
          currentochData.epoch || null,
          progressochData.slot_index && epochData.slots_in_epoch ? 
            (epochData.slot_index / epochData.slots_in_epoch * 100) ll,
          slotIndexochData.slot_index || null,
          slotsInEpochochData.slots_in_epoch || null,
          absoluteSlotochData.absolute_slot || null,
          blockHeightochData.block_height || null,
          transactionCountochData.transaction_count || null
        },
        health: {
          networkActivetworkData.tps ? networkData.tps > 0 lse,
          validatorsHealthylidatorsData.active_validators && validatorsData.total_validators ? 
            (validatorsData.active_validators / validatorsData.total_validators > 0.8) lse,
          epochProgressingochData.slot_index && epochData.slots_in_epoch ? 
            (epochData.slot_index > 0) lse
        }
      };

      res.json({
        successue,
        type: 'blockchain_overview',
        dataerview,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Solana TAAPI Pro integration - Direct implementation
  app.get("/api/solana/rsi"async (reqres) => {
    try {
      const { exchange = 'binance'interval = '1h'period = 14 } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "TAAPI API key not configured",
          timestampw Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        secretocess.env.TAAPI_API_KEY,
        exchangechange,
        symbol: 'SOL/USDT',
        intervalterval,
        periodriod.toString()
      });

      const response = await fetch(`https://api.taapi.io/rsi?${params}`);
      const data = await response.json();

      res.json({
        successue,
        indicator: 'RSI',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        periodrseInt(period),
        data,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/solana/macd"async (reqres) => {
    try {
      const { 
        exchange = 'binance'
        interval = '1h'
        fastPeriod = 12
        slowPeriod = 26
        signalPeriod = 9 
      } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "TAAPI API key not configured",
          timestampw Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        secretocess.env.TAAPI_API_KEY,
        exchangechange,
        symbol: 'SOL/USDT',
        intervalterval,
        fast_periodstPeriod.toString(),
        slow_periodowPeriod.toString(),
        signal_periodgnalPeriod.toString()
      });

      const response = await fetch(`https://api.taapi.io/macd?${params}`);
      const data = await response.json();

      res.json({
        successue,
        indicator: 'MACD',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        parameters: {
          fastPeriodrseInt(fastPeriod),
          slowPeriodrseInt(slowPeriod),
          signalPeriodrseInt(signalPeriod)
        },
        data,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/solana/ema"async (reqres) => {
    try {
      const { exchange = 'binance'interval = '1h'period = 20 } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "TAAPI API key not configured",
          timestampw Date().toISOString()
        });
      }

      const params = new URLSearchParams({
        secretocess.env.TAAPI_API_KEY,
        exchangechange,
        symbol: 'SOL/USDT',
        intervalterval,
        periodriod.toString()
      });

      const response = await fetch(`https://api.taapi.io/ema?${params}`);
      const data = await response.json();

      res.json({
        successue,
        indicator: 'EMA',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        periodrseInt(period),
        data,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/solana/analysis"async (reqres) => {
    try {
      const { exchange = 'binance'interval = '1h' } = req.query;
      
      if (!process.env.TAAPI_API_KEY) {
        return res.status(503).json({
          successlse,
          error: "TAAPI API key not configured",
          timestampw Date().toISOString()
        });
      }

      // Fetch multiple indicators for comprehensive analysis
      const indicators = ['rsi''macd''ema''sma'];
      const params = new URLSearchParams({
        secretocess.env.TAAPI_API_KEY,
        exchangechange,
        symbol: 'SOL/USDT',
        intervalterval,
        indicatorsdicators.join(',')
      });

      const response = await fetch(`https://api.taapi.io/bulk?${params}`);
      const data = await response.json();

      res.json({
        successue,
        type: 'comprehensive_analysis',
        symbol: 'SOL/USDT',
        exchange,
        interval,
        indicators,
        data,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Trading API endpoints
  app.get("/api/trading/test"(reqres) => {
    res.json({
      successue,
      message: "Trading API endpoint is working",
      timestampw Date().toISOString(),
      availableEndpoints: [
        "/api/trading/indicators/:symbol",
        "/api/trading/social/:symbol"
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
  app.get("/api/trading/indicators/:symbol"async (reqres) => {
    const { symbol } = req.params;
    const { exchange = 'binance'interval = '1h' } = req.query;

    if (!process.env.TAAPI_API_KEY) {
      return res.status(503).json({
        successlse,
        error: "TAAPI API key not configured",
        timestampw Date().toISOString()
      });
    }

    try {
      const params = new URLSearchParams({
        secretocess.env.TAAPI_API_KEY,
        exchangechange,
        symbol,
        intervalterval
      });

      const response = await fetch(`https://api.taapi.io/rsi?${params}`);
      const data = await response.json();

      res.json({
        successue,
        symbol,
        exchange,
        interval,
        data,
        timestampw Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Social metrics endpoint
  app.get("/api/trading/social/:symbol"async (reqres) => {
    const { symbol } = req.params;

    if (!process.env.LUNARCRUSH_API_KEY) {
      return res.status(503).json({
        successlse,
        error: "LunarCrush API key not configured",
        timestampw Date().toISOString()
      });
    }

    try {
      const params = new URLSearchParams({
        data: 'assets',
        keyocess.env.LUNARCRUSH_API_KEY,
        symbol
      });

      const response = await fetch(`https://api.lunarcrush.com/v2?${params}`);
      const data = await response.json();

      res.json({
        successue,
        symbol,
        datata.data?.[0] || null,
        timestampw Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Market data endpoint
  app.get("/api/trading/market/:symbol"async (reqres) => {
    const { symbol } = req.params;

    if (!process.env.CRYPTORANK_API_KEY) {
      return res.status(503).json({
        successlse,
        error: "CryptoRank API key not configured",
        timestampw Date().toISOString()
      });
    }

    try {
      const response = await fetch(`https://api.cryptorank.io/v1/currencies/${symbol}`{
        headers: {
          'X-API-KEY'ocess.env.CRYPTORANK_API_KEY
        }
      });
      const data = await response.json();

      res.json({
        successue,
        symbol,
        data,
        timestampw Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // AI analysis endpoint
  app.post("/api/trading/ai-analysis"async (reqres) => {
    const { marketDatasymbol } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        successlse,
        error: "OpenAI API key not configured",
        timestampw Date().toISOString()
      });
    }

    if (!marketData || !symbol) {
      return res.status(400).json({
        successlse,
        error: "Market data and symbol are required",
        timestampw Date().toISOString()
      });
    }

    try {
      const prompt = `Analyze the following market data for ${symbol}:

${JSON.stringify(marketDatanull2)}

Provide a brief analysis including:
1. Overall sentiment (bullish/bearish/neutral)
2. Key technical signals
3. Risk assessment

Keep response concise and professional.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions'{
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        bodyON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional cryptocurrency market analyst.'
            },
            {
              role: 'user',
              contentompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      const aiData = await response.json();

      res.json({
        successue,
        symbol,
        analysisData.choices[0].message.content,
        timestampw Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Astrological Data API integration - Direct implementation using Astronomy Engine
  app.get("/api/astrology/moon-phase"async (reqres) => {
    try {
      const astroModule = await import('astronomy-engine');
      const Astronomy = astroModule.default || astroModule;
      const date = req.query.date ? new Date(req.query.date) w Date();
      
      const astroDate = new Astronomy.AstroTime(date);
      const moonIllum = Astronomy.Illumination(Astronomy.Body.MoonastroDate);
      const moonPhase = Astronomy.MoonPhase(astroDate);
      const moonPos = Astronomy.EclipticGeoMoon(astroDate);
      
      const zodiacSigns = [
        'Aries''Taurus''Gemini''Cancer''Leo''Virgo',
        'Libra''Scorpio''Sagittarius''Capricorn''Aquarius''Pisces'
      ];
      
      const zodiacIndex = Math.floor(moonPos.lon / 30);
      const zodiacSign = zodiacSigns[zodiacIndex];
      const degreeInSign = moonPos.lon % 30;
      
      const getMoonPhaseName = (phasember) => {
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
        successue,
        timestampte.toISOString(),
        source: 'astronomy_engine',
        moonPhase: {
          phaseonPhase,
          phaseNametMoonPhaseName(moonPhase),
          illuminationonIllum.fraction * 100,
          position: {
            longitudeonPos.lon,
            latitudeonPos.lat,
            zodiacSigndiacSign,
            degreeInSigngreeInSign.toFixed(2)
          }
        }
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/planetary-positions"async (reqres) => {
    try {
      const astroModule = await import('astronomy-engine');
      const Astronomy = astroModule.default || astroModule;
      const date = req.query.date ? new Date(req.query.date) w Date();
      
      const astroDate = new Astronomy.AstroTime(date);
      const zodiacSigns = [
        'Aries''Taurus''Gemini''Cancer''Leo''Virgo',
        'Libra''Scorpio''Sagittarius''Capricorn''Aquarius''Pisces'
      ];
      
      const planets = {
        suntronomy.Body.Sun,
        moontronomy.Body.Moon,
        mercurytronomy.Body.Mercury,
        venustronomy.Body.Venus,
        marstronomy.Body.Mars,
        jupitertronomy.Body.Jupiter,
        saturntronomy.Body.Saturn,
        uranustronomy.Body.Uranus,
        neptunetronomy.Body.Neptune,
        plutotronomy.Body.Pluto
      };
      
      const positionscord<stringany> = {};
      
      // Calculate each planet's position individually
      try {
        // Moon position (special case)
        const moonPos = Astronomy.EclipticGeoMoon(astroDate);
        const moonZodiacIndex = Math.floor((moonPos).lon / 30);
        positions.moon = {
          longitude: (moonPos).lon,
          latitude: (moonPos).lat,
          zodiacSigndiacSigns[moonZodiacIndex],
          degreeInSign: ((moonPos).lon % 30).toFixed(2)
        };
      } catch (error) {
        positions.moon = { error: 'Calculation failed' };
      }

      // Sun and planets using GeoVector and Ecliptic conversion
      const planetBodies = {
        suntronomy.Body.Sun,
        mercurytronomy.Body.Mercury,
        venustronomy.Body.Venus,
        marstronomy.Body.Mars,
        jupitertronomy.Body.Jupiter,
        saturntronomy.Body.Saturn,
        uranustronomy.Body.Uranus,
        neptunetronomy.Body.Neptune,
        plutotronomy.Body.Pluto
      };

      Object.entries(planetBodies).forEach(([namebody]) => {
        try {
          const vector = Astronomy.GeoVector(bodyastroDatefalse);
          const pos = Astronomy.Ecliptic(vector);
          
          const zodiacIndex = Math.floor((pos).elon / 30);
          const zodiacSign = zodiacSigns[zodiacIndex];
          const degreeInSign = (pos).elon % 30;
          
          positions[name] = {
            longitude: (pos).elon,
            latitude: (pos).elat,
            zodiacSigndiacSign,
            degreeInSigngreeInSign.toFixed(2)
          };
        } catch (planetError) {
          positions[name] = { error: `Calculation failed: ${planetError}` };
        }
      });

      res.json({
        successue,
        timestampte.toISOString(),
        source: 'astronomy_engine',
        positionssitions
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/aspects"async (reqres) => {
    try {
      const astroModule = await import('astronomy-engine');
      const Astronomy = astroModule.default || astroModule;
      const date = req.query.date ? new Date(req.query.date) w Date();
      const orb = req.query.orb ? parseFloat(req.query.orb) : 8;
      
      res.json({
        successue,
        timestampte.toISOString(),
        source: 'astronomy_engine',
        aspects: {
          note: 'Planetary aspects calculation - feature under development',
          orbb,
          datete.toISOString()
        }
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/lunar-calendar"async (reqres) => {
    try {
      const astroModule = await import('astronomy-engine');
      const Astronomy = astroModule.default || astroModule;
      const year = req.query.year ? parseInt(req.query.year) w Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month) w Date().getMonth() + 1;
      
      res.json({
        successue,
        timestampw Date().toISOString(),
        source: 'astronomy_engine',
        lunarCalendar: {
          yearar,
          monthnth,
          note: 'Lunar calendar calculation - feature under development'
        }
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/report"async (reqres) => {
    try {
      const astroModule = await import('astronomy-engine');
      const Astronomy = astroModule.default || astroModule;
      const date = req.query.date ? new Date(req.query.date) w Date();
      
      res.json({
        successue,
        timestampte.toISOString(),
        source: 'astronomy_engine',
        report: {
          datete.toISOString(),
          note: 'Comprehensive astrological report - feature under development'
        }
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Simple unified data endpoint without caching (for now)
  app.get("/api/unified/analysis"async (reqres) => {
    try {
      const allApiDatay = {};

      // Collect data from all APIs
      try {
        const taapiResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/api/taapi/indicators/multiple?symbol=SOL/USDT`);
        if (taapiResponse.ok) {
          allApiData.taapi = await taapiResponse.json();
        }
      } catch (error) {
        allApiData.taapi = { successlseerror: 'Failed to fetch TAAPI data' };
      }

      try {
        const lunarResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/api/lunarcrush/metrics?symbol=SOL`);
        if (lunarResponse.ok) {
          allApiData.lunarcrush = await lunarResponse.json();
        }
      } catch (error) {
        allApiData.lunarcrush = { successlseerror: 'Failed to fetch LunarCrush data' };
      }

      try {
        const cryptorankResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/api/cryptorank/solana`);
        if (cryptorankResponse.ok) {
          allApiData.cryptorank = await cryptorankResponse.json();
        }
      } catch (error) {
        allApiData.cryptorank = { successlseerror: 'Failed to fetch CryptoRank data' };
      }

      try {
        const onchainResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/api/onchain/overview`);
        if (onchainResponse.ok) {
          allApiData.onchain = await onchainResponse.json();
        }
      } catch (error) {
        allApiData.onchain = { successlseerror: 'Failed to fetch on-chain data' };
      }

      try {
        const astrologyResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/api/astrology/report`);
        if (astrologyResponse.ok) {
          allApiData.astrology = await astrologyResponse.json();
        }
      } catch (error) {
        allApiData.astrology = { successlseerror: 'Failed to fetch astrology data' };
      }

      res.json({
        successue,
        timestampw Date().toISOString(),
        source: 'live_aggregation',
        datalApiData,
        meta: {
          apis_queriedject.keys(allApiData).length,
          note: 'Advanced caching and normalization features available - see documentation'
        }
      });

    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Comprehensive Trading Analysis Endpoint
  app.get("/api/analysis/complete"async (reqres) => {
    try {
      // Import scoring and normalization modules
      const { 
        computeMasterScore
        getScoreBreakdown
        interpretMasterScore 
      } = await import('../services/scorers.js');
      
      const { 
        normalizeMetrics
        initializeNormalization 
      } = await import('../services/normalize.js');

      // Initialize normalization bounds if not already done
      try {
        await initializeNormalization();
      } catch (initError) {
        console.warn('Normalization initialization failedusing defaults:'initError);
      }

      // Collect raw metrics from all API sources
      const rawMetricscord<stringnumber> = {};
      
      // Technical metrics from TAAPI
      if (process.env.TAAPI_API_KEY) {
        try {
          const technicalIndicators = ['rsi''ema''sma''macd''bbands''atr''vwap'];
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
          console.warn('TAAPI data collection failed:'error);
        }
      }

      // Social metrics from LunarCrush
      if (process.env.LUNARCRUSH_API_KEY) {
        try {
          const lunarCrushUrl = 'https://lunarcrush.com/api4/public/coins/sol/v1';
          const response = await fetch(lunarCrushUrl{
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
          console.warn('LunarCrush data collection failed:'error);
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
          console.warn('CryptoRank data collection failed:'error);
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
        console.warn('On-chain data collection failed:'error);
      }

      // Astrological metrics
      try {
        const astroModule = await import('astronomy-engine');
        const Astronomy = astroModule.default || astroModule;
        const astroDate = new Astronomy.AstroTime(new Date());
        
        // Lunar phase calculation
        const moonIllumination = Astronomy.Illumination(Astronomy.Body.MoonastroDate);
        rawMetrics.lunarPhasePercentile = (moonIllumination).phase_fraction * 100;
        
        // Lunar distance calculation
        const moonPos = Astronomy.GeoVector(Astronomy.Body.MoonastroDatefalse);
        rawMetrics.lunarPerigeeApogeeDist = moonPos.length;
        
        // Planetary aspects
        const sunPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.SunastroDatefalse));
        const marsPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.MarsastroDatefalse));
        const saturnPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.SaturnastroDatefalse));
        const jupiterPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.JupiterastroDatefalse));
        
        // Calculate aspect angles
        let marsSunAngle = Math.abs((sunPos).elon - (marsPos).elon);
        if (marsSunAngle > 180) marsSunAngle = 360 - marsSunAngle;
        rawMetrics.marsSunAspect = marsSunAngle;
        
        let saturnJupiterAngle = Math.abs((saturnPos).elon - (jupiterPos).elon);
        if (saturnJupiterAngle > 180) saturnJupiterAngle = 360 - saturnJupiterAngle;
        rawMetrics.saturnJupiterAspect = saturnJupiterAngle;
        
        // Solar ingress indicators
        rawMetrics.solarIngressAries = Math.abs((sunPos).elon) < 1 ? 1 : 0;
        rawMetrics.solarIngressLibra = Math.abs((sunPos).elon - 180) < 1 ? 1 : 0;
        
        // Default values for other astrological metrics
        rawMetrics.northNodeSolanaLongitude = (sunPos).elon; // Simplified
        rawMetrics.nodeIngressData = 0;
        rawMetrics.siriusRisingIndicator = 0;
        rawMetrics.aldebaranConjunctionIndicator = 0;
        
      } catch (error) {
        console.warn('Astrological data calculation failed:'error);
      }

      // Add default values for missing metrics
      const defaultMetrics = {
        // Technical
        rsi_4hwMetrics.rsi_1h || 50,
        macd_4hwMetrics.macd_1h || 0,
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
      Object.entries(defaultMetrics).forEach(([keyvalue]) => {
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
        successue,
        timestampw Date().toISOString(),
        analysis: {
          rawMetrics,
          normalizedMetrics,
          scores: {
            breakdownoreBreakdown,
            mastersterScore,
            signaladingSignal
          },
          interpretation: {
            overall: `Master Score: ${masterScore.toFixed(1)}/100`,
            signal: `${tradingSignal.signal} (${tradingSignal.confidence} confidence)`,
            summary: `Technical: ${scoreBreakdown.mainPillars.technical}Social: ${scoreBreakdown.mainPillars.social}Fundamental: ${scoreBreakdown.mainPillars.fundamental}Astrology: ${scoreBreakdown.mainPillars.astrology}`
          }
        },
        dataSource: {
          technicalocess.env.TAAPI_API_KEY ? 'TAAPI Pro' : 'Unavailable',
          socialocess.env.LUNARCRUSH_API_KEY ? 'LunarCrush v4' : 'Unavailable',
          fundamentalocess.env.CRYPTORANK_API_KEY ? 'CryptoRank' : 'Unavailable',
          onchain: 'Solana Tracker',
          astrology: 'Astronomy Engine'
        }
      });

    } catch (errory) {
      console.error('Complete analysis error:'error);
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Dashboard API endpoints for live predictions
  app.get("/api/predictions/latest"async (reqres) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          successlse,
          error: "Database not configured - Supabase credentials required",
          timestampw Date().toISOString()
        });
      }

      const { dataerror } = await supabase
        .from('live_predictions')
        .select('*')
        .order('timestamp'{ ascendinglse })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      res.json({
        successue,
        datata || null,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      console.error("Error fetching latest prediction:"error.message || error);
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/news/recent"async (reqres) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          successlse,
          error: "Database not configured - Supabase credentials required",
          timestampw Date().toISOString()
        });
      }

      const limit = parseInt(req.query.limit) || 20;
      
      const { dataerror } = await supabase
        .from('news_scores')
        .select('*')
        .order('timestamp'{ ascendinglse })
        .limit(limit);

      if (error) {
        throw error;
      }

      res.json({
        successue,
        datata || [],
        timestampw Date().toISOString()
      });
    } catch (errory) {
      console.error("Error fetching recent news scores:"error.message || error);
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/updates/today"async (reqres) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          successlse,
          error: "Database not configured - Supabase credentials required",
          timestampw Date().toISOString()
        });
      }

      const todayDate = new Date().toISOString().split('T')[0];
      
      const { dataerror } = await supabase
        .from('daily_updates')
        .select('*')
        .eq('date'todayDate)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      res.json({
        successue,
        datata || null,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      console.error("Error fetching today's update:"error.message || error);
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // ADVANCED FINANCIAL ASTROLOGY ENDPOINTS
  app.get("/api/astrology/financial-index"async (reqres) => {
    try {
      const { computeFinancialAstrologyIndex } = await import('../services/financialAstrology.js');
      const date = req.query.date ? new Date(req.query.date) w Date();
      
      const financialIndex = computeFinancialAstrologyIndex(date);
      
      res.json({
        successue,
        datanancialIndex,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      console.error("Financial astrology index error:"error.message || error);
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/weighted-aspects"async (reqres) => {
    try {
      const { computeWeightedAspectScore } = await import('../services/financialAstrology.js');
      const date = req.query.date ? new Date(req.query.date) w Date();
      
      const aspectScore = computeWeightedAspectScore(date);
      
      res.json({
        successue,
        datapectScore,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      console.error("Weighted aspects error:"error.message || error);
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/astrology/planetary-stations"async (reqres) => {
    try {
      const { computeStationScore } = await import('../services/financialAstrology.js');
      const date = req.query.date ? new Date(req.query.date) w Date();
      
      const stationScore = computeStationScore(date);
      
      res.json({
        successue,
        dataationScore,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      console.error("Planetary stations error:"error.message || error);
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Store new prediction in database
  app.post("/api/predictions/store"async (reqres) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          successlse,
          error: "Database not configured - Supabase credentials required",
          timestampw Date().toISOString()
        });
      }

      const prediction = req.body;
      
      // Normalize values to proper score ranges while preserving authentic data
      const normalizeScore = (valuember) => {
        if (typeof value !== 'number' || isNaN(value)) return 0;
        
        // Handle extremely large values (like market cap data) by normalizing to 0-100 scale
        if (value > 1000) {
          // Log scale normalization for very large numbers
          const logValue = Math.log10(value);
          const normalizedValue = Math.min(100(logValue - 1) * 10); // Scales log values to 0-100
          return Math.round(normalizedValue * 100) / 100;
        }
        
        // Normal range scores (0-100)
        return Math.min(Math.max(0Math.round(value * 100) / 100)100);
      };
      
      const clampConfidence = (valuember) => {
        if (typeof value !== 'number' || isNaN(value)) return 0;
        return Math.min(Math.max(0Math.round(value * 10000) / 10000)1);
      };
      
      const { dataerror } = await supabase
        .from('live_predictions')
        .insert({
          overall_scorermalizeScore(prediction.overall_score),
          classificationediction.classification || 'Neutral',
          confidenceampConfidence(prediction.confidence),
          technical_scorermalizeScore(prediction.technical_score),
          social_scorermalizeScore(prediction.social_score),
          fundamental_scorermalizeScore(prediction.fundamental_score),
          astrology_scorermalizeScore(prediction.astrology_score),
          price_targetediction.price_target ? normalizeScore(prediction.price_target) ll,
          risk_levelediction.risk_level || 'Medium'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Automatically trigger weight suggestions after storing prediction
      try {
        const response = await fetch('http://localhost:5000/api/openai/suggest-weights'{
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          console.log('[Auto Weight Suggestion] Weight suggestions generated after prediction storage');
        } else {
          console.warn('[Auto Weight Suggestion] Failed to generate weights:'response.status);
        }
      } catch (weightErrory) {
        console.warn('[Auto Weight Suggestion] Error generating weights:'weightError.message);
        // Don't fail the prediction storage if weight suggestions fail
      }

      res.json({
        successue,
        datata,
        timestampw Date().toISOString()
      });
    } catch (errory) {
      console.error("Error storing prediction:"error.message || error);
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  app.get("/api/predictions/history"async (reqres) => {
    try {
      if (!supabase) {
        return res.status(503).json({
          successlse,
          error: "Database not configured",
          timestampw Date().toISOString()
        });
      }

      const limit = parseInt(req.query.limit) || 24;
      
      const { dataerror } = await supabase
        .from('live_predictions')
        .select('*')
        .order('timestamp'{ ascendinglse })
        .limit(limit);

      if (error) {
        throw error;
      }

      res.json({
        successue,
        datata || [],
        timestampw Date().toISOString()
      });
    } catch (errory) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  // Endpoint to trigger manual prediction generation
  app.post("/api/predictions/generate"async (reqres) => {
    try {
      const { generateFreshPrediction } = await import('../scripts/generatePrediction.js');
      const prediction = await generateFreshPrediction();
      
      res.json({
        successue,
        message: "Prediction generated successfully",
        dataediction,
        timestampw Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        successlse,
        errorror.message,
        timestampw Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
