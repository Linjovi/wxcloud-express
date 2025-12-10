import { 
  getWeiboHotSearch, 
  getDouyinHotSearch, 
  getXiaohongshuHotSearch,
  safeParseJSON,
} from "../utils";
import { GoogleGenAI } from "@google/genai";

export async function onRequestGet(context: any) {
  try {
    const apiKey = context.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set");
    }

    // Parallel fetch
    const [weibo, douyin, xhs] = await Promise.all([
      getWeiboHotSearch(),
      getDouyinHotSearch(),
      getXiaohongshuHotSearch()
    ]);

    const topTitles = {
      weibo: weibo.slice(0, 10).map(i => i.title),
      douyin: douyin.slice(0, 10).map(i => i.title),
      xiaohongshu: xhs.slice(0, 10).map(i => i.title),
    };

    const systemInstruction = `
Role: You are "Gossip Cat" (吃瓜喵), a cute, trendy, and slightly sassy cat who loves internet gossip.

Task:
1. **Scan**: Look at the provided hot search titles from Weibo, Douyin, and Xiaohongshu.
2. **Select**: Pick the **single most interesting, dramatic, or funny topic** (e.g., celebrity gossip, weird news, social trends). Prioritize "eating melon" (gossip) value over political/serious news unless it's huge.
3. **Research**: **You MUST use Google Search** to find the latest, juicy details about this specific topic. Do not just rely on the title. Find out the context!
4. **Summarize**:
   - **If a good topic is found**: Write a witty, "cat-style" summary (max 200 chars) focusing on this specific event. Tell the user what happened in a fun way. Use cat puns (喵, 捏, 爪) and emojis.
   - **If nothing is interesting**: Just say something like "喵... 今天好像没有什么特别的大瓜，本喵要去晒太阳了" (Meow... nothing big today, I'm going to sunbathe).
5. **Output**: Return a strictly valid JSON object. Do not output markdown code blocks.

Input Data (Top 10 Hot Searches from 3 Platforms):
Weibo: ${JSON.stringify(topTitles.weibo)}
Douyin: ${JSON.stringify(topTitles.douyin)}
Xiaohongshu: ${JSON.stringify(topTitles.xiaohongshu)}

Required JSON Format:
{
  "summary": "string (The witty summary)",
  "mood": "string (e.g., 'Eating Melon', 'Shocked', 'Funny')",
  "moodScore": number (0-100),
  "keywords": [
    { "name": "string", "weight": number (1-10) }
  ]
}
`;

    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: "Start analyzing the gossip and search for details meow!",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        tools: [{ googleSearch: {} }], // Enable Google Search Grounding
      },
    });

    const content = response.text;
    if (!content) {
      throw new Error("Gossip Cat is napping and didn't respond.");
    }

    const result = safeParseJSON(content);

    if (!result) {
        console.error("Failed to parse JSON content:", content);
        // Fallback
        return new Response(JSON.stringify({
          code: 0,
          message: "Success (Fallback)",
          data: { summary: "喵？今天好像没有什么特别的大瓜捏。", mood: "平静", moodScore: 50, keywords: [] }
        }), {
          headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({
      code: 0,
      message: "Success",
      data: result
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e: any) {
    console.error("Hot Search Summary Error:", e);
    return new Response(JSON.stringify({ code: 500, message: e.message || "吃瓜喵接口出错" }), { status: 500 });
  }
}
