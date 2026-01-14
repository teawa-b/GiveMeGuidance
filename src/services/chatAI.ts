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

// Send a chat message with context about the verse
export async function sendChatMessage(
  context: ChatContext,
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  // Include reflection prompt context if present
  const reflectionContext = context.reflectionPrompt 
    ? `\n\nREFLECTION PROMPT GIVEN TO USER: "${context.reflectionPrompt}"\nThe user was invited to reflect on this question. Be aware of this context when responding.`
    : "";

  const systemPrompt = `You are a compassionate and wise biblical counselor continuing a conversation about a Bible verse. You have already provided initial guidance, and now the user wants to explore further.

CONTEXT:
- User's original question: "${context.userQuestion}"
- Bible verse (${context.verseReference}): "${context.verseText}"${reflectionContext}

INITIAL GUIDANCE PROVIDED:
Understanding This Verse: ${context.explanationData.verse_explanation}

How This Speaks to You: ${context.explanationData.connection_to_user_need}

Living It Out: ${context.explanationData.guidance_application}

RESPONSE GUIDELINES:
- Be warm, compassionate, and supportive
- Keep responses SHORT and digestible - 2-3 short paragraphs maximum
- Each paragraph should be 2-3 sentences only
- Stay focused on the verse and how it applies to the user's situation
- Provide practical, actionable advice when appropriate
- If the user asks about other topics, gently guide them back to biblical wisdom
- You may reference other relevant Bible verses if helpful
- Avoid overwhelming the user with too much information at once`;

  // Build the messages array for the API
  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://givemeguidance.app",
      "X-Title": "GiveMeGuidance",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 512, // Reduced for shorter responses
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter chat error:", errorText);
    throw new Error("Failed to get response from AI");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from AI");
  }

  return content;
}
