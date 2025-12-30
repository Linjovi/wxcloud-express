import { PhotographyStyle } from "../types";
import { CACHE, CACHE_DURATION } from "../cache";
import {
  getDouyinHotSearch,
  getXiaohongshuHotSearch,
  createDeepSeekClient,
  safeParseJSON,
  generatePhotographyPrompt,
} from "../utils";

export const DEFAULT_STYLES: Record<string, string> = {
  清除路人:
    "专业后期修图，智能移除画面背景中的路人、杂物和干扰元素，智能填充背景，保持画面自然完整，构图干净整洁。",
  更换场景: "保持人物主体光影和透视关系不变，将背景环境智能替换为：",
  一键美化:
    "大师级人像精修，自然磨皮美白，亮眼提神，五官立体化，肤色均匀通透，调整光影质感，增强画面清晰度，杂志封面级修图。",
  动漫风格:
    "二次元动漫风格，日本动画电影质感，新海诚画风，唯美光影，细腻笔触，梦幻色彩，2D插画效果。",
  更换天气: "调整环境天气效果，模拟自然真实的气象氛围，将天气更改为：",
};

/**
 * 核心逻辑：获取热搜 -> 提取主题 -> 生成提示词 -> 更新缓存
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

    // Step 1: Select Titles
    const selectionCompletion = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `你是一个专业的视觉风格分析师。
任务：分析提供的热搜标题，提炼出适合作为“AI写真/修图/换装”的风格主题。
要求：
1. 不要直接返回热搜原标题，而是归纳总结成简短的主题名称（如：“清冷感财阀千金”、“赛博朋克风”、“法式复古胶片”等）。
2. 只选择与妆容、穿搭、氛围、摄影、二次元相关的内容。
3. 严格返回 JSON 对象：{"items": [{"title": "主题名称", "source": ["来源热搜词1", "来源热搜词2"]}]}
4. 返回 6-10 个最热门且适合的主题。
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
      // Initialize styles with empty prompts first
      const styles: PhotographyStyle[] = selectedTitles.map((item: any) => {
        if (typeof item === "string") {
          return { title: item, prompt: "" };
        }
        return {
          title: item.title,
          prompt: "",
          source: item.source,
        };
      });

      // Update Cache immediately with titles
      setPhotographyStylesCache(styles);

      // Step 2: Generate Prompts (Sequential or Parallel)
      console.log(
        "Generating prompts for:",
        styles.map((s) => s.title)
      );

      for (const styleItem of styles) {
        try {
          // Use title (which is the theme name) for prompt generation
          const prompt = await generatePhotographyPrompt(
            client,
            styleItem.title,
            1.1
          );
          if (prompt) {
            updatePhotographyStylesCache({
              title: styleItem.title,
              prompt: prompt,
            });
          }
        } catch (err) {
          console.error(`Prompt gen error for ${styleItem.title}:`, err);
        }
      }
      console.log("Refresh completed.");
    }
  } catch (error) {
    console.error("refreshStyles Error:", error);
  }
}

export function setPhotographyStylesCache(styles: PhotographyStyle[]) {
  console.log("Setting photography styles cache:", styles);
  CACHE.photographyStyles = {
    data: styles,
    timestamp: Date.now(),
  };
}

export function updatePhotographyStylesCache(style: PhotographyStyle) {
  console.log("Updating photography styles cache:", style);
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
    // Ignore CACHE_DURATION, return data until next update overwrite it
    return CACHE.photographyStyles.data;
  }
  return null;
}

export function getPhotographyStylePrompt(title: string): string | null {
  // Check default styles first
  if (DEFAULT_STYLES[title]) {
    return DEFAULT_STYLES[title];
  }

  // Check if cache exists and not expired (though logic for reading expired might be acceptable if strict consistency isn't needed)
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
