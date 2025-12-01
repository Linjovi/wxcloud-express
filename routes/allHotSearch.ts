import OpenAI from "openai";
import { Request, Response } from "express";
import { getWeiboHotSearch } from "./weiboHotSearch";
import { getDouyinHotSearch } from "./douyinHotSearch";

/**
 * 创建 DeepSeek 客户端
 */
function createDeepSeekClient() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn("DEEPSEEK_API_KEY 未配置，AI 总结功能将不可用");
    return null;
  }

  return new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
}

/**
 * 生成热搜总结
 */
async function getHotSearchSummary(
  weiboList: any[],
  douyinList: any[]
): Promise<string> {
  const client = createDeepSeekClient();
  if (!client) return "";

  // 提取前10条热搜用于总结
  const weiboTop = weiboList
    .slice(0, 15)
    .map((item, i) => `${i + 1}. ${item.title}`)
    .join("\n");
  const douyinTop = douyinList
    .slice(0, 15)
    .map((item, i) => `${i + 1}. ${item.title}`)
    .join("\n");

  const prompt = `
Role: You are "Gossip Cat" (吃瓜喵), a cute cat who loves internet gossip and trending news.

Task:
Read the top trending topics from Weibo and Douyin below.
Summarize the most interesting, discussed, or overlapping events.
Your summary should be fun, slightly gossipy, and very cute.
Use emojis appropriately.

Tone & Style:
- Casual, excited, and gossipy (like sharing news with a friend).
- Use "喵" (meow) or "捏" (ne) at the end of sentences.
- Keep it concise (around 100-150 Chinese characters).
- Address the reader as "铲屎官" (Shoveler).

Data:
[Weibo Hot Search]
${weiboTop}

[Douyin Hot Search]
${douyinTop}

Output:
Return ONLY the summary text in Chinese. No JSON, no markdown formatting.
`;

  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a cute gossip cat bot.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("AI Summary generation failed:", error);
    return "";
  }
}

/**
 * 聚合热搜接口路由处理
 */
export async function allHotSearchHandler(req: Request, res: Response) {
  try {
    // 并行请求微博和抖音热搜
    const [weiboList, douyinList] = await Promise.all([
      getWeiboHotSearch().catch((err) => {
        console.error("获取微博热搜失败:", err);
        return [];
      }),
      getDouyinHotSearch().catch((err) => {
        console.error("获取抖音热搜失败:", err);
        return [];
      }),
    ]);

    // 生成 AI 总结
    // 注意：如果 AI 响应较慢，可能会增加接口延迟。
    // 实际生产中可能需要缓存 AI 结果，或者异步更新。
    // 这里为了演示简单，直接串行等待。
    let summary = "";
    try {
      if (weiboList.length > 0 || douyinList.length > 0) {
        summary = await getHotSearchSummary(weiboList, douyinList);
      }
    } catch (err) {
      console.error("获取 AI 总结失败:", err);
    }

    res.json({
      code: 0,
      message: "获取成功",
      data: {
        weibo: weiboList,
        douyin: douyinList,
        summary: summary,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("聚合热搜接口错误:", error);

    res.status(500).json({
      code: 500,
      message: error.message || "获取热搜失败，请稍后再试",
    });
  }
}
