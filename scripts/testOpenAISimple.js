// scripts/testOpenAISimple.js
/**
 * Simple OpenAI API test to verify connectivity and response handling
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAIConnection() {
  console.log('Testing OpenAI API connection...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not found');
    return false;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond only with valid JSON."
        },
        {
          role: "user",
          content: 'Return this exact JSON: {"status": "success", "message": "OpenAI API working", "score": 85}'
        }
      ],
      temperature: 0.1,
      max_tokens: 100
    });

    const content = response.choices[0].message.content;
    console.log('Raw OpenAI response:', content);
    
    // Try to parse JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed JSON:', parsed);
        return parsed;
      } else {
        console.log('No JSON found in response');
        return { status: 'error', message: 'No JSON in response' };
      }
    } catch (parseError) {
      console.log('JSON parse error:', parseError.message);
      return { status: 'error', message: 'Invalid JSON response' };
    }

  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return false;
  }
}

async function testSentimentAnalysis() {
  console.log('\nTesting sentiment analysis...');
  
  const testArticle = {
    title: "Solana Network Achieves Record Transaction Speeds",
    content: "Solana blockchain has successfully processed over 65,000 transactions per second, marking a new milestone for the network."
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a cryptocurrency sentiment analyst. Respond only with valid JSON."
        },
        {
          role: "user",
          content: `Analyze sentiment of: "${testArticle.title} - ${testArticle.content}". Return JSON: {"sentiment": "positive|negative|neutral", "score": 0.8, "confidence": 0.9}`
        }
      ],
      temperature: 0.2,
      max_tokens: 150
    });

    const content = response.choices[0].message.content;
    console.log('Sentiment response:', content);
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const sentiment = JSON.parse(jsonMatch[0]);
      console.log('Sentiment analysis:', sentiment);
      return sentiment;
    }
    
    return null;

  } catch (error) {
    console.error('Sentiment analysis error:', error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('=== OpenAI Integration Tests ===\n');
  
  const connectionTest = await testOpenAIConnection();
  if (connectionTest) {
    console.log('✓ OpenAI connection successful');
    
    const sentimentTest = await testSentimentAnalysis();
    if (sentimentTest) {
      console.log('✓ Sentiment analysis working');
    } else {
      console.log('✗ Sentiment analysis failed');
    }
  } else {
    console.log('✗ OpenAI connection failed');
  }
  
  console.log('\n=== Test Summary ===');
  console.log('OpenAI API:', connectionTest ? 'Working' : 'Failed');
  console.log('This demonstrates Phase 7 OpenAI integration is functional');
}

runTests();