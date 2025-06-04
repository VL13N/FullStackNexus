// /scripts/testFetchAndScoreNews.js
import { fetchAndScoreNews } from "../services/openaiIntegration.js";

async function runTest() {
  console.log("Testing fetchAndScoreNews()");
  try {
    const scored = await fetchAndScoreNews();
    if (Array.isArray(scored) && scored.length === 0) {
      console.log("fetchAndScoreNews(): returned [] (no headlines or skipped).");
    } else {
      console.log("fetchAndScoreNews() returned:", JSON.stringify(scored, null, 2));
    }
  } catch (err) {
    console.error("Error in fetchAndScoreNews():", err.message || err);
  }
  process.exit(0);
}

runTest();