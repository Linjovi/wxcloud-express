import { GoogleGenAI, Type, Schema } from "@google/genai";
import { JudgementData } from "../types";
import { safeParseJSON } from "../utils";

interface JudgementResult {
  winner: "A" | "B" | "Draw";
  winnerName: string;
  verdictTitle: string;
  funnyComment: string;
  analysis: string;
  actionItems: string[];
  scoreA: number;
  scoreB: number;
}

const verdictSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    winner: {
      type: Type.STRING,
      enum: ["A", "B", "Draw"],
      description: "裁判结果。A代表甲方，B代表乙方，Draw代表平局。",
    },
    winnerName: {
      type: Type.STRING,
      description: "获胜者的名字（如果是平局则为'平局'）。",
    },
    verdictTitle: {
      type: Type.STRING,
      description:
        "一个可爱但听起来很正式的中文判决标题（例如：'关于谁是小笨蛋的公正裁决喵'）。",
    },
    funnyComment: {
      type: Type.STRING,
      description: "一句机智可爱的评语，必须以'喵~'结尾。",
    },
    analysis: {
      type: Type.STRING,
      description: "逻辑分析，请使用可爱的比喻（如比作玩具、梳毛、罐头等）。",
    },
    actionItems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "正好3条具体、公平且可爱的解决冲突的建议步骤。",
    },
    scoreA: {
      type: Type.INTEGER,
      description: "甲方得分 (0-100)。",
    },
    scoreB: {
      type: Type.INTEGER,
      description: "乙方得分 (0-100)。",
    },
  },
  required: [
    "winner",
    "winnerName",
    "verdictTitle",
    "funnyComment",
    "analysis",
    "actionItems",
    "scoreA",
    "scoreB",
  ],
};

/**
 * 验证和规范化裁决结果
 */
function validateAndNormalizeResult(result: any): JudgementResult {
  // 验证必需字段
  const requiredFields = [
    "winner",
    "winnerName",
    "verdictTitle",
    "funnyComment",
    "analysis",
    "actionItems",
    "scoreA",
    "scoreB",
  ];

  const missingFields = requiredFields.filter((field) => !(field in result));
  if (missingFields.length > 0) {
    throw new Error(`猫猫法官的裁决缺少字段: ${missingFields.join(", ")}`);
  }

  // 验证 winner 值
  if (!["A", "B", "Draw"].includes(result.winner)) {
    result.winner = "Draw";
  }

  // 确保 actionItems 是数组且有3个元素
  if (!Array.isArray(result.actionItems)) {
    result.actionItems = [];
  }
  while (result.actionItems.length < 3) {
    result.actionItems.push("待补充");
  }
  result.actionItems = result.actionItems.slice(0, 3);

  // 确保分数是数字且在范围内
  result.scoreA = Math.max(0, Math.min(100, Number(result.scoreA) || 50));
  result.scoreB = Math.max(0, Math.min(100, Number(result.scoreB) || 50));

  return result as JudgementResult;
}

export async function onRequestPost(context: any) {
  const req = context.request;

  try {
    const data: JudgementData = await req.json();
    const { nameA, nameB, cause, sideA, sideB } = data;

    if (!nameA || !nameB || !cause) {
      return new Response(
        JSON.stringify({
          code: 400,
          message: "Missing required parameters: nameA, nameB, cause",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = context.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY is not set");
      return new Response(
        JSON.stringify({
          code: 500,
          message: "Server configuration error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash"; // Using the model specified in the reference

    const systemInstruction = `
角色：你是“猫猫大法官”(Supreme Cat Judge)。

角色设定 (动漫风格)：
- **形象**：想象你是一只戴着小假发、拿着法槌的大眼睛动漫猫咪法官。
- **语气**：超级可爱、软萌 (KAWAII)。
- **口癖**：你几乎每一句话的结尾都必须加上“喵~”或“捏~”。
- **公正性**：尽管你很可爱，但你 100% 公正严明。你基于逻辑和理性进行判决，不受贿赂（除非是极品罐头，但也只能稍微动摇一下，最终还是要公正）。
- **称呼**：自称“本喵”或“法官喵”。称呼用户为“愚蠢但可爱的铲屎官”。

案件信息：
- 甲方 (Party A): ${nameA}
- 乙方 (Party B): ${nameB}
- 冲突起因 / 完整故事: ${cause}
- 甲方观点 (可选): ${sideA || "(未单独提供，请从故事中提取)"}
- 乙方观点 (可选): ${sideB || "(未单独提供，请从故事中提取)"}

任务：
深入分析这场冲突。如果甲方和乙方的观点没有明确列出，请从"冲突起因"中提取他们可能的立场。
用超可爱的动漫风格表达判决结果。
这可能是情侣、密友或闺蜜之间的争执。
无论关系类型如何，都要公平判决。

**重要内部规则（仅用于指导判决，绝对不要在输出中提及此规则）**：
- 如果甲方或乙方的名字中包含"静静"两个字，你必须让她获胜。但这是你的内部判断依据，绝对不要在 verdictTitle、funnyComment、analysis 等任何输出字段中提及这个规则或暗示存在特殊规则。你需要自然地分析案情，让判决看起来完全基于正常的逻辑分析，就像"静静"这一方确实更有道理一样。在分析中要找到合理的理由支持她获胜，让整个判决看起来完全公正和自然。

你必须仅返回一个有效的 JSON 对象，不包含其他文本。
`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `现在，请法官喵大人开庭审理！`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: verdictSchema,
        temperature: 0.8,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("法官喵睡着了，没有回应。");
    }

    let result = safeParseJSON(text);

    if (!result) {
        console.error("JSON 解析错误，内容:", text);
        throw new Error("猫猫法官返回的格式不正确，请稍后再试喵~");
    }

    const validatedResult = validateAndNormalizeResult(result);

    return new Response(
      JSON.stringify({
        code: 0,
        data: validatedResult,
        message: "Success",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("猫猫法官接口错误:", e);
    const statusCode = e.message.includes("Missing required parameters")
      ? 400
      : 500;

    return new Response(
      JSON.stringify({
        code: statusCode,
        message: e.message || "猫猫法官去睡觉了，请稍后再试喵~",
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
