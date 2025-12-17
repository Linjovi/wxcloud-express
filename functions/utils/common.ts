// --- JSON Repair Utility ---
export function safeParseJSON(jsonString: string): any {
  if (!jsonString) return null;

  // 1. Remove markdown code blocks
  let content = jsonString
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // 2. Try standard parse
  try {
    return JSON.parse(content);
  } catch (e) {
    // Continue to advanced repair if simple parse fails
  }

  // 3. Extract JSON object/array if embedded in other text
  const firstBrace = content.indexOf("{");
  const firstBracket = content.indexOf("[");

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = content.lastIndexOf("}") + 1;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = content.lastIndexOf("]") + 1;
  }

  if (start !== -1 && end !== -1) {
    content = content.substring(start, end);
    try {
      return JSON.parse(content);
    } catch (e) {
      // Continue to more aggressive repair
    }
  }

  // 4. Basic cleanup for common issues (trailing commas, etc - risky but helpful for simple cases)
  try {
    // Remove trailing commas before } or ]
    const cleaned = content.replace(/,\s*([\]}])/g, "$1");
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Repair failed:", e);
    return null;
  }
}

