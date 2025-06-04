// /services/cryptoRankLimiter.js
// Rate limiter for CryptoRank Basic plan: 100 calls/minute, 5,000 credits/day

const callTimestamps = [];

export async function rateLimit() {
  const now = Date.now();
  
  // Remove timestamps older than 60 seconds
  while (callTimestamps.length && now - callTimestamps[0] >= 60_000) {
    callTimestamps.shift();
  }
  
  if (callTimestamps.length >= 100) {
    // Wait until enough time has passed
    const wait = 60_000 - (now - callTimestamps[0]) + 10; // add a 10ms buffer
    console.log(`CryptoRank: Rate limit reached, waiting ${wait}ms`);
    await new Promise((r) => setTimeout(r, wait));
    return rateLimit(); // recursively check again
  }
  
  callTimestamps.push(now);
  return;
}

// Helper to log current rate limit status
export function getRateLimitStatus() {
  const now = Date.now();
  const recentCalls = callTimestamps.filter(timestamp => now - timestamp < 60_000);
  return {
    callsInLastMinute: recentCalls.length,
    remainingCalls: Math.max(0, 100 - recentCalls.length),
    nextResetIn: recentCalls.length > 0 ? 60_000 - (now - recentCalls[0]) : 0
  };
}