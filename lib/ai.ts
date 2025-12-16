import { createAnthropic } from "@ai-sdk/anthropic";

// Get API key - will be validated at runtime when actually used
const getApiKey = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. Please add it to your environment variables."
    );
  }
  return apiKey;
};

// Create Anthropic client lazily to ensure env vars are loaded
export const getAnthropic = () => {
  return createAnthropic({
    apiKey: getApiKey(),
  });
};

// Default model to use for plan generation
export const DEFAULT_MODEL = "claude-sonnet-4-20250514";
