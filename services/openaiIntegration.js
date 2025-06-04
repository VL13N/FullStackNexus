// NOTE: Ensure OPENAI_API_KEY and LUNARCRUSH_API_KEY are set in environment variables.
//       If you receive "Invalid API key," verify the key in LunarCrush and OpenAI dashboards.

/**
 * OpenAI Integration Service for Phase 7
 * Fetches and scores LunarCrush news, generates daily market updates, and suggests dynamic pillar weights
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LUNARCRUSH_API_KEY = process.env.LUNARCRUSH_API_KEY;

if (!LUNARCRUSH_API_KEY) {
  throw new Error("LUNARCRUSH_API_KEY is undefined—check Replit Secrets and restart.");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is undefined—check Replit Secrets and restart.");
}

/**
 * Fetch and score news from LunarCrush using OpenAI
 * @returns {Array} Array of scored news items
 */
export async function fetchAndScoreNews() {
  try {
    // Fetch news from LunarCrush
    const newsUrl = `https://api.lunarcrush.com/v2?data=news&key=${LUNARCRUSH_API_KEY}&symbol=SOL`;
    
    const response = await fetch(newsUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`LunarCrush news API HTTP ${response.status}: ${await response.text()}`);
    }

    const newsData = await response.json();
    
    if (!newsData.data || !Array.isArray(newsData.data)) {
      throw new Error('Invalid news data format from LunarCrush');
    }

    // Extract up to latest 20 headlines
    const headlines = newsData.data
      .slice(0, 20)
      .map(item => item.title || item.headline || item.text)
      .filter(Boolean);

    if (headlines.length === 0) {
      console.log('No headlines found from LunarCrush news');
      return [];
    }

    // Build prompt for GPT-4
    const headlinesList = headlines.map((headline, index) => `${index + 1}. ${headline}`).join('\n');
    
    const prompt = `Given these Solana news headlines (1–${headlines.length}):
${headlinesList}

Score each from -100 (extremely bearish) to +100 (extremely bullish) for short-term SOL price impact.
Return JSON array like:
[
  { "headline": "<text>", "score": <number>, "justification": "<brief text>" },
  ...
]`;

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    const responseText = completion.choices[0].message.content;
    
    // Parse JSON response
    let scoredNews;
    try {
      scoredNews = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', responseText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    if (!Array.isArray(scoredNews)) {
      throw new Error('OpenAI response is not an array');
    }

    // Store in Supabase news_scores table
    const timestamp = new Date().toISOString();
    
    for (const item of scoredNews) {
      if (item.headline && typeof item.score === 'number' && item.justification) {
        try {
          // Insert into database using raw SQL
          const query = `
            INSERT INTO news_scores (timestamp, headline, score, justification)
            VALUES ($1, $2, $3, $4)
          `;
          
          // Note: This would need actual database connection
          // For now, we'll log the data that would be stored
          console.log('Would store in news_scores:', {
            timestamp,
            headline: item.headline,
            score: item.score,
            justification: item.justification
          });
        } catch (dbError) {
          console.error('Failed to store news score in database:', dbError);
        }
      }
    }

    return scoredNews;
    
  } catch (error) {
    console.error('Failed to fetch and score news:', error);
    throw error;
  }
}

/**
 * Generate daily market update using OpenAI
 * @returns {string} Generated market update text
 */
export async function generateDailyUpdate() {
  try {
    // Fetch yesterday's news scores (would be from database)
    // For now, simulating the database query
    const newsScores = [
      // This would come from: SELECT * FROM news_scores WHERE timestamp >= NOW() - INTERVAL '24 hours' ORDER BY timestamp DESC LIMIT 20
    ];

    // Fetch latest prediction data (would be from database)
    // For now, simulating the database query
    const latestPrediction = {
      // This would come from: SELECT * FROM live_predictions ORDER BY timestamp DESC LIMIT 1
      tech_score: 65.5,
      social_score: 72.3,
      fund_score: 58.9,
      astro_score: 45.2,
      predicted_pct: 2.8,
      category: 'Moderate Bullish'
    };

    // Build news summary for prompt
    const newsSummary = newsScores.length > 0 
      ? newsScores.map(item => `• "${item.headline}" (score: ${item.score})`).join('\n')
      : '• No recent news data available';

    const prompt = `Using these inputs:

• Latest 20 news items with scores:
${newsSummary}

• Latest prediction data:
– Technical Score: ${latestPrediction.tech_score}
– Social Score: ${latestPrediction.social_score}
– Fundamental Score: ${latestPrediction.fund_score}
– Astrology Score: ${latestPrediction.astro_score}
– Predicted Move: ${latestPrediction.predicted_pct}% (${latestPrediction.category})

1. Summarize the top bullish and bearish factors in 2–3 bullet points each.
2. Provide a concise market outlook for Solana today, blending news sentiment, scores, and predicted move.
3. Conclude with a brief recommendation (e.g., "Monitor X, Y, Z").
Return only the plain‐text update (no extra JSON).`;

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    });

    const updateText = completion.choices[0].message.content;

    // Store in Supabase daily_updates table
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
      // Insert into database using raw SQL
      const query = `
        INSERT INTO daily_updates (date, content)
        VALUES ($1, $2)
        ON CONFLICT (date) DO UPDATE SET content = $2
      `;
      
      // Note: This would need actual database connection
      console.log('Would store in daily_updates:', {
        date: today,
        content: updateText
      });
    } catch (dbError) {
      console.error('Failed to store daily update in database:', dbError);
    }

    return updateText;
    
  } catch (error) {
    console.error('Failed to generate daily update:', error);
    throw error;
  }
}

/**
 * Suggest dynamic pillar weights using OpenAI
 * @returns {Object} Suggested weights and justifications
 */
export async function suggestWeights() {
  try {
    // Fetch last 24 predictions (would be from database)
    // For now, simulating the database query
    const recentPredictions = [
      // This would come from: SELECT * FROM live_predictions ORDER BY timestamp DESC LIMIT 24
    ];

    // Fetch last 20 news scores (would be from database)
    const recentNews = [
      // This would come from: SELECT * FROM news_scores ORDER BY timestamp DESC LIMIT 20
    ];

    // Build predictions summary for prompt
    const predictionsSummary = recentPredictions.length > 0 
      ? recentPredictions.map(pred => 
          `– "${pred.timestamp}": tech=${pred.tech_score}, social=${pred.social_score}, fund=${pred.fund_score}, astro=${pred.astro_score}, predPct=${pred.predicted_pct}%`
        ).join('\n')
      : '– No recent prediction data available';

    // Build news summary for prompt
    const newsSummary = recentNews.length > 0 
      ? recentNews.map(item => `– "${item.headline}" (score: ${item.score})`).join('\n')
      : '– No recent news data available';

    const prompt = `Based on these recent data:

• Live predictions (chronological, newest first):
${predictionsSummary}

• Latest news scores:
${newsSummary}

Recommend updated percentage weights (sum = 100) for these four pillars:
• Technical
• Social
• Fundamental
• Astrology

Provide JSON:
{
  "Technical": <number>,
  "Social": <number>,
  "Fundamental": <number>,
  "Astrology": <number>,
  "justification": {
    "Technical": "<reason>",
    "Social": "<reason>",
    "Fundamental": "<reason>",
    "Astrology": "<reason>"
  }
}`;

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    const responseText = completion.choices[0].message.content;
    
    // Parse JSON response
    let weightsData;
    try {
      weightsData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI weights response as JSON:', responseText);
      throw new Error('Invalid JSON response from OpenAI for weights');
    }

    // Validate weights sum to 100
    const totalWeight = weightsData.Technical + weightsData.Social + weightsData.Fundamental + weightsData.Astrology;
    if (Math.abs(totalWeight - 100) > 1) {
      console.warn(`Weights sum to ${totalWeight}, not 100. Normalizing...`);
      const factor = 100 / totalWeight;
      weightsData.Technical *= factor;
      weightsData.Social *= factor;
      weightsData.Fundamental *= factor;
      weightsData.Astrology *= factor;
    }

    // Store in Supabase dynamic_weights table
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
      // Insert into database using raw SQL
      const query = `
        INSERT INTO dynamic_weights (date, technical, social, fundamental, astrology, justification)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (date) DO UPDATE SET 
          technical = $2, social = $3, fundamental = $4, astrology = $5, justification = $6
      `;
      
      // Note: This would need actual database connection
      console.log('Would store in dynamic_weights:', {
        date: today,
        technical: weightsData.Technical,
        social: weightsData.Social,
        fundamental: weightsData.Fundamental,
        astrology: weightsData.Astrology,
        justification: weightsData.justification
      });
    } catch (dbError) {
      console.error('Failed to store dynamic weights in database:', dbError);
    }

    return weightsData;
    
  } catch (error) {
    console.error('Failed to suggest weights:', error);
    throw error;
  }
}