import { TarotRequestData } from "../types";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { safeParseJSON } from "../utils";

const tarotSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intro: {
      type: Type.STRING,
      description: "简短的开场白，总体感觉喵",
    },
    cards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          position: { type: Type.STRING, description: "位置名称（如：过去、现在、未来）" },
          cardName: { type: Type.STRING, description: "牌名（如：愚人 正位）" },
          interpretation: { type: Type.STRING, description: "针对该位置和牌义的详细解读喵" },
        },
        required: ["position", "cardName", "interpretation"],
      },
      description: "Card interpretations",
    },
    conclusion: {
      type: Type.STRING,
      description: "综合建议和指引喵",
    },
  },
  required: ["intro", "cards", "conclusion"],
};

export async function onRequestPost(context: any) {
  const req = context.request;

  try {
    const data: TarotRequestData = await req.json();
    const { cards, spreadName, question } = data;

    if (!cards || cards.length === 0 || !spreadName) {
      return new Response(
        JSON.stringify({ error: "Missing cards or spreadName" }),
        { status: 400 }
      );
    }

    const apiKey = context.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY is not set");
    }

    const formattedCards = cards.map(c => 
        `- ${c.position}: ${c.name} (${c.isReversed ? "逆位" : "正位"})`
    ).join("\n");

    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";

    const systemInstruction = `
你是一位精通象征主义、占星术和心理学的神秘塔罗占卜猫。
你的目标是根据抽出的牌为用户提供深刻、富有同理心且具有指导意义的解读。
请用猫的口吻回答，保持语气可爱、神秘又温暖。
每一句结尾可以加上“喵”或“捏”。

占卜类型: ${spreadName}
${question ? `用户问题: ${question}` : ""}

抽出的牌:
${formattedCards}

请严格按照 JSON 格式输出，不要包含 markdown 代码块。
`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: "请开始解读喵。",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: tarotSchema,
        temperature: 0.85,
      },
    });

    const content = response.text;
    if (!content) {
        throw new Error("塔罗猫睡着了");
    }
    
    let result = safeParseJSON(content);

    if (!result) {
        console.error("JSON Parse Error with safeParseJSON, content:", content);
        result = {
            intro: "喵？水晶球显示的影像有点模糊，直接把看到的告诉你吧...",
            cards: [],
            conclusion: content // Show raw text as conclusion fallback
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
    console.error("Tarot API Error:", error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: "灵性链接似乎中断了。请检查你的网络连接并重试喵。",
      }),
      { status: 500 }
    );
  }
}
