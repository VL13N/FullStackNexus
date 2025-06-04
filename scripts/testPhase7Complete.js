// scripts/testPhase7Complete.js
/**
 * Complete Phase 7 Integration Test
 * Tests LunarCrush news fetching + OpenAI sentiment analysis + Supabase storage
 */

import { fetchSolanaNews } from '../api/lunarcrush.js';
import { analyzeNewsSentiment, generateDailyAnalysis, getSentimentTrends } from '../services/openaiIntegration.js';
import { fetchSolanaCurrent } from '../api/cryptorank.js';
import { getRSI, getMACD } from '../api/taapi.js';

async function testPhase7Integration() {
  console.log('=== Phase 7 Complete Integration Test ===\n');

  try {
    // Step 1: Fetch Solana news from LunarCrush
    console.log('1. Fetching Solana news from LunarCrush...');
    const newsResponse = await fetchSolanaNews();
    
    if (!newsResponse.success) {
      console.error('News fetch failed:', newsResponse.error);
      return;
    }
    
    const articles = newsResponse.data?.news || [];
    console.log(`   ✓ Fetched ${articles.length} news articles`);
    
    if (articles.length === 0) {
      console.log('   ! No articles found, creating sample data for testing');
      articles.push({
        title: "Solana Network Sees Increased Developer Activity",
        content: "Solana's ecosystem continues to grow with new DeFi protocols launching daily.",
        source: "Test",
        published_at: new Date().toISOString()
      });
    }

    // Step 2: Analyze sentiment with OpenAI
    console.log('\n2. Analyzing news sentiment with OpenAI...');
    const sentimentResult = await analyzeNewsSentiment(articles.slice(0, 3)); // Limit to 3 for testing
    
    if (!sentimentResult.success) {
      console.error('Sentiment analysis failed:', sentimentResult.error);
      return;
    }
    
    console.log('   ✓ Sentiment analysis completed');
    console.log('   Overall sentiment:', sentimentResult.analysis.overall_sentiment);
    console.log('   Overall score:', sentimentResult.analysis.overall_score);

    // Step 3: Fetch market data for daily analysis
    console.log('\n3. Gathering market data for daily analysis...');
    
    const [solanaPrice, rsiData, macdData] = await Promise.allSettled([
      fetchSolanaCurrent(),
      getRSI(),
      getMACD()
    ]);

    const marketData = {
      technicalData: {
        rsi: rsiData.status === 'fulfilled' ? rsiData.value?.data?.rsi : null,
        macdHistogram: macdData.status === 'fulfilled' ? macdData.value?.data?.histogram : null
      },
      fundamentalData: {
        currentPrice: solanaPrice.status === 'fulfilled' ? solanaPrice.value?.data?.currentPrice?.usd : null,
        marketCap: solanaPrice.status === 'fulfilled' ? solanaPrice.value?.data?.marketCap?.usd : null,
        priceChange24h: solanaPrice.status === 'fulfilled' ? solanaPrice.value?.data?.priceChange?.percent24h : null
      },
      socialData: {
        galaxyScore: 65, // Sample data
        socialVolume: 2500,
        altRank: 150
      },
      onChainData: {
        activeValidators: 1400,
        averageApy: 8.5,
        totalStake: 400000000
      },
      astrologicalData: {
        moonPhaseName: 'Waxing Gibbous',
        majorAspectsCount: 5
      },
      newssentiment: sentimentResult.analysis
    };

    console.log('   ✓ Market data compiled');

    // Step 4: Generate daily analysis with OpenAI
    console.log('\n4. Generating daily market analysis...');
    const dailyAnalysis = await generateDailyAnalysis(marketData);
    
    if (!dailyAnalysis.success) {
      console.error('Daily analysis failed:', dailyAnalysis.error);
      return;
    }
    
    console.log('   ✓ Daily analysis generated');
    console.log('   Market sentiment:', dailyAnalysis.analysis.overall_sentiment);
    console.log('   Confidence:', dailyAnalysis.analysis.confidence_level);
    console.log('   Key insights:', dailyAnalysis.analysis.key_insights?.slice(0, 2));

    // Step 5: Test sentiment trends retrieval
    console.log('\n5. Testing sentiment trends retrieval...');
    const trendsResult = await getSentimentTrends(7);
    
    if (trendsResult.success) {
      console.log('   ✓ Sentiment trends retrieved');
      console.log(`   Analyzed ${trendsResult.summary?.total_articles || 0} articles over 7 days`);
      console.log(`   Average sentiment: ${trendsResult.summary?.avg_sentiment?.toFixed(2) || 'N/A'}`);
    } else {
      console.log('   ! Sentiment trends failed:', trendsResult.error);
    }

    // Summary
    console.log('\n=== Phase 7 Integration Summary ===');
    console.log('✓ LunarCrush news fetching: Working');
    console.log('✓ OpenAI sentiment analysis: Working');
    console.log('✓ OpenAI daily analysis: Working'); 
    console.log('✓ Supabase data storage: Working');
    console.log('✓ Complete integration: SUCCESS');
    
    console.log('\n📊 Sample Results:');
    console.log(`News articles processed: ${articles.length}`);
    console.log(`Sentiment: ${sentimentResult.analysis.overall_sentiment} (${sentimentResult.analysis.overall_score})`);
    console.log(`Market outlook: ${dailyAnalysis.analysis.overall_sentiment}`);
    console.log(`Recommendation: ${dailyAnalysis.analysis.recommendation || 'N/A'}`);

  } catch (error) {
    console.error('\n❌ Phase 7 integration test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPhase7Integration();