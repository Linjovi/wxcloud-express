import {
  getDouyinHotSearch,
  getXiaohongshuHotSearch,
  createDeepSeekClient,
  safeParseJSON,
  setComplimentStylesCache,
  getComplimentStylesCache,
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
        context.waitUntil(
          (async () => {
            try {
              console.log(
                "Generating prompts for selected titles:",
                selectedTitles
              );
              const promptCompletion = await client.chat.completions.create({
                messages: [
                  {
                    role: "system",
                    content: `你是一个专业的 AI 绘画提示词专家。
任务：为以下主题生成详细的 Stable Diffusion/Midjourney 修图提示词（Prompt）。
提示词应包含光影、色调、材质、氛围、服装、动作等的具体描述。
输出要求：
1. 严格返回 JSON 数组，每个元素包含 "title" (原标题) 和 "prompt" (提示词)。
`,
                  },
                  {
                    role: "user",
                    content: `主题列表：\n${JSON.stringify(selectedTitles)}`,
                  },
                ],
                model: "deepseek-chat",
                temperature: 1.1,
                response_format: { type: "json_object" },
              });

              const promptContent =
                promptCompletion.choices[0].message.content || "";
              const parsedPrompts = JSON.parse(promptContent);
              console.log("Parsed prompts:", parsedPrompts);
              const list = Array.isArray(parsedPrompts)
                ? parsedPrompts
                : parsedPrompts.styles || parsedPrompts.list || [];
              console.log("Prompts generated:", list);
              if (Array.isArray(list) && list.length > 0) {
                // Update cache with prompts
                const updatedStyles = list.map((item: any) => ({
                  title: item.title,
                  prompt: item.prompt,
                }));
                setComplimentStylesCache(updatedStyles);
              }
            } catch (err) {
              console.error("Async Prompt Generation Error:", err);
            }
          })()
        );
      }
    } catch (aiError) {
      console.error("Deepseek API Error:", aiError);
      // Continue to fallback if empty
    }

    // Fallback if AI failed or returned nothing
    if (styles.length === 0) {
      const keywords = [
        "妆",
        "风",
        "感",
        "照",
        "穿搭",
        "滤镜",
        "写真",
        "图",
        "颜",
        "美学",
        "ootd",
        "OOTD",
        "色调",
        "氛围",
        "复古",
        "港风",
        "少年",
        "少女",
      ];
      styles = allItems
        .filter((item) => keywords.some((k) => item.title.includes(k)))
        .map((item) => ({
          title: item.title,
          prompt: `请参考“${item.title}”的风格，对这张照片进行风格化调整`,
        }))
        .slice(0, 20);

      setComplimentStylesCache(styles);
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
