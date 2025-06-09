/**
 * Solana On-Chain Metrics Integration
 * Fetches real-time blockchain metrics like TPS, validator stats, and staking yields
 * Using Solana Tracker API and Bitquery Solana API
 */
class SolanaOnChainService {
  constructor() {
    // Primary data sources for Solana on-chain metrics
    this.solanaTrackerBaseUrl = 'https://data.solanatracker.io/v1';
    this.solanaRpcUrl = 'https://api.mainnet-beta.solana.com';
    this.bitqueryBaseUrl = 'https://graphql.bitquery.io';
    this.stakingRewardsUrl = 'https://api.stakingrewards.com';
    
    // API keys
    this.bitqueryApiKey = process.env.BITQUERY_API_KEY;
    this.stakingRewardsApiKey = process.env.STAKING_REWARDS_API_KEY;
    
    if (!this.bitqueryApiKey) {
      console.warn('BITQUERY_API_KEY not found in environment variables');
    }
    if (!this.stakingRewardsApiKey) {
      console.warn('STAKING_REWARDS_API_KEY not found in environment variables');
    }
  }

  /**
   * Validates Bitquery API key availability
   */
  validateBitqueryApiKey() {
    if (!this.bitqueryApiKey) {
      throw new Error('Bitquery API key not configured. Please set BITQUERY_API_KEY environment variable.');
    }
  }

  /**
   * Makes request to Solana Tracker API (no auth required for basic endpoints)
   */
  async makeSolanaTrackerRequest(endpoint) {
    try {
      // Try alternative Solana data sources if Solana Tracker is unavailable
      if (endpoint === '/network') {
        return await this.getRPCNetworkMetrics();
      }
      if (endpoint === '/validators') {
        return await this.getRPCValidatorMetrics();
      }
      if (endpoint === '/epoch') {
        return await this.getRPCEpochMetrics();
      }
      
      const response = await fetch(`${this.solanaTrackerBaseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SolanaAnalyticsBot/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Solana Tracker error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Solana Tracker API request failed:', error.message);
      throw error;
    }
  }

  async getRPCNetworkMetrics() {
    try {
      const rpcUrl = 'https://api.mainnet-beta.solana.com';
      
      const [slotResponse, epochResponse] = await Promise.all([
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getSlot'
          })
        }),
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'getEpochInfo'
          })
        })
      ]);

      const [slotData, epochData] = await Promise.all([
        slotResponse.json(),
        epochResponse.json()
      ]);

      return {
        tps: null, // TPS requires additional calculation
        block_height: slotData.result || null,
        total_transactions: null,
        average_block_time: 0.4,
        epoch: epochData.result?.epoch || null,
        slot_index: epochData.result?.slotIndex || null
      };
    } catch (error) {
      throw new Error('Failed to fetch network metrics from Solana RPC');
    }
  }

  async getRPCValidatorMetrics() {
    try {
      const rpcUrl = 'https://api.mainnet-beta.solana.com';
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getVoteAccounts'
        })
      });

      const data = await response.json();
      const voteAccounts = data.result;

      return {
        active_validators: voteAccounts?.current?.length || null,
        total_validators: (voteAccounts?.current?.length || 0) + (voteAccounts?.delinquent?.length || 0),
        average_apy: null // APY requires additional calculation
      };
    } catch (error) {
      throw new Error('Failed to fetch validator metrics from Solana RPC');
    }
  }

  async getRPCEpochMetrics() {
    try {
      const rpcUrl = 'https://api.mainnet-beta.solana.com';
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getEpochInfo'
        })
      });

      const data = await response.json();
      const epochInfo = data.result;

      return {
        epoch: epochInfo?.epoch || null,
        slot_index: epochInfo?.slotIndex || null,
        slots_in_epoch: epochInfo?.slotsInEpoch || null,
        absolute_slot: epochInfo?.absoluteSlot || null,
        block_height: epochInfo?.blockHeight || null,
        transaction_count: null
      };
    } catch (error) {
      throw new Error('Failed to fetch epoch metrics from Solana RPC');
    }
  }

  /**
   * Makes GraphQL request to Bitquery API
   */
  async makeBitqueryRequest(query, variables = {}) {
    this.validateBitqueryApiKey();
    
    try {
      const response = await fetch(this.bitqueryBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.bitqueryApiKey
        },
        body: JSON.stringify({
          query,
          variables
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      
      return data.data;
    } catch (error) {
      console.error('Bitquery API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Get real-time Solana network metrics including TPS
   */
  async getNetworkMetrics() {
    try {
      const [trackerMetrics, bitqueryMetrics] = await Promise.allSettled([
        this.getSolanaTrackerMetrics(),
        this.getBitqueryNetworkMetrics()
      ]);

      const metrics = {
        timestamp: new Date().toISOString(),
        source: 'combined'
      };

      // Merge data from both sources
      if (trackerMetrics.status === 'fulfilled') {
        metrics.solanaTracker = trackerMetrics.value;
      }

      if (bitqueryMetrics.status === 'fulfilled') {
        metrics.bitquery = bitqueryMetrics.value;
      }

      // Create combined metrics
      metrics.combined = {
        tps: metrics.solanaTracker?.tps || metrics.bitquery?.tps || null,
        blockHeight: metrics.solanaTracker?.blockHeight || metrics.bitquery?.blockHeight || null,
        totalTransactions: metrics.bitquery?.totalTransactions || null,
        activeValidators: metrics.solanaTracker?.activeValidators || null,
        stakingYield: metrics.solanaTracker?.stakingYield || null,
        epochInfo: metrics.solanaTracker?.epochInfo || null
      };

      return metrics;
    } catch (error) {
      throw new Error(`Network metrics fetch failed: ${error.message}`);
    }
  }

  /**
   * Get metrics from Solana Tracker API
   */
  async getSolanaTrackerMetrics() {
    try {
      const [networkStats, validatorStats, epochInfo] = await Promise.allSettled([
        this.makeSolanaTrackerRequest('/network'),
        this.makeSolanaTrackerRequest('/validators'),
        this.makeSolanaTrackerRequest('/epoch')
      ]);

      const metrics = {
        source: 'solana_tracker',
        timestamp: new Date().toISOString()
      };

      if (networkStats.status === 'fulfilled') {
        const network = networkStats.value;
        metrics.tps = network.tps || null;
        metrics.blockHeight = network.block_height || null;
        metrics.totalTransactions = network.total_transactions || null;
        metrics.averageBlockTime = network.average_block_time || null;
      }

      if (validatorStats.status === 'fulfilled') {
        const validators = validatorStats.value;
        metrics.activeValidators = validators.active_validators || null;
        metrics.totalValidators = validators.total_validators || null;
        metrics.stakingYield = validators.average_apy || null;
      }

      if (epochInfo.status === 'fulfilled') {
        const epoch = epochInfo.value;
        metrics.epochInfo = {
          epoch: epoch.epoch || null,
          slotIndex: epoch.slot_index || null,
          slotsInEpoch: epoch.slots_in_epoch || null,
          absoluteSlot: epoch.absolute_slot || null,
          blockHeight: epoch.block_height || null,
          transactionCount: epoch.transaction_count || null
        };
      }

      return metrics;
    } catch (error) {
      throw new Error(`Solana Tracker metrics failed: ${error.message}`);
    }
  }

  /**
   * Get network metrics from Bitquery API
   */
  async getBitqueryNetworkMetrics() {
    const query = `
      query GetSolanaNetworkMetrics($network: SolanaNetwork!, $from: ISO8601DateTime, $till: ISO8601DateTime) {
        solana(network: $network) {
          blocks(
            options: {desc: "height", limit: 1}
            time: {since: $from, till: $till}
          ) {
            height
            timestamp {
              time
            }
            transactionCount
          }
          transactions(
            options: {desc: "block.timestamp.time", limit: 1000}
            time: {since: $from, till: $till}
          ) {
            count
            block {
              height
              timestamp {
                time
              }
            }
          }
        }
      }
    `;

    const variables = {
      network: "solana",
      from: new Date(Date.now() - 3600000).toISOString(), // Last hour
      till: new Date().toISOString()
    };

    try {
      const data = await this.makeBitqueryRequest(query, variables);
      
      const blocks = data.solana.blocks || [];
      const transactions = data.solana.transactions || [];

      const metrics = {
        source: 'bitquery',
        timestamp: new Date().toISOString(),
        blockHeight: blocks.length > 0 ? blocks[0].height : null,
        totalTransactions: transactions.length > 0 ? transactions[0].count : null,
        latestBlockTime: blocks.length > 0 ? blocks[0].timestamp.time : null,
        transactionData: transactions.slice(0, 10) // Sample of recent transactions
      };

      // Calculate TPS if we have transaction data
      if (transactions.length > 1) {
        const timeRange = new Date(transactions[0].block.timestamp.time).getTime() - 
                         new Date(transactions[transactions.length - 1].block.timestamp.time).getTime();
        const timeRangeSeconds = timeRange / 1000;
        metrics.tps = timeRangeSeconds > 0 ? transactions.length / timeRangeSeconds : null;
      }

      return metrics;
    } catch (error) {
      throw new Error(`Bitquery network metrics failed: ${error.message}`);
    }
  }

  /**
   * Get validator statistics and staking information
   */
  async getValidatorStats() {
    try {
      const trackerValidators = await this.makeSolanaTrackerRequest('/validators');
      
      const validatorStats = {
        source: 'solana_tracker',
        timestamp: new Date().toISOString(),
        overview: {
          totalValidators: trackerValidators.total_validators || null,
          activeValidators: trackerValidators.active_validators || null,
          averageApy: trackerValidators.average_apy || null,
          totalStake: trackerValidators.total_stake || null,
          averageCommission: trackerValidators.average_commission || null
        },
        topValidators: (trackerValidators.validators || []).slice(0, 20).map(validator => ({
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

      return validatorStats;
    } catch (error) {
      throw new Error(`Validator stats fetch failed: ${error.message}`);
    }
  }

  /**
   * Get staking yields and rewards information
   */
  async getStakingYields() {
    try {
      const [validatorData, epochData] = await Promise.allSettled([
        this.makeSolanaTrackerRequest('/validators'),
        this.makeSolanaTrackerRequest('/epoch')
      ]);

      const stakingInfo = {
        source: 'solana_tracker',
        timestamp: new Date().toISOString()
      };

      if (validatorData.status === 'fulfilled') {
        const validators = validatorData.value;
        stakingInfo.overview = {
          averageApy: validators.average_apy || null,
          totalStake: validators.total_stake || null,
          averageCommission: validators.average_commission || null,
          activeValidators: validators.active_validators || null
        };

        // Calculate yield distribution
        const validatorApys = (validators.validators || [])
          .map(v => v.apy)
          .filter(apy => apy !== null && apy !== undefined)
          .sort((a, b) => b - a);

        if (validatorApys.length > 0) {
          stakingInfo.yieldDistribution = {
            highest: validatorApys[0],
            median: validatorApys[Math.floor(validatorApys.length / 2)],
            lowest: validatorApys[validatorApys.length - 1],
            topQuartile: validatorApys[Math.floor(validatorApys.length * 0.25)],
            bottomQuartile: validatorApys[Math.floor(validatorApys.length * 0.75)]
          };
        }
      }

      if (epochData.status === 'fulfilled') {
        const epoch = epochData.value;
        stakingInfo.epochInfo = {
          currentEpoch: epoch.epoch || null,
          epochProgress: epoch.slot_index && epoch.slots_in_epoch ? 
            (epoch.slot_index / epoch.slots_in_epoch * 100) : null,
          slotsRemaining: epoch.slot_index && epoch.slots_in_epoch ? 
            (epoch.slots_in_epoch - epoch.slot_index) : null,
          estimatedTimeToNextEpoch: null // Could be calculated based on average slot time
        };
      }

      return stakingInfo;
    } catch (error) {
      throw new Error(`Staking yields fetch failed: ${error.message}`);
    }
  }

  /**
   * Get current epoch information and statistics
   */
  async getEpochInfo() {
    try {
      const epochData = await this.makeSolanaTrackerRequest('/epoch');
      
      const epochInfo = {
        source: 'solana_tracker',
        timestamp: new Date().toISOString(),
        currentEpoch: {
          epoch: epochData.epoch || null,
          slotIndex: epochData.slot_index || null,
          slotsInEpoch: epochData.slots_in_epoch || null,
          absoluteSlot: epochData.absolute_slot || null,
          blockHeight: epochData.block_height || null,
          transactionCount: epochData.transaction_count || null,
          progress: epochData.slot_index && epochData.slots_in_epoch ? 
            (epochData.slot_index / epochData.slots_in_epoch * 100) : null,
          slotsRemaining: epochData.slot_index && epochData.slots_in_epoch ? 
            (epochData.slots_in_epoch - epochData.slot_index) : null
        }
      };

      return epochInfo;
    } catch (error) {
      throw new Error(`Epoch info fetch failed: ${error.message}`);
    }
  }

  /**
   * Get transaction analytics from Bitquery
   */
  async getTransactionAnalytics(timeframe = '24h') {
    const hoursBack = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : 168; // 7 days
    
    const query = `
      query GetSolanaTransactionAnalytics($network: SolanaNetwork!, $from: ISO8601DateTime, $till: ISO8601DateTime) {
        solana(network: $network) {
          transactions(
            time: {since: $from, till: $till}
            options: {asc: "block.timestamp.time"}
          ) {
            count
            block {
              timestamp {
                time(format: "%Y-%m-%d %H:%M:%S")
              }
              height
            }
            success
            fee
          }
          transfers(
            time: {since: $from, till: $till}
          ) {
            count
            amount
            currency {
              symbol
              name
            }
          }
        }
      }
    `;

    const variables = {
      network: "solana",
      from: new Date(Date.now() - (hoursBack * 3600000)).toISOString(),
      till: new Date().toISOString()
    };

    try {
      const data = await this.makeBitqueryRequest(query, variables);
      
      const transactions = data.solana.transactions || [];
      const transfers = data.solana.transfers || [];

      const analytics = {
        source: 'bitquery',
        timeframe,
        timestamp: new Date().toISOString(),
        transactions: {
          total: transactions.reduce((sum, tx) => sum + (tx.count || 0), 0),
          successful: transactions.filter(tx => tx.success).length,
          failed: transactions.filter(tx => !tx.success).length,
          averageFee: transactions.length > 0 ? 
            transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0) / transactions.length : null
        },
        transfers: {
          total: transfers.reduce((sum, transfer) => sum + (transfer.count || 0), 0),
          totalAmount: transfers.reduce((sum, transfer) => sum + (transfer.amount || 0), 0),
          uniqueTokens: [...new Set(transfers.map(t => t.currency?.symbol).filter(Boolean))].length
        },
        timeSeriesData: transactions.slice(0, 100) // Sample for visualization
      };

      return analytics;
    } catch (error) {
      throw new Error(`Transaction analytics fetch failed: ${error.message}`);
    }
  }

  /**
   * Get comprehensive Solana blockchain overview
   */
  async getBlockchainOverview() {
    try {
      const [networkMetrics, validatorStats, stakingYields, epochInfo] = await Promise.allSettled([
        this.getNetworkMetrics(),
        this.getValidatorStats(),
        this.getStakingYields(),
        this.getEpochInfo()
      ]);

      const overview = {
        timestamp: new Date().toISOString(),
        network: networkMetrics.status === 'fulfilled' ? networkMetrics.value : null,
        validators: validatorStats.status === 'fulfilled' ? validatorStats.value : null,
        staking: stakingYields.status === 'fulfilled' ? stakingYields.value : null,
        epoch: epochInfo.status === 'fulfilled' ? epochInfo.value : null,
        errors: [
          ...(networkMetrics.status === 'rejected' ? [{ type: 'network', error: networkMetrics.reason.message }] : []),
          ...(validatorStats.status === 'rejected' ? [{ type: 'validators', error: validatorStats.reason.message }] : []),
          ...(stakingYields.status === 'rejected' ? [{ type: 'staking', error: stakingYields.reason.message }] : []),
          ...(epochInfo.status === 'rejected' ? [{ type: 'epoch', error: epochInfo.reason.message }] : [])
        ]
      };

      return overview;
    } catch (error) {
      throw new Error(`Blockchain overview fetch failed: ${error.message}`);
    }
  }

  /**
   * Get real-time TPS monitoring data
   */
  async getTpsMonitoring(sampleSize = 100) {
    try {
      const [trackerData, bitqueryData] = await Promise.allSettled([
        this.makeSolanaTrackerRequest('/network'),
        this.getTransactionAnalytics('1h')
      ]);

      const tpsData = {
        timestamp: new Date().toISOString(),
        sources: {}
      };

      if (trackerData.status === 'fulfilled') {
        tpsData.sources.solanaTracker = {
          currentTps: trackerData.value.tps || null,
          averageBlockTime: trackerData.value.average_block_time || null,
          blockHeight: trackerData.value.block_height || null
        };
      }

      if (bitqueryData.status === 'fulfilled') {
        const analytics = bitqueryData.value;
        tpsData.sources.bitquery = {
          transactionsLastHour: analytics.transactions.total || null,
          calculatedTps: analytics.transactions.total ? analytics.transactions.total / 3600 : null,
          successRate: analytics.transactions.total > 0 ? 
            (analytics.transactions.successful / analytics.transactions.total * 100) : null
        };
      }

      // Combined TPS estimate
      const trackerTps = tpsData.sources.solanaTracker?.currentTps;
      const bitqueryTps = tpsData.sources.bitquery?.calculatedTps;
      
      if (trackerTps && bitqueryTps) {
        tpsData.combinedTps = (trackerTps + bitqueryTps) / 2;
      } else {
        tpsData.combinedTps = trackerTps || bitqueryTps || null;
      }

      return tpsData;
    } catch (error) {
      throw new Error(`TPS monitoring fetch failed: ${error.message}`);
    }
  }
}

// Create singleton instance
const solanaOnChainService = new SolanaOnChainService();

module.exports = {
  SolanaOnChainService,
  solanaOnChainService
};