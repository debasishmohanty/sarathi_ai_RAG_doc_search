import * as dotenv from "dotenv";
import { createAgent, tool } from "langchain";
import * as z from "zod";

// Load environment variables
dotenv.config({ path: require("path").join(__dirname, "..", ".env") });

const getWeather = tool(
  (input) => `It's always sunny in ${input.city}!`,
  {
    name: "get_weather",
    description: "Get the weather for a given city",
    schema: z.object({
      city: z.string().describe("The city to get the weather for"),
    }),
  }
);

const agent = createAgent({
  model: "gpt-4o",
  tools: [getWeather],
});

(async () => {
  console.log("--- Direct Tool Invocation ---");
  const directResult = await getWeather.invoke({ city: "San Francisco" });
  console.log("Direct invoke result:", directResult);
  console.log("------------------------------");
})();

(async () => {
  // Check if API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY environment variable is NOT set");
    process.exit(1);
  }

  console.log("✓ API Key is set");

  const result = await agent.invoke({
    messages: [{ role: "user", content: "What's the weather in Tokyo?" }],
  });
  console.log("Agent result:", result.messages[result.messages.length - 1].content);
})();