// /scripts/checkEnv.js
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✔ loaded" : "✘ missing");
console.log("LUNARCRUSH_API_KEY:", process.env.LUNARCRUSH_API_KEY ? "✔ loaded" : "✘ missing");
process.exit(0);