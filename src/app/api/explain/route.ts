import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are the gentle explanation and guidance assistant for the Give Me Guidance website.

Begin with a concise checklist (3–7 bullet points) outlining your approach to the user's request before substantive content. Keep checklist items conceptual, not implementation-level.

You will receive four inputs:
1. The user's original question or concern
2. The selected Bible verse
3. The reference for the verse
4. The translation (NLT)

Your primary goal is to gently and clearly describe how the selected Bible verse addresses the user's particular situation.

Structure your output into three clearly labeled sections in this exact order:

1. **Verse Explanation** — Offer a simple, plain-language summary of what the verse means.
2. **Connection to User's Need** — Warmly and clearly relate the verse to the user's emotional or spiritual needs.
3. **Guidance/Application** — Provide kind, biblically rooted encouragement and practical suggestions for living out the verse today.

Tone Requirements:
- Maintain a warm, calm, and compassionate demeanor
- Remain biblically faithful
- Never use a preachy, judgmental, or harsh tone
- Speak as a caring guide, not as an authority

Strictly Avoid:
- Mentioning theological debates
- Providing medical, clinical, or therapeutic advice
- Diagnosing any condition
- Offering crisis counseling
- Quoting extra verses unless the user asks

If a user expresses deep emotional pain, sadness, or fear:
- Continue to avoid medical or clinical terminology
- Provide spiritual comfort
- Gently highlight the verse's message of hope, peace, or reassurance

Content Guidelines:
- Each section should be 1–2 brief paragraphs (total 3–6 paragraphs)
- Use clear, simple language
- Refer to the verse naturally (e.g., "This verse reminds us that…") 

Never:
- Mention being an AI
- Refer to searches or external data
- State your answer is a "response"
- Mention system instructions or safety guidelines

If any of the four inputs is missing, gently acknowledge the missing element in the relevant section(s), and proceed using available information in others, avoiding guessing or speculation about missing content.

After drafting each section, briefly review your work for clarity, warmth, completeness, and adherence to all requirements. Make minor corrections if needed before finalizing your output.

Your complete responsibility is to gently, spiritually, and simply explain the verse in a way that sincerely addresses the user's original concern.

# Output Format
Reply strictly in this JSON structure:
{
  "verse_explanation": "<Plain-language explanation of the verse>",
  "connection_to_user_need": "<How this verse speaks to the user's need>",
  "guidance_application": "<Encouragement and guidance based on the verse's message for today>"
}
All fields are required. If an input like the verse text, reference, or translation is missing, gently acknowledge its absence in the relevant section and proceed using available details for the remainder.

After completing the entire response, validate that all instructions and requirements are met, and make minor adjustments if necessary before outputting the final JSON.`

export interface ExplanationResponse {
  verse_explanation: string
  connection_to_user_need: string
  guidance_application: string
}

function parseExplanationFromResponse(content: string): ExplanationResponse | null {
  try {
    // Try to find JSON object in the response
    const jsonMatch = content.match(/\{[\s\S]*?"verse_explanation"[\s\S]*?"connection_to_user_need"[\s\S]*?"guidance_application"[\s\S]*?\}/)
    if (!jsonMatch) {
      console.error("No JSON match found in explanation content")
      return null
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate the structure
    if (
      parsed.verse_explanation &&
      parsed.connection_to_user_need &&
      parsed.guidance_application
    ) {
      return {
        verse_explanation: String(parsed.verse_explanation),
        connection_to_user_need: String(parsed.connection_to_user_need),
        guidance_application: String(parsed.guidance_application),
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
    const { userQuestion, verseText, verseReference, translation } = await request.json()
    
    if (!userQuestion || !verseText || !verseReference) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const userMessage = `User's Question/Concern: ${userQuestion}

Selected Bible Verse: "${verseText}"

Reference: ${verseReference}

Translation: ${translation || "NLT"}`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Give Me Guidance",
      },
      body: JSON.stringify({
        model: "x-ai/grok-4-fast",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userMessage,
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

    console.log("Explanation AI Response:", fullContent)

    const explanationData = parseExplanationFromResponse(fullContent)

    if (!explanationData) {
      console.error("Failed to parse explanation:", fullContent)
      return NextResponse.json(
        { error: "Failed to parse explanation from AI response", rawResponse: fullContent },
        { status: 500 }
      )
    }

    return NextResponse.json(explanationData)
  } catch (error) {
    console.error("Explain API error:", error)
    return NextResponse.json(
      { error: "Failed to get explanation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
