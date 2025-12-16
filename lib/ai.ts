import { createAnthropic } from "@ai-sdk/anthropic";

// Create and export configured Anthropic client
export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Default model to use for plan generation
export const DEFAULT_MODEL = "claude-sonnet-4-20250514";
