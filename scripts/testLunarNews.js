// /scripts/testLunarNews.js

async function testNews() {
  const key = process.env.LUNARCRUSH_API_KEY;
  if (!key) {
    console.error("Error: LUNARCRUSH_API_KEY is undefined");
    process.exit(1);
  }
  const url = `https://lunarcrush.com/api4/public/topic/solana/news/v1`;
  console.log("Calling LunarCrush API4 news endpoint:");
  console.log(url);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });
    console.log("HTTP status:", res.status);
    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      console.log("Received", json.data.length, "news items. Sample:");
      console.log(JSON.stringify(json.data.slice(0, 3), null, 2));
    } else {
      console.error("Unexpected response format:", JSON.stringify(json, null, 2));
    }
  } catch (err) {
    console.error("Network or JSON error:", err);
  }
  process.exit(0);
}

testNews();