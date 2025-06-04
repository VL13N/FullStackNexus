// /scripts/testSuggestWeights.js
import { suggestWeights } from "../services/openaiIntegration.js";

async function runTest() {
  console.log("Testing suggestWeights()");
  try {
    const weights = await suggestWeights();
    console.log("suggestWeights() returned JSON:\n", JSON.stringify(weights, null, 2));
  } catch (err) {
    console.error("Error in suggestWeights():", err.message || err);
  }
  process.exit(0);
}

runTest();