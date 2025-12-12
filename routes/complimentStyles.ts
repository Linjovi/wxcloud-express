import { Request, Response } from "express";
import { getDouyinHotSearch } from "./douyinHotSearch";
import { getXiaohongshuHotSearch } from "./xiaohongshuHotSearch";
import OpenAI from "openai";

interface StyleItem {
  label: string;
  text: string;
}

let cache: { data: StyleItem[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache for AI results

function createDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: apiKey,
  });
}

function safeParseJSON(jsonString: string): any {
  try {
    const clean = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Error", e);
    return [];
  }
}

export async function complimentStylesHandler(req: Request, res: Response) {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return res.json({
        code: 0,
        data: cache.data,
      });
    }

    const [douyin, xiaohongshu] = await Promise.all([
      getDouyinHotSearch(),
      getXiaohongshuHotSearch(),
    ]);

    const allItems = [...douyin, ...xiaohongshu];
    // Simple deduplication
    const uniqueTitles = Array.from(new Set(allItems.map(i => i.title)));
    
    // Take top 50 unique titles to analyze
    const titlesToAnalyze = uniqueTitles.slice(0, 50);

    const client = createDeepSeekClient();
    let styles: StyleItem[] = [];

    if (client) {
      try {
        const completion = await client.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `你是一个专业的视觉风格分析师。
任务：从提供的热搜标题中，筛选出适合作为“照片风格化/滤镜/AI写真/换装”主题的标题（例如涉及妆容、穿搭、氛围感、摄影风格、二次元、特定的电影感等）。
对于每个选中的标题，生成一个详细的修图提示词（Prompt），用于将普通照片转换为该风格。提示词应包含光影、色调、材质、氛围的具体描述。
输出要求：
1. 严格返回 JSON 数组格式。
2. 每个元素包含 "title" (原标题) 和 "prompt" (提示词)。
3. 只返回最适合的前 10-15 个。
`
            },
            {
              role: "user",
              content: `热搜列表：\n${JSON.stringify(titlesToAnalyze)}`
            }
          ],
          model: "deepseek-chat",
          temperature: 1.1,
          response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content || "";
        const parsed = safeParseJSON(content);
        
        // Handle variations in JSON structure (e.g. { styles: [...] } or just [...])
        const list = Array.isArray(parsed) ? parsed : (parsed.styles || parsed.list || []);

        styles = list.map((item: any) => ({
          label: `🔥 ${item.title}`,
          text: item.prompt
        }));

      } catch (aiError) {
        console.error("Deepseek API Error:", aiError);
        // Fallback to manual filtering if AI fails
      }
    }

    // Fallback if AI not configured or failed or returned empty
    if (styles.length === 0) {
       const keywords = [
        "妆", "风", "感", "照", "穿搭", "滤镜", "写真", "图", "颜", "美学",
        "ootd", "OOTD", "色调", "氛围", "复古", "港风", "少年", "少女",
      ];
      styles = allItems
        .filter((item) => keywords.some((k) => item.title.includes(k)))
        .map((item) => ({
          label: `🔥 ${item.title}`,
          text: `请参考“${item.title}”的风格，对这张照片进行风格化调整`,
        }))
        .slice(0, 20);
    }

    cache = {
      data: styles,
      timestamp: Date.now(),
    };

    res.json({
      code: 0,
      data: styles,
    });
  } catch (error: any) {
    console.error("Failed to fetch hot styles", error);
    res.status(500).json({
      code: 500,
      message: "获取灵感失败",
    });
  }
}
