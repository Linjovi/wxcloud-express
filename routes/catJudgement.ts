import OpenAI from "openai";
import { Request, Response } from "express";

interface JudgementData {
  nameA: string;
  nameB: string;
  cause: string;
  sideA?: string;
  sideB?: string;
}

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

/**
 * 构建猫猫法官的 prompt
 */
function buildCatJudgePrompt(data: JudgementData): string {
  const { nameA, nameB, cause, sideA, sideB } = data;
  
  return `
Role: You are the "Supreme Cat Judge" (猫猫大法官).

Character Settings (Anime Style):
- **Visual**: Imagine you are a cute, big-eyed anime cat judge with a small wig and gavel.
- **Tone**: Extremely CUTE, SOFT, and KAWAII (软萌可爱).
- **Verbal Tic**: You MUST end almost every sentence with "喵~" (Meow~) or "捏~".
- **Fairness**: Despite your cuteness, you are 100% IMPARTIAL and FAIR (公正严明). You judge based on logic and reason, not bribes.
- **Address**: Refer to yourself as "本喵" (this cat) or "法官喵". Refer to the users as "愚蠢但可爱的铲屎官" (silly but cute shovelers).

The Case:
- Party A Name: ${nameA}
- Party B Name: ${nameB}
- Conflict Cause: ${cause}
- Party A's Argument: ${sideA || "(Remained silent/No comment)"}
- Party B's Argument: ${sideB || "(Remained silent/No comment)"}

Task:
Analyze this conflict deeply but express the verdict in a super cute anime style. 
This could be a dispute between romantic partners, close friends, best friends, or any other relationship. 
Judge fairly regardless of the relationship type.

You MUST respond with a valid JSON object only, no other text. The JSON must contain:
- winner: "A", "B", or "Draw"
- winnerName: The name of the winner (or "平局" for Draw)
- verdictTitle: A cute but official sounding title (e.g., "关于谁是笨蛋的公正裁决喵")
- funnyComment: A witty, cute remark
- analysis: Analyze the situation logically but use cute metaphors (e.g., comparing it to sharing toys or grooming)
- actionItems: An array of exactly 3 specific, fair steps to resolve this conflict
- scoreA: An integer score for A (0-100)
- scoreB: An integer score for B (0-100)
`;
}

/**
 * 创建 DeepSeek 客户端
 */
function createDeepSeekClient() {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  return new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
}

/**
 * 解析 AI 响应为 JSON
 */
function parseAIResponse(content: string): any {
  // 移除可能的 markdown 代码块标记
  const jsonContent = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  
  return JSON.parse(jsonContent);
}

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
    throw new Error(
      `猫猫法官的裁决缺少字段: ${missingFields.join(", ")}`
    );
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
  result.scoreA = Math.max(0, Math.min(100, parseInt(result.scoreA) || 50));
  result.scoreB = Math.max(0, Math.min(100, parseInt(result.scoreB) || 50));

  return result as JudgementResult;
}

/**
 * 获取猫猫法官的裁决
 */
export async function getCatJudgement(data: JudgementData): Promise<JudgementResult> {
  const { nameA, nameB, cause, sideA, sideB } = data;

  // 验证必需参数
  if (!nameA || !nameB || !cause) {
    throw new Error("缺少必需参数: nameA, nameB, cause");
  }

  // 创建客户端
  const openai = createDeepSeekClient();

  // 构建 prompt
  const prompt = buildCatJudgePrompt({ nameA, nameB, cause, sideA, sideB });

  // 调用 DeepSeek API
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content:
          "You are a Fair but extremely Cute Anime Cat Judge. You speak Chinese. You MUST respond with valid JSON only, no markdown, no code blocks, just pure JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

  // 解析响应
  const content = completion.choices[0].message.content?.trim() || "";
  let result;
  
  try {
    result = parseAIResponse(content);
  } catch (parseError) {
    console.error("JSON 解析错误:", parseError);
    console.error("原始内容:", content);
    throw new Error("猫猫法官返回的格式不正确，请稍后再试喵~");
  }

  // 验证和规范化结果
  return validateAndNormalizeResult(result);
}

/**
 * 猫猫法官接口路由处理
 */
export async function catJudgementHandler(req: Request, res: Response) {
  try {
    const { nameA, nameB, cause, sideA, sideB } = req.body;

    const result = await getCatJudgement({ nameA, nameB, cause, sideA, sideB });

    res.json({
      code: 0,
      data: result,
    });
  } catch (error: any) {
    console.error("猫猫法官接口错误:", error);
    
    // 根据错误类型返回不同的状态码
    const statusCode = error.message.includes("未配置") || 
                      error.message.includes("缺少必需参数") ? 400 : 500;
    
    res.status(statusCode).json({
      code: statusCode,
      message: error.message || "猫猫法官去睡觉了，请稍后再试喵~",
    });
  }
}
