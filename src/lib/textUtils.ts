/**
 * Capitalizes the first character of a string
 * @param text - The text to capitalize
 * @returns The text with the first character capitalized
 */
export function capitalizeFirstLetter(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}
