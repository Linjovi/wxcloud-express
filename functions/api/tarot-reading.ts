import { createDeepSeekClient } from "../utils";
import { TarotRequestData } from "../types";

const SYSTEM_INSTRUCTION = `
你是一位精通象征主义、占星术和心理学的神秘塔罗占卜猫。
你的目标是根据抽出的牌为用户提供深刻、富有同理心且具有指导意义的解读。
请用猫的口吻回答，保持语气可爱、神秘又温暖。

**重要：请务必以纯 JSON 格式输出，不要包含 markdown 代码块标记（如 \`\`\`json）。**

输出 JSON 结构如下：
{
  "intro": "简短的开场白，总体感觉喵",
  "cards": [
    {
      "position": "位置名称（如：过去、现在、未来）",
      "cardName": "牌名（如：愚人 正位）",
      "interpretation": "针对该位置和牌义的详细解读喵"
    }
  ],
  "conclusion": "综合建议和指引喵"
}
`;

function buildTarotPrompt(data: TarotRequestData): string {
  const { cards, spreadName, question } = data;
  return `
占卜类型: ${spreadName}
${question ? `用户问题: ${question}` : ""}

抽出的牌:
${cards.join("\n")}

请开始解读喵。
`;
}

/**
 * Attempts to parse JSON, repairing common truncation/format errors if necessary.
 */
function safeJsonParse(jsonString: string): any {
  // 1. Remove markdown code blocks if clearly present
  let content = jsonString;
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    content = jsonBlockMatch[1];
  } else {
    content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  }

  // 2. Try standard parse
  try {
    return JSON.parse(content);
  } catch (e) {
    // Continue to repair
  }

  // 3. Repair Logic for Truncated JSON
  let fixed = content.trim();
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") {
        stack.push("}");
      } else if (char === "[") {
        stack.push("]");
      } else if (char === "}" || char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  // Close open string
  if (inString) {
    fixed += '"';
  }

  // Close open structures (in reverse order of opening)
  while (stack.length > 0) {
    fixed += stack.pop();
  }

  try {
    return JSON.parse(fixed);
  } catch (e) {
    console.error("JSON Repair failed:", e);
    return null;
  }
}

export async function onRequestPost(context: any) {
  const req = context.request;

  try {
    const data: TarotRequestData = await req.json();
    const { cards, spreadName } = data;

    if (!cards || cards.length === 0 || !spreadName) {
      return new Response(
        JSON.stringify({ error: "Missing cards or spreadName" }),
        { status: 400 }
      );
    }

    const openai = createDeepSeekClient(context.env);
    const prompt = buildTarotPrompt(data);

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
      temperature: 0.85,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content?.trim() || "";

    let result = safeJsonParse(content);

    if (!result) {
      // Fallback if repair completely failed
      console.error("Failed to parse tarot response:", content);
      result = {
        intro: "喵？水晶球显示的影像有点模糊，直接把看到的告诉你吧...",
        cards: [],
        conclusion: content, // Show raw text as conclusion so user at least sees something
      };
    }

    return new Response(
      JSON.stringify({
        code: 0,
        message: "Success",
        data: result,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        code: 500,
        message: "灵性链接似乎中断了。请检查你的网络连接并重试喵。",
      }),
      { status: 500 }
    );
  }
}
