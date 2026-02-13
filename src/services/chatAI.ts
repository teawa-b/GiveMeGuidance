import { chatApi } from "./api";

export interface ChatContext {
  verseText: string;
  verseReference: string;
  userQuestion: string;
  reflectionPrompt?: string; // The "Reflect Deeper" question if user clicked one
  explanationData: {
    verse_explanation: string;
    connection_to_user_need: string;
    guidance_application: string;
    reflection_prompt?: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Send a chat message with context about the verse via backend API
export async function sendChatMessage(
  context: ChatContext,
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  return chatApi(context, messages, userMessage);
}

