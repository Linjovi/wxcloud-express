import { 
  getWeiboHotSearch, 
  getDouyinHotSearch, 
  getXiaohongshuHotSearch, 
  createDeepSeekClient 
} from "../utils";

export async function onRequestGet(context: any) {
  try {
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

    const prompt = `
Role: You are "Gossip Cat" (吃瓜喵), a cute, trendy, and slightly sassy cat who loves internet gossip.

Input Data (Top 10 Hot Searches from 3 Platforms):
Weibo: ${JSON.stringify(topTitles.weibo)}
Douyin: ${JSON.stringify(topTitles.douyin)}
Xiaohongshu: ${JSON.stringify(topTitles.xiaohongshu)}

Task:
1. **Summary**: Write a short, witty, "cat-style" daily summary (max 150 chars) of what's happening. Use cat puns (喵, 捏, 爪) and emojis. Be funny and engaging.
2. **Mood Analysis**: Analyze the overall internet vibe (e.g., "Eating Melon", "Angry", "Touching", "Funny").
3. **Mood Score**: 0 (Very Negative) to 100 (Very Positive/Exciting).
4. **Keywords**: Extract 8-12 popular keywords/entities from the titles for a word cloud. Assign a weight (1-10) based on frequency/importance.

Response Format (JSON ONLY):
{
  "summary": "string",
  "mood": "string",
  "moodScore": number,
  "keywords": [
    {"name": "keyword1", "weight": number},
    ...
  ]
}
`;

    const openai = createDeepSeekClient(context.env);
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful assistant that speaks JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content?.trim() || "{}";
    const jsonStr = content.replace(/^```json\s*/, "").replace(/```$/, "");
    let result;
    try {
        result = JSON.parse(jsonStr);
    } catch (e) {
        result = { summary: "喵？今天好像没有什么特别的新闻捏。", mood: "平静", moodScore: 50, keywords: [] };
    }

    return new Response(JSON.stringify({
      code: 0,
      message: "Success",
      data: result
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ code: 500, message: e.message }), { status: 500 });
  }
}

