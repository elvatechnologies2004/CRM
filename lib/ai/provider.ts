/**
 * AI provider abstraction layer.
 * All AI calls go through this module to keep provider logic isolated.
 * Server-only: never expose API keys to the client.
 */

import "server-only";

import { geminiEnv, isGeminiConfigured } from "@/lib/env";
import { generateText } from "@/lib/ai/gemini";

export interface AIProviderConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

const DEFAULT_CONFIG: AIProviderConfig = {
  model: "gemini-3.6-flash",
  temperature: 0.4,
  maxOutputTokens: 4096,
};

/**
 * Generate a text completion using the configured AI provider.
 * Falls back to a deterministic mock response when no API key is configured.
 */
export async function generateAICompletion(request: AIRequest): Promise<AIResponse> {
  if (isGeminiConfigured()) {
    try {
      const text = await generateText({
        system: request.systemPrompt,
        prompt: request.userPrompt,
        temperature: request.temperature ?? DEFAULT_CONFIG.temperature,
        maxOutputTokens: request.maxOutputTokens ?? DEFAULT_CONFIG.maxOutputTokens,
      });

      return {
        text,
        provider: "gemini",
        model: geminiEnv.model,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    } catch (error) {
      console.error("AI provider call failed:", error);
      throw error;
    }
  }

  // Fallback: deterministic mock response when no API key is configured
  return {
    text: JSON.stringify({
      fallback: true,
      message: "AI provider not configured. Set GEMINI_API_KEY to enable AI features.",
    }),
    provider: "mock",
    model: "mock",
  };
}

/**
 * Generate structured JSON output from AI.
 * Validates and parses the JSON response.
 */
export async function generateStructuredOutput<T>(
  request: AIRequest,
  validator: (parsed: unknown) => T
): Promise<T> {
  const response = await generateAICompletion(request);

  // Try to parse JSON from the response text
  try {
    const cleaned = response.text
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new Error("No JSON object found in AI response");
    }

    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return validator(parsed);
  } catch (error) {
    console.error("AI structured output parsing failed:", error);
    throw new Error(
      `Failed to parse AI structured output: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if real AI provider is available.
 */
export function isAIProviderAvailable(): boolean {
  return isGeminiConfigured();
}

/**
 * Get the current AI provider configuration.
 */
export function getAIProviderConfig(): AIProviderConfig {
  return { ...DEFAULT_CONFIG };
}