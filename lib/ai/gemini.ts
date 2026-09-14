import "server-only";

import { geminiEnv } from "@/lib/env";

export interface GenerateTextOptions {
  system?: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/";

/**
 * Minimal Gemini text generation via the REST API (no SDK dependency).
 * Server-only — the API key never leaves the server.
 * Throws when the key is missing or the request fails.
 */
export async function generateText({
  system,
  prompt,
  temperature = 0.4,
  maxOutputTokens = 1024,
}: GenerateTextOptions): Promise<string> {
  if (!geminiEnv.isConfigured) {
    throw new Error("Gemini is not configured (GEMINI_API_KEY missing)");
  }

  const parts = system
    ? [
        { text: system },
        { text: prompt },
      ]
    : [{ text: prompt }];

  const response = await fetch(
    `${GEMINI_ENDPOINT}${geminiEnv.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiEnv.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature, maxOutputTokens },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text.trim();
}