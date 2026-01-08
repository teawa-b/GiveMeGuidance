"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Bible verse guidance action
export const getGuidance = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API key not configured");
    }

    const systemPrompt = `You are a compassionate biblical counselor. When given a user's question or struggle, provide ONE relevant Bible verse that speaks to their situation.

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "reference": {
    "book": "Book Name",
    "chapter": 1,
    "verse": 1,
    "passage": "Book Name 1:1"
  },
  "text": "The exact verse text from the Bible",
  "translation": "NIV"
}

Guidelines:
- Choose verses that are encouraging, relevant, and applicable
- Use the NIV translation primarily
- Ensure the verse directly addresses the user's concern
- Include the complete verse text, not partial quotes`;

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
          { role: "user", content: `I need guidance about: ${args.query}` },
        ],
        temperature: 0.7,
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
  },
});

// Bible verse explanation action
export const getExplanation = action({
  args: {
    userQuestion: v.string(),
    verseText: v.string(),
    verseReference: v.string(),
    translation: v.string(),
  },
  handler: async (ctx, args) => {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API key not configured");
    }

    const systemPrompt = `You are a compassionate biblical counselor providing personalized guidance. Given a Bible verse and the user's question, provide a warm, helpful explanation.

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "verse_explanation": "A clear explanation of what this verse means in its biblical context (2-3 sentences)",
  "connection_to_user_need": "How this verse specifically speaks to the user's situation and feelings (2-3 sentences)",
  "guidance_application": "Practical, encouraging advice on how to apply this verse to their life (2-3 sentences)"
}

Guidelines:
- Be warm, empathetic, and encouraging
- Make the explanation personal and relevant to their specific question
- Offer practical, actionable guidance
- Keep each section concise but meaningful`;

    const userMessage = `The user asked: "${args.userQuestion}"

The verse given is ${args.verseReference} (${args.translation}):
"${args.verseText}"

Please provide a personalized explanation and guidance.`;

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
          { role: "user", content: userMessage },
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
  },
});
