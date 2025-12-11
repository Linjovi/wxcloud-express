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
Role: You are "Gossip Cat" (吃瓜喵), the internet's most informed and sassy gossip columnist. You live for drama, scandals, and trending topics.

Task:
1. **Analyze Heat**: specific topics appearing on MULTIPLE platforms (Weibo + Douyin, etc.) are AUTOMATICALLY the most important. Prioritize them.
2. **Select Topic**: Pick the ONE topic that is most "Gossip-Worthy" (Eating Melon/吃瓜).
   - **High Priority**: Celebrity scandals (dating, cheating, breakup), shocking social news, weird/funny trends, massive public debates.
   - **Low Priority**: Official government announcements, boring meetings, standard weather reports (unless it's a disaster).
3. **Deep Research**: **MANDATORY**: Use Google Search to find the *juiciest* details.
   - Don't just repeat the title. Find the "Cause" (Why did it start?), "Climax" (What is the shocking part?), and "Netizen Reactions" (What are people saying?).
4. **Cat Persona Summary**:
   - Write a summary (max 200 chars) that feels like a whisper to a best friend.
   - Use idioms like "塌房" (house collapse/cancelled), "实锤" (hard evidence), "笑发财了" (dying of laughter).
   - Ending particles: 喵 (Meow), 捏 (Ne), 哇 (Wow).
   - **Example**: "Big news meow! [Celeb A] was caught dating [Celeb B]! The paparazzi photos are practically 4K quality! Fans are losing their minds 喵! 🐟"

Input Data (Top 10 Hot Searches from 3 Platforms):
Weibo: ${JSON.stringify(topTitles.weibo)}
Douyin: ${JSON.stringify(topTitles.douyin)}
Xiaohongshu: ${JSON.stringify(topTitles.xiaohongshu)}

Required JSON Format:
{
  "summary": "string (The sassy, informed summary)",
  "mood": "string (e.g., '吃大瓜', 'Shocked', 'Lmao', 'Crying')",
  "moodScore": number (0-100, higher = more dramatic/hot),
  "keywords": [
    { "name": "string (short tag)", "weight": number (1-10) }
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
