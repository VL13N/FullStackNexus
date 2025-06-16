/**
 * Solana On-Chain Metrics Integration
 * Fetches real-time blockchain metrics like TPS, validator stats, and staking yields
 * Using Solana Tracker API and Bitquery Solana API
 */
class SolanaOnChainService {
  constructor() {
    // Primary Solana RPC endpoints for authentic on-chain data
    this.solanaRpcUrls = [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana'
    ];
    this.currentRpcIndex = 0;
    
    // Backup data sources
    this.solanaTrackerBaseUrl = 'https://data.solanatracker.io/v1';
    this.bitqueryBaseUrl = 'https://graphql.bitquery.io';
    
    // API keys
    this.bitqueryApiKey = process.env.BITQUERY_API_KEY;
    
    console.log('Solana On-Chain Service initialized with direct RPC endpoints');
  }

  /**
   * Makes direct RPC request to Solana blockchain
   */
  async makeSolanaRpcRequest(method, params = []) {
    const rpcUrl = this.solanaRpcUrls[this.currentRpcIndex];
    
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: method,
          params: params
        })
      });

      if (!response.ok) {
        throw new Error(`RPC request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.warn(`RPC request failed for ${rpcUrl}:`, error.message);
      
      // Try next RPC endpoint
      if (this.currentRpcIndex < this.solanaRpcUrls.length - 1) {
        this.currentRpcIndex++;
        return await this.makeSolanaRpcRequest(method, params);
      } else {
        this.currentRpcIndex = 0; // Reset for next time
        throw error;
      }
    }
  }

  /**
   * Get current slot and block information
   */
  async getCurrentSlotAndBlock() {
    try {
      const [slot, blockTime, blockHeight] = await Promise.all([
        this.makeSolanaRpcRequest('getSlot'),
        this.makeSolanaRpcRequest('getBlockTime', [await this.makeSolanaRpcRequest('getSlot')]),
        this.makeSolanaRpcRequest('getBlockHeight')
      ]);

      return {
        currentSlot: slot,
        blockTime: blockTime,
        blockHeight: blockHeight,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get current slot and block:', error.message);
      return null;
    }
  }

  /**
   * Calculate TPS from recent performance samples
   */
  async calculateTPS() {
    try {
      const performanceSamples = await this.makeSolanaRpcRequest('getRecentPerformanceSamples', [5]);
      
      if (!performanceSamples || performanceSamples.length === 0) {
        return 0;
      }

      // Calculate average TPS from recent samples
      let totalTransactions = 0;
      let totalSlots = 0;
      
      performanceSamples.forEach(sample => {
        totalTransactions += sample.numTransactions;
        totalSlots += sample.numSlots;
      });

      // TPS = transactions per slot * slots per second (approximately 2.5 slots/second)
      const avgTransactionsPerSlot = totalTransactions / totalSlots;
      const slotsPerSecond = 2.5; // Solana target block time
      const tps = avgTransactionsPerSlot * slotsPerSecond;

      return Math.round(tps);
    } catch (error) {
      console.error('Failed to calculate TPS:', error.message);
      return 0;
    }
  }

  /**
   * Get comprehensive network metrics using direct RPC calls
   */
  async getNetworkMetrics() {
    try {
      console.log('Fetching Solana network metrics from RPC...');
      
      const [blockInfo, tps, epochInfo, supply] = await Promise.all([
        this.getCurrentSlotAndBlock(),
        this.calculateTPS(),
        this.makeSolanaRpcRequest('getEpochInfo'),
        this.makeSolanaRpcRequest('getSupply')
      ]);

      const metrics = {
        success: true,
        timestamp: new Date().toISOString(),
        network: {
          tps: tps,
          current_slot: blockInfo?.currentSlot || 0,
          block_height: blockInfo?.blockHeight || 0,
          epoch: epochInfo?.epoch || 0,
          slot_index: epochInfo?.slotIndex || 0,
          slots_in_epoch: epochInfo?.slotsInEpoch || 0,
          epoch_progress: epochInfo ? (epochInfo.slotIndex / epochInfo.slotsInEpoch * 100).toFixed(2) : 0
        },
        supply: {
          total: supply?.value?.total || 0,
          circulating: supply?.value?.circulating || 0,
          non_circulating: supply?.value?.nonCirculating || 0
        },
        performance: {
          avg_block_time: 0.4, // Solana target block time
          network_utilization: Math.min(100, (tps / 65000) * 100) // Theoretical max TPS
        }
      };

      console.log('Solana RPC metrics retrieved successfully:', {
        tps: metrics.network.tps,
        slot: metrics.network.current_slot,
        epoch: metrics.network.epoch
      });

      return metrics;
    } catch (error) {
      console.error('Failed to fetch Solana network metrics:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        network: {
          tps: 0,
          current_slot: 0,
          block_height: 0,
          epoch: 0
        }
      };
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
   * Get real-time Solana network metrics using public JSON-RPC (no authentication required)
   */
  async getNetworkMetrics() {
    try {
      // Use only public RPC endpoints, no authentication required
      const [
        epochInfo,
        blockHeight,
        slot,
        performanceSamples,
        voteAccounts,
        supply
      ] = await Promise.all([
        this.makeSolanaRpcRequest('getEpochInfo'),
        this.makeSolanaRpcRequest('getBlockHeight'),
        this.makeSolanaRpcRequest('getSlot'),
        this.makeSolanaRpcRequest('getRecentPerformanceSamples', [5]),
        this.makeSolanaRpcRequest('getVoteAccounts'),
        this.makeSolanaRpcRequest('getSupply')
      ]);

      // Calculate TPS from performance samples
      let tps = 0;
      if (performanceSamples && performanceSamples.length > 0) {
        const recentSample = performanceSamples[0];
        tps = Math.round(recentSample.numTransactions / recentSample.samplePeriodSecs);
      }

      // Count validators
      const activeValidators = voteAccounts?.current?.length || 0;
      const totalValidators = (voteAccounts?.current?.length || 0) + (voteAccounts?.delinquent?.length || 0);

      const metrics = {
        timestamp: new Date().toISOString(),
        source: 'solana_rpc_public',
        tps: tps,
        blockHeight: blockHeight,
        currentSlot: slot,
        activeValidators: activeValidators,
        totalValidators: totalValidators,
        epoch: epochInfo?.epoch || 0,
        slotIndex: epochInfo?.slotIndex || 0,
        slotsInEpoch: epochInfo?.slotsInEpoch || 0,
        epochProgress: epochInfo?.slotIndex && epochInfo?.slotsInEpoch ? 
          (epochInfo.slotIndex / epochInfo.slotsInEpoch * 100).toFixed(2) : 0,
        totalSupply: supply?.value?.total || 0,
        circulatingSupply: supply?.value?.circulating || 0,
        averageBlockTime: 0.4 // Solana target
      };

      console.log('Public Solana RPC metrics retrieved successfully:', {
        tps: metrics.tps,
        validators: metrics.activeValidators,
        epoch: metrics.epoch
      });

      return metrics;
    } catch (error) {
      console.error('Public Solana RPC network metrics failed:', error.message);
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
   * Get real-time TPS monitoring data using direct RPC
   */
  async getTpsMonitoring(sampleSize = 5) {
    try {
      const metrics = await this.getNetworkMetrics();
      
      return {
        timestamp: new Date().toISOString(),
        tps: metrics.network?.tps || 0,
        current_slot: metrics.network?.current_slot || 0,
        block_height: metrics.network?.block_height || 0,
        epoch: metrics.network?.epoch || 0,
        network_utilization: metrics.performance?.network_utilization || 0,
        source: 'solana_rpc'
      };
    } catch (error) {
      console.error('TPS monitoring failed:', error.message);
      return {
        timestamp: new Date().toISOString(),
        tps: 0,
        current_slot: 0,
        block_height: 0,
        epoch: 0,
        network_utilization: 0,
        source: 'error'
      };
    }
  }
}

// Create singleton instance
const solanaOnChainService = new SolanaOnChainService();

module.exports = {
  SolanaOnChainService,
  solanaOnChainService
};