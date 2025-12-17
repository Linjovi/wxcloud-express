import { ComplimentStyle } from "../types";
import { CACHE, CACHE_DURATION } from "../cache";

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

export function setComplimentStylesCache(styles: ComplimentStyle[]) {
  console.log("Setting compliment styles cache:", styles);
  CACHE.complimentStyles = {
    data: styles,
    timestamp: Date.now(),
  };
}

export function updateComplimentStylesCache(style: ComplimentStyle) {
  console.log("Updating compliment styles cache:", style);
  if (CACHE.complimentStyles) {
    const index = CACHE.complimentStyles.data.findIndex(
      (s) => s.title === style.title
    );
    if (index !== -1) {
      CACHE.complimentStyles.data[index] = style;
    } else {
      CACHE.complimentStyles.data.push(style);
    }
  } else {
    CACHE.complimentStyles = {
      data: [style],
      timestamp: Date.now(),
    };
  }
}

export function getComplimentStylesCache() {
  if (
    CACHE.complimentStyles &&
    Date.now() - CACHE.complimentStyles.timestamp < CACHE_DURATION
  ) {
    return CACHE.complimentStyles.data;
  }
  return null;
}

export function getComplimentStylePrompt(title: string): string | null {
  // Check default styles first
  if (DEFAULT_STYLES[title]) {
    return DEFAULT_STYLES[title];
  }

  // Check if cache exists and not expired (though logic for reading expired might be acceptable if strict consistency isn't needed)
  if (CACHE.complimentStyles) {
    const style = CACHE.complimentStyles.data.find(
      (s) =>
        s.title === title ||
        `🔥 ${s.title}` === title ||
        s.title === title.replace(/^🔥\s*/, "")
    );
    return style ? style.prompt : null;
  }
  return null;
}
