// scripts/testLunarNews.js
/**
 * Test LunarCrush news fetching using API4 endpoint
 */

async function fetchSolanaNews() {
  const LUNARCRUSH_API_KEY = process.env.LUNARCRUSH_API_KEY;
  
  if (!LUNARCRUSH_API_KEY) {
    console.error('LUNARCRUSH_API_KEY not found');
    return { success: false, error: 'Missing API key' };
  }

  try {
    const url = 'https://lunarcrush.com/api4/public/topic/solana/news/v1';
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${LUNARCRUSH_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      const articles = data.data.map(article => ({
        title: article.title || 'No title',
        content: article.description || article.summary || 'No content',
        url: article.url,
        source: article.source || 'LunarCrush',
        published_at: article.time ? new Date(article.time * 1000).toISOString() : new Date().toISOString()
      }));

      return {
        success: true,
        data: {
          news: articles,
          count: articles.length
        },
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: false,
      error: 'No news data found',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('LunarCrush news fetch error:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Test the news fetching
async function testNewsApi() {
  console.log('Testing LunarCrush news API...');
  
  const result = await fetchSolanaNews();
  
  if (result.success) {
    console.log('✓ News fetch successful');
    console.log(`Found ${result.data.count} articles`);
    
    if (result.data.news.length > 0) {
      console.log('\nFirst article:');
      console.log(`Title: ${result.data.news[0].title}`);
      console.log(`Source: ${result.data.news[0].source}`);
      console.log(`Published: ${result.data.news[0].published_at}`);
    }
  } else {
    console.log('✗ News fetch failed:', result.error);
  }
  
  return result;
}

export { fetchSolanaNews };

// Run test if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testNewsApi();
}