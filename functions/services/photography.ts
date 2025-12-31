import { PhotographyStyle, Env } from "../types";
import { CACHE } from "../cache";
import {
  getDouyinHotSearch,
  getXiaohongshuHotSearch,
  createDeepSeekClient,
  safeParseJSON,
} from "../utils";

export const DEFAULT_STYLES: Record<string, string> = {
  清除路人:
    "专业后期修图，智能移除画面背景中的路人、杂物和干扰元素，智能填充背景，保持画面自然完整，构图干净整洁。",
  一键美化:
    "大师级人像精修，自然磨皮美白，亮眼提神，五官立体化，肤色均匀通透，调整光影质感，增强画面清晰度，杂志封面级修图。",
  动漫风格:
    "二次元动漫风格，日本动画电影质感，新海诚画风，唯美光影，细腻笔触，梦幻色彩，2D插画效果。",
  更换天气: "调整环境天气效果，模拟自然真实的气象氛围，将天气更改为：",
};

/**
 * Update logic: Fetch hot searches -> Summarize themes -> Generate prompts -> Save to D1 & Cache
 */
export async function refreshStyles(context: any) {
  try {
    console.log("Starting refreshStyles...");
    const [douyin, xiaohongshu] = await Promise.all([
      getDouyinHotSearch(),
      getXiaohongshuHotSearch(),
    ]);

    const allItems = [...douyin, ...xiaohongshu];
    const uniqueTitles = Array.from(new Set(allItems.map((i) => i.title)));
    const titlesToAnalyze = uniqueTitles.slice(0, 50);

    const client = createDeepSeekClient(context.env);

    // Step 1: Select Titles (Themes)
    const selectionCompletion = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `你是一个专业的AI视觉潮流分析师。
任务：分析热搜词，提炼出适合作为“AI写真”或“照片修图模板”的风格主题。
要求：
1. **风格化**：主题应具有明确的视觉风格（如：妆容风格、穿搭风格、滤镜氛围、摄影质感）。
2. **易于理解**：使用用户易懂的词汇（如：“清冷感财阀千金”、“美拉德风”、“赛博朋克”、“法式复古”）。
3. **关联热搜**：必须基于提供的热搜词进行归纳。
4. **格式**：严格返回 JSON 对象：{"items": [{"title": "主题名称", "source": ["来源热搜词1"]}]}
5. **数量**：精选 6-10 个最热门且适合修图的主题。
`,
        },
        {
          role: "user",
          content: `热搜列表：\n${JSON.stringify(titlesToAnalyze)}`,
        },
      ],
      model: "deepseek-chat",
      temperature: 1.0,
      thinking: { type: "enabled" },
      response_format: { type: "json_object" },
    } as any);

    const selectionContent =
      selectionCompletion.choices[0].message.content || "";
    console.log("AI Selection Result:", selectionContent);
    const parsedSelection = safeParseJSON(selectionContent);
    const items = parsedSelection.items || [];
    const selectedTitles = Array.isArray(items)
      ? items
      : parsedSelection.titles || parsedSelection.list || [];

    if (Array.isArray(selectedTitles) && selectedTitles.length > 0) {
      // Initialize styles
      let styles: PhotographyStyle[] = selectedTitles.map((item: any) => {
        if (typeof item === "string") {
          return { title: item, prompt: "" };
        }
        return {
          title: item.title,
          prompt: "",
          source: item.source,
        };
      });

      // Step 2: Generate Editing Prompts
      console.log(
        "Generating editing prompts for:",
        styles.map((s) => s.title)
      );

      const promptPromises = styles.map(async (styleItem) => {
        try {
          const prompt = await generateEditingPrompt(client, styleItem.title);
          return { ...styleItem, prompt: prompt || "" };
        } catch (err) {
          console.error(`Prompt gen error for ${styleItem.title}:`, err);
          return styleItem;
        }
      });

      styles = await Promise.all(promptPromises);

      // Save to Storage (D1 + Memory)
      await savePhotographyStyles(context, styles);

      console.log("Refresh completed.");
      return styles;
    }
  } catch (error) {
    console.error("refreshStyles Error:", error);
    throw error;
  }
  return [];
}

/**
 * Specialized prompt generator for Photo Editing / Style Transfer
 */
async function generateEditingPrompt(
  client: any,
  title: string
): Promise<string | null> {
  const systemContent = `你是一个精通 AI 绘画与修图的提示词专家。
任务：为主题“${title}”编写一段适用于 **图生图 (img2img)** 或 **AI 写真** 的英文提示词 (Prompt)。
目标：将用户上传的照片转换为该主题风格，同时保留人物主要特征。

要求：
1. **画面描述**：包含光影（Lighting）、色彩（Color Palette）、氛围（Atmosphere）、材质（Texture）和摄影风格（Photography Style）。
2. **高质量词汇**：包含 "Masterpiece", "Best Quality", "High Resolution", "4k", "Detailed" 等。
3. **内容克制**：**不要**描述具体的人物动作或构图（因为是修图，要跟随原图），只描述风格元素。例如不要写 "A girl sitting"，而是写 "Cinematic lighting, vintage film grain, soft focus, pastel colors"。
4. **输出格式**：直接输出英文提示词，不要包含任何前缀、解释或中文。逗号分隔。

示例：
主题：复古港风
输出：Hong Kong cinema style, vintage film look, warm heavy tones, soft diffusion blur, nostalgic atmosphere, 90s fashion vibe, film grain, masterpiece, high quality, 4k.
`;

  try {
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: "Generate prompt." },
      ],
      model: "deepseek-chat",
      temperature: 1.1,
      thinking: { type: "enabled" },
    } as any);

    return completion.choices[0].message.content?.trim() || null;
  } catch (err) {
    console.error("Editing Prompt Generation Error:", err);
    return null;
  }
}

/**
 * Get styles from Memory -> D1 -> null
 */
export async function getStoredPhotographyStyles(context: {
  env: Env;
}): Promise<PhotographyStyle[] | null> {
  // 1. Try Memory Cache
  const memoryStyles = getPhotographyStylesCache();
  if (memoryStyles) {
    return memoryStyles;
  }

  // 2. Try D1 Storage
  if (context.env.DB) {
    try {
      // Find the latest batch_id
      const latestBatch = await context.env.DB.prepare(
        "SELECT batch_id FROM photography_styles ORDER BY created_at DESC LIMIT 1"
      ).first();

      if (latestBatch && latestBatch.batch_id) {
        // Fetch all styles for this batch
        const results = await context.env.DB.prepare(
          "SELECT title, source, prompt FROM photography_styles WHERE batch_id = ?"
        )
          .bind(latestBatch.batch_id)
          .all();

        if (results && results.results.length > 0) {
          const styles: PhotographyStyle[] = results.results.map(
            (row: any) => ({
              title: row.title,
              prompt: row.prompt,
              source: row.source ? JSON.parse(row.source) : [],
            })
          );

          // Update memory cache
          setPhotographyStylesCache(styles);
          return styles;
        }
      }
    } catch (e) {
      console.error("Failed to read from D1:", e);
    }
  }

  return null;
}

export async function savePhotographyStyles(
  context: { env: Env },
  styles: PhotographyStyle[]
) {
  // 1. Update Memory
  setPhotographyStylesCache(styles);

  // 2. Update D1
  if (context.env.DB) {
    const batchId = Date.now().toString();
    const stmts = styles.map((style) => {
      return context.env.DB.prepare(
        "INSERT INTO photography_styles (batch_id, title, source, prompt) VALUES (?, ?, ?, ?)"
      ).bind(
        batchId,
        style.title,
        JSON.stringify(style.source || []),
        style.prompt
      );
    });

    try {
      await context.env.DB.batch(stmts);
      console.log(
        `Saved ${styles.length} styles to D1 with batch_id ${batchId}`
      );
    } catch (e) {
      console.error("Failed to write batch to D1:", e);
    }
  }
}

// In-Memory Cache Helpers

export function setPhotographyStylesCache(styles: PhotographyStyle[]) {
  CACHE.photographyStyles = {
    data: styles,
    timestamp: Date.now(),
  };
}

export function updatePhotographyStylesCache(style: PhotographyStyle) {
  if (CACHE.photographyStyles) {
    const index = CACHE.photographyStyles.data.findIndex(
      (s) => s.title === style.title
    );
    if (index !== -1) {
      CACHE.photographyStyles.data[index] = style;
    } else {
      CACHE.photographyStyles.data.push(style);
    }
  } else {
    CACHE.photographyStyles = {
      data: [style],
      timestamp: Date.now(),
    };
  }
}

export function getPhotographyStylesCache() {
  if (CACHE.photographyStyles) {
    return CACHE.photographyStyles.data;
  }
  return null;
}

export function getPhotographyStylePrompt(title: string): string | null {
  if (DEFAULT_STYLES[title]) {
    return DEFAULT_STYLES[title];
  }
  if (CACHE.photographyStyles) {
    const style = CACHE.photographyStyles.data.find(
      (s) =>
        s.title === title ||
        `🔥 ${s.title}` === title ||
        s.title === title.replace(/^🔥\s*/, "")
    );
    return style ? style.prompt : null;
  }
  return null;
}
