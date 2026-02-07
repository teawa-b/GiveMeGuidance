import { guidanceApi, explainApi } from "./api";

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

// Get Bible verse guidance via backend API
export async function getGuidance(query: string, recentVerses?: string[]): Promise<VerseData> {
  return guidanceApi(query, recentVerses);
}

// Get explanation for a verse via backend API
export async function getExplanation(
  userQuestion: string,
  verseText: string,
  verseReference: string,
  translation: string
): Promise<ExplanationData> {
  return explainApi({
    userQuestion,
    verseText,
    verseReference,
    translation,
  });
}
