import Constants from "expo-constants";

// Get the base URL from environment - this points to a server that can make OpenRouter calls
// For production, you'll need a backend server or Convex action to call OpenRouter
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://localhost:3000"; // Replace with your API server URL

interface VerseResponse {
  reference: {
    book: string;
    chapter: number;
    verse: number;
    passage: string;
  };
  text: string;
  translation: string;
}

interface ExplanationResponse {
  verse_explanation: string;
  connection_to_user_need: string;
  guidance_application: string;
}

interface ExplainRequest {
  userQuestion: string;
  verseText: string;
  verseReference: string;
  translation: string;
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
