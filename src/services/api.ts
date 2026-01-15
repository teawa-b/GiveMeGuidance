import Constants from "expo-constants";

// API Base URL - set this to your deployed backend URL
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://localhost:3000"; // Replace with your API server URL after deployment

export { API_BASE_URL };

interface VerseResponse {
  reference: {
    book: string;
    chapter: number;
    verse: number;
    passage: string;
  };
  text: string;
  translation: string;
  theme: string;
}

interface ExplanationResponse {
  verse_explanation: string;
  connection_to_user_need: string;
  guidance_application: string;
  reflection_prompt: string;
}

interface ExplainRequest {
  userQuestion: string;
  verseText: string;
  verseReference: string;
  translation: string;
}

interface ChatContext {
  verseText: string;
  verseReference: string;
  userQuestion: string;
  reflectionPrompt?: string;
  explanationData: {
    verse_explanation: string;
    connection_to_user_need: string;
    guidance_application: string;
    reflection_prompt?: string;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Fetch guidance verse based on user's query
 */
export async function guidanceApi(query: string): Promise<VerseResponse> {
  const response = await fetch(`${API_BASE_URL}/api/guidance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to get guidance");
  }

  return response.json();
}

/**
 * Fetch explanation for a verse
 */
export async function explainApi(request: ExplainRequest): Promise<ExplanationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/explain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to get explanation");
  }

  return response.json();
}

/**
 * Send a chat message with context about the verse
 */
export async function chatApi(
  context: ChatContext,
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context,
      messages,
      userMessage,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to get chat response");
  }

  const data = await response.json();
  return data.content;
}
