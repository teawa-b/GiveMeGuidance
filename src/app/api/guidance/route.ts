import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are the AI assistant for the website Give Me Guidance. Your task is to analyze the user's question or problem, perform a web search to determine the most contextually relevant Bible verse, and return the result in STRICT JSON format only.

Core Function
1. Interpret the user's emotional or spiritual need.
2. Identify keywords and themes in the message.
3. Perform a targeted web search to find the most relevant Bible verse.
4. Produce a short internal checklist (3–7 bullets) describing the steps you will take.
5. Return ONLY the JSON object that matches the exact schema provided below.

Mandatory JSON Schema
Your output must ALWAYS match this schema precisely:

{
  "reference": {
    "book": "",
    "chapter": 0,
    "verse": 0,
    "passage": ""
  },
  "text": "",
  "translation": "NLT"
}

Non-Negotiable Rules
• Output MUST contain valid JSON only.  
• NEVER include explanations, reasoning, commentary, or extra text outside the JSON.  
• The "passage" field must be a readable reference like "John 14:27".  
• Provide ONLY one verse unless the user explicitly requests more.  
• Verse text MUST match the New Living Translation (NLT).  
• If the verse spans multiple verses (e.g., 3–4), use only the first unless otherwise instructed.  
• If no perfect match is found from search results, choose the closest spiritually relevant verse.  
• Ensure the JSON is clean, complete, and strictly conforms to the provided structure.  
• You may NOT add fields or alter the structure.  

Safety Guidance
If the user expresses distress, sadness, fear, or mentions mental health struggles:
• Perform a web search specifically for comforting, hope-focused Bible verses.
• DO NOT give advice, reassurance, opinions, or counseling.
• Still return only the selected verse in JSON format.

Process Checklist Requirement
Before generating the final JSON output, begin your response with a concise bullet list (3–7 items) outlining the internal actions you will take, such as:
• Identify emotional theme  
• Extract keywords  
• Perform targeted web search  
• Select best NLT verse  
• Prepare JSON output  

This checklist appears BEFORE the JSON and is the only non-JSON content allowed.

Output Format
Your entire response must consist of:
1. The short bullet checklist (3–7 bullets)
2. A single JSON object strictly following the schema

Nothing else is allowed in your output.`

export interface VerseResponse {
  reference: {
    book: string
    chapter: number
    verse: number
    passage: string
  }
  text: string
  translation: string
}

function parseVerseFromResponse(content: string): VerseResponse | null {
  try {
    // Try to find JSON object in the response (it may have bullet points before it)
    // Look for the JSON block more carefully
    const jsonMatch = content.match(/\{[\s\S]*?"reference"[\s\S]*?"text"[\s\S]*?\}/)
    if (!jsonMatch) {
      console.error("No JSON match found in content")
      return null
    }
    
    // Clean up any potential issues with the JSON string
    let jsonStr = jsonMatch[0]
    
    // Try to parse
    const parsed = JSON.parse(jsonStr)
    
    // Validate the structure - be more lenient with types
    if (
      parsed.reference &&
      parsed.reference.book &&
      parsed.reference.passage &&
      parsed.text
    ) {
      // Ensure proper types
      return {
        reference: {
          book: String(parsed.reference.book),
          chapter: Number(parsed.reference.chapter) || 0,
          verse: Number(parsed.reference.verse) || 0,
          passage: String(parsed.reference.passage),
        },
        text: String(parsed.text),
        translation: String(parsed.translation || "NLT"),
      }
    }
    
    console.error("Parsed JSON missing required fields:", parsed)
    return null
  } catch (err) {
    console.error("JSON parse error:", err)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      )
    }

    // Use fetch directly for more control over the response
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Give Me Guidance",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-search-preview",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: query,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenRouter API error:", errorText)
      return NextResponse.json(
        { error: "Failed to get response from AI", details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    const fullContent = data.choices?.[0]?.message?.content || ""

    console.log("AI Response:", fullContent) // Debug log

    const verseData = parseVerseFromResponse(fullContent)

    if (!verseData) {
      console.error("Failed to parse:", fullContent)
      return NextResponse.json(
        { error: "Failed to parse verse data from AI response", rawResponse: fullContent },
        { status: 500 }
      )
    }

    return NextResponse.json(verseData)
  } catch (error) {
    console.error("Guidance API error:", error)
    return NextResponse.json(
      { error: "Failed to get guidance", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
