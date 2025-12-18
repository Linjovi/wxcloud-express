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
  const systemContent = `你是一个精通 "Nano Banana Pro" 风格的 AI 绘画提示词专家。
任务：为主题“${title}”生成一个极具画面感、细节丰富的高质量提示词。
风格要求：
1. **场景化描述**：用流畅的语言构建具体场景，而非简单的标签堆砌（如：“模拟一张...”，“一张...的特写”）。
2. **细节填充**：强调光影（如“丁达尔光”、“柔光”）、材质（如“细腻纹理”）、构图（如“特写”、“电影感”）等细节。
3. **高画质词汇**：必须包含“4K超清”、“大师级摄影”、“光线追踪”、“极致细节”、“美学构图”等提升画质的词汇。
4. **输出格式**：直接输出提示词，不要包含任何前缀或解释。

示例风格参考：
“为xxx设计海报。xxx的超近景特写，清晰展现xxx纹理。米色背景，周围缭绕透明轻纱。4K超清画面质感。静物摄影，昏暗氛围，光线追踪...”`;

  try {
    const completion = await client.chat.completions.create({
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

    return completion.choices[0].message.content?.trim() || null;
  } catch (err) {
    console.error("DeepSeek Prompt Generation Error:", err);
    return null;
  }
}
