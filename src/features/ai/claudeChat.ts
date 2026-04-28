import { buildSystemPrompt, type BusinessSnapshot } from "./buildSystemPrompt";
import type { ChatMsg } from "@/types";

export async function sendToClaudeAPI(
  userMessage: string,
  history: ChatMsg[],
  snapshot: BusinessSnapshot
): Promise<string> {
  const systemPrompt = buildSystemPrompt(snapshot);
  const recent = history.slice(-6);
  const messages = [
    ...recent.map(m => ({ role: m.from === "user" ? "user" : "assistant", content: m.text })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": (import.meta.env.VITE_ANTHROPIC_API_KEY as string) ?? "",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) throw new Error(`API ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text ?? "Maaf, ada masalah teknikal. Cuba lagi.";
}