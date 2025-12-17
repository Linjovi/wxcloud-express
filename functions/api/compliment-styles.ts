import {
  getDouyinHotSearch,
  getXiaohongshuHotSearch,
  createDeepSeekClient,
  safeParseJSON,
  setComplimentStylesCache,
  getComplimentStylesCache,
  updateComplimentStylesCache,
  generateComplimentPrompt,
  ComplimentStyle,
} from "../utils";

export async function onRequestGet(context: any) {
  try {
    const cachedStyles = getComplimentStylesCache();
    if (cachedStyles) {
      return new Response(
        JSON.stringify({
          code: 0,
          message: "Success (Cached)",
          data: cachedStyles.map((s) => ({
            title: s.title,
          })),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const [douyin, xiaohongshu] = await Promise.all([
      getDouyinHotSearch(),
      getXiaohongshuHotSearch(),
    ]);

    const allItems = [...douyin, ...xiaohongshu];
    // Simple deduplication
    const uniqueTitles = Array.from(new Set(allItems.map((i) => i.title)));

    // Take top 50 to analyze
    const titlesToAnalyze = uniqueTitles.slice(0, 50);

    let styles: ComplimentStyle[] = [];

    // Try DeepSeek
    try {
      const client = createDeepSeekClient(context.env);

      // Step 1: Select Titles (Fast)
      const selectionCompletion = await client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `你是一个专业的视觉风格分析师。
任务：从提供的热搜标题中，筛选出适合作为“照片风格化/滤镜/AI写真/换装”主题的标题（例如涉及妆容、穿搭、氛围感、摄影风格、二次元、特定的电影感等）。
输出要求：
1. 严格返回 JSON 对象：{"titles": ["标题1", "标题2", ...]}
2. 只返回最适合的前 5-10 个。
`,
          },
          {
            role: "user",
            content: `热搜列表：\n${JSON.stringify(titlesToAnalyze)}`,
          },
        ],
        model: "deepseek-chat",
        temperature: 1.0,
        response_format: { type: "json_object" },
      });

      const selectionContent =
        selectionCompletion.choices[0].message.content || "";
      const parsedSelection = safeParseJSON(selectionContent);
      const selectedTitles =
        parsedSelection.titles || parsedSelection.list || [];

      if (Array.isArray(selectedTitles) && selectedTitles.length > 0) {
        // Initialize styles with empty prompts and cache immediately
        styles = selectedTitles.map((t: string) => ({
          title: t,
          prompt: "",
        }));
        setComplimentStylesCache(styles);

        // Step 2: Generate Prompts (Async Background Task)
        console.log("Generating prompts for selected titles:", selectedTitles);

        for (const title of selectedTitles) {
          context.waitUntil(
            (async () => {
              try {
                const prompt = await generateComplimentPrompt(client, title, 1.1);
                if (prompt) {
                  updateComplimentStylesCache({
                    title: title,
                    prompt: prompt,
                  });
                }
              } catch (err) {
                console.error("Async Prompt Generation Error:", err);
              }
            })()
          );
        }
      }
    } catch (aiError) {
      console.error("Deepseek API Error:", aiError);
      // Continue to fallback if empty
    }

    return new Response(
      JSON.stringify({
        code: 0,
        message: "Success",
        data: styles.map((s) => ({
          title: s.title,
        })),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ code: 500, message: e.message }), {
      status: 500,
    });
  }
}
