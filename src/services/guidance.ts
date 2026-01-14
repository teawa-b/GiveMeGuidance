const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export interface VerseData {
  reference: {
    book: string;
    chapter: number;
    verse: number;
    passage: string;
  };
  text: string;
  translation: string;
  theme: string; // One-word theme like "Patience", "Surrender", "Courage"
}

export interface ExplanationData {
  verse_explanation: string;
  connection_to_user_need: string;
  guidance_application: string;
  reflection_prompt: string; // A personalized question for the user to reflect on
}

// Get Bible verse guidance
export async function getGuidance(query: string): Promise<VerseData> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  // Generate a random seed to encourage variety in verse selection
  const randomSeed = Math.floor(Math.random() * 10000);
  const timestamp = Date.now();

  const systemPrompt = `You are a compassionate biblical counselor. When given a user's question or struggle, provide ONE relevant Bible verse that speaks to their situation.

IMPORTANT VARIETY INSTRUCTION: There are MANY verses in the Bible that can speak to any given situation. You must NOT always pick the most obvious or popular verse. Instead, think of 5-10 different verses that could apply, then randomly select ONE of them based on this seed number: ${randomSeed}. Vary your selections - draw from different books (Old Testament, New Testament, Psalms, Proverbs, Gospels, Epistles, etc.).

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "reference": {
    "book": "Book Name",
    "chapter": 1,
    "verse": 1,
    "passage": "Book Name 1:1"
  },
  "text": "The exact verse text from the Bible",
  "translation": "NIV",
  "theme": "OneWord"
}

Guidelines:
- Think of multiple applicable verses first, then pick ONE randomly
- Don't always default to the most famous verses (John 3:16, Jeremiah 29:11, Philippians 4:13, etc.) - dig deeper
- Choose verses that are encouraging, relevant, and applicable
- Use the NIV translation primarily
- Ensure the verse directly addresses the user's concern
- Include the complete verse text, not partial quotes
- Consider lesser-known but equally powerful verses
- The "theme" should be a single evocative word that captures the essence of the verse's message (e.g., "Patience", "Surrender", "Courage", "Trust", "Restoration", "Hope", "Release", "Alignment")`;

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
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `[Request ID: ${timestamp}] I need guidance about: ${query}` },
      ],
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter error:", errorText);
    throw new Error("Failed to get guidance from AI");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from AI");
  }

  // Parse the JSON response
  try {
    // Clean up the response - remove markdown code blocks if present
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedContent);
    return parsed;
  } catch (e) {
    console.error("Failed to parse AI response:", content);
    throw new Error("Invalid response format from AI");
  }
}

// Get explanation for a verse
export async function getExplanation(
  userQuestion: string,
  verseText: string,
  verseReference: string,
  translation: string
): Promise<ExplanationData> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  const systemPrompt = `You are a compassionate biblical counselor providing personalized guidance. Given a Bible verse and the user's question, provide a warm, helpful explanation.

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "verse_explanation": "A clear explanation of what the verse means in its biblical context (2-3 sentences)",
  "connection_to_user_need": "How this verse specifically relates to the user's question or situation (2-3 sentences)",
  "guidance_application": "Practical ways to apply this wisdom in daily life as flowing prose paragraphs, NOT bullet points",
  "reflection_prompt": "A thoughtful, personalized question for the user to reflect on based on their situation and the verse"
}

Guidelines:
- Be warm, encouraging, and compassionate
- Make the connection personal to their situation
- Provide actionable, practical guidance
- Keep language accessible and relatable
- NEVER use bullet points, hyphens, dashes, or numbered lists - write in flowing, natural paragraphs
- NEVER use asterisks (*) for emphasis - if you want to emphasize something, simply write it naturally without special formatting
- The reflection_prompt should be a gentle, open-ended question that invites introspection (e.g., "What would it look like to fully surrender this worry today?", "Where in your life are you being called to trust more deeply?")`;

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
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `User's question: ${userQuestion}

Bible verse (${translation}): "${verseText}" — ${verseReference}

Please provide guidance based on this verse for the user's situation.`,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter error:", errorText);
    throw new Error("Failed to get explanation from AI");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from AI");
  }

  // Parse the JSON response
  try {
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedContent);
    return parsed;
  } catch (e) {
    console.error("Failed to parse AI response:", content);
    throw new Error("Invalid response format from AI");
  }
}
