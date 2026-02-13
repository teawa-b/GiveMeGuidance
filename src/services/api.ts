import Constants from "expo-constants";

// API Base URL - set this to your deployed backend URL
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://givemeguidancebackend-production.up.railway.app";

// Log immediately on module load
console.log("ðŸ”Œ [API] Module loaded - API_BASE_URL:", API_BASE_URL);

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
 * @param recentVerses - Recently shown verse references to help the backend avoid repetition
 */
export async function guidanceApi(query: string, recentVerses?: string[]): Promise<VerseResponse> {
  console.log("[API] guidanceApi called with query:", query);
  console.log("[API] Using base URL:", API_BASE_URL);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/guidance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, recentVerses }),
    });

    console.log("[API] Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[API] Error response:", errorData);
      throw new Error(errorData.error || "Failed to get guidance");
    }

    const data = await response.json();
    console.log("[API] Success response:", data);
    return data;
  } catch (error) {
    console.error("[API] Fetch error:", error);
    throw error;
  }
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

interface DailyWalkRequest {
  verseText: string;
  verseReference: string;
  userGoals: string;
  style: string;
}

interface DailyWalkResponse {
  reflection: string;
  step: string;
  prayer: string;
}

/**
 * Generate daily walk content (reflection, short step, and prayer) for onboarding
 */
export async function generateDailyWalkApi(request: DailyWalkRequest): Promise<DailyWalkResponse> {
  const response = await fetch(`${API_BASE_URL}/api/dailywalk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate daily walk");
  }

  return response.json();
}

