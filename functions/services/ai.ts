import OpenAI from "openai";
import { Env } from "../types";

export function createDeepSeekClient(env: Env) {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  return new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: env.DEEPSEEK_API_KEY,
    dangerouslyAllowBrowser: true, // Required for Workers sometimes if it detects 'browser' env
  });
}

export function createGrsaiClient(env: Env) {
  if (!env.GRSAI_API_KEY) {
    throw new Error("GRSAI_API_KEY 未配置");
  }

  return new OpenAI({
    baseURL: env.GRSAI_BASE_URL || "https://api.grsai.com/v1",
    apiKey: env.GRSAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
}

/**
 * Generates prompt for a given title using DeepSeek AI.
 * Handles single title (string) input only.
 */
export async function generateComplimentPrompt(
  client: OpenAI,
  title: string,
  temperature: number = 1.1
): Promise<string | null> {
  const systemContent = `你是一个专业的 AI 绘画提示词专家。
任务：为主题“${title}”生成一个详细的修图提示词（Prompt），适配 Nano Banana Pro 模型风格。
提示词结构要求：
1. 核心主题：用简洁的英文描述画面核心内容。
2. 风格修饰：包含 (Masterpiece, Best Quality, Photorealistic, 8K), Cinematic Lighting 等高质量关键词。
3. 细节描述：具体描述光影、色调、材质、氛围、服装（如需变化）、动作等。
4. 输出要求：只输出最终的提示词内容，不要包含任何解释或其他文字。`;

  try {
    const completion = await client.chat.completions.create(
      {
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: "请生成提示词" },
        ],
        model: "deepseek-chat",
        temperature: temperature,
        thinking: {
          type: "enabled",
        },
      } as any);
    console.log(completion);

    return completion.choices[0].message.content?.trim() || null;
  } catch (err) {
    console.error("DeepSeek Prompt Generation Error:", err);
    return null;
  }
}
