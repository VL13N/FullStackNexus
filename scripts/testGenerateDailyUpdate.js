// /scripts/testGenerateDailyUpdate.js
import { generateDailyUpdate } from "../services/openaiIntegration.js";

async function runTest() {
  console.log("Testing generateDailyUpdate()");
  try {
    const update = await generateDailyUpdate();
    console.log("Daily update text:\n", update);
  } catch (err) {
    console.error("Error in generateDailyUpdate():", err.message || err);
  }
  process.exit(0);
}

runTest();