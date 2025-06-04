import { OpenAI } from "openai";

async function testSimpleOpenAI() {
  console.log("Testing basic OpenAI connectivity...");
  
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error("Error: OPENAI_API_KEY is undefined");
    process.exit(1);
  }
  
  const openai = new OpenAI({ apiKey: key });
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Reply with exactly this JSON: {\"test\": \"success\"}" }
      ],
      temperature: 0
    });
    
    console.log("OpenAI response:", completion.choices[0].message.content);
    console.log("Test completed successfully!");
  } catch (err) {
    console.error("OpenAI error:", err.message);
  }
}

testSimpleOpenAI();