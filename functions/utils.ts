import { HotSearchItem, DouyinHotSearchItem } from "./types";

// Helper to create OpenAI client (using fetch implementation for Workers)
// Note: We use the official openai library but it needs to be installed.
// If not, we can use a simple fetch wrapper. 
// For Cloudflare Pages, we can assume 'openai' is in package.json at root.
import OpenAI from "openai";

export function createDeepSeekClient(env: any) {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  return new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: env.DEEPSEEK_API_KEY,
    dangerouslyAllowBrowser: true // Required for Workers sometimes if it detects 'browser' env
  });
}

// --- Weibo Hot Search (Regex Version) ---
export async function getWeiboHotSearch(): Promise<HotSearchItem[]> {
  try {
    const response = await fetch("https://s.weibo.com/top/summary?cate=realtimehot", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        // Cookie might be needed for some requests, but usually public list is open
      }
    });
    const html = await response.text();

    const list: HotSearchItem[] = [];
    
    // Simple regex to find rows
    // Pattern: <td class="td-01 ...">RANK</td> ... <a href="HREF">TITLE</a> ... <span>HOT</span>
    
    // Split by <tr> to handle each row
    const rows = html.split("</tr>");
    
    rows.forEach(row => {
      if (!row.includes('class="td-02"')) return;

      let rank: string | number | null = null;
      let title = "";
      let link: string | null = null;
      let hot: string | null = null;
      let iconType: string | null = null;

      // Extract Rank
      const rankMatch = row.match(/<td class="td-01[^"]*">([^<]*)<\/td>/);
      if (rankMatch) {
        rank = rankMatch[1].trim();
        if (rank === "") rank = null; // Top stickied items sometimes have no rank or '置顶'
      }

      // Extract Title and Link
      const linkMatch = row.match(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
      if (linkMatch) {
        const href = linkMatch[1];
        title = linkMatch[2].trim();
        link = href.startsWith("http") ? href : `https://s.weibo.com${href}`;
      }

      // Extract Hot Value
      const hotMatch = row.match(/<span>(\d+)<\/span>/);
      if (hotMatch) {
        hot = hotMatch[1];
      }

      // Extract Icon (new, hot, boil)
      if (row.includes('icon-new')) iconType = "new";
      else if (row.includes('icon-hot')) iconType = "hot";
      else if (row.includes('icon-boil')) iconType = "boil";
      else if (row.includes('icon-fei')) iconType = "fei"; // flying/recommend

      if (title) {
         // Filter out the "search for more" row if present (usually doesn't match this strict pattern)
         list.push({ rank, title, link, hot, iconType });
      }
    });

    return list;
  } catch (e) {
    console.error("Weibo fetch error:", e);
    return [];
  }
}

// --- Douyin Hot Search ---
export async function getDouyinHotSearch(): Promise<DouyinHotSearchItem[]> {
  try {
    const response = await fetch(
      "https://aweme-lq.snssdk.com/aweme/v1/hot/search/list/?aid=1128&version_code=880",
      {
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
        }
      }
    );
    const data: any = await response.json();

    if (data && data.data && Array.isArray(data.data.word_list)) {
      return data.data.word_list.map((item: any, index: number) => ({
        rank: index + 1,
        title: item.word,
        hot: (item.hot_value / 10000).toFixed(1) + "万",
        link: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
        iconType: index < 3 ? "hot" : null, 
      }));
    }
    return [];
  } catch (error) {
    console.error("Douyin fetch error:", error);
    return [];
  }
}

// --- Xiaohongshu Hot Search ---
export async function getXiaohongshuHotSearch(): Promise<HotSearchItem[]> {
  const xhsApiUrl = "https://edith.xiaohongshu.com/api/sns/v1/search/hot_list";
  const xhsHeaders = {
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.7(0x18000733) NetType/WIFI Language/zh_CN",
    "Referer": "https://app.xhs.cn/",
  };

  try {
    const response = await fetch(xhsApiUrl, {
      headers: xhsHeaders
    });
    const data: any = await response.json();

    if (data && data.data && Array.isArray(data.data.items)) {
      return data.data.items.map((item: any, idx: number) => ({
        rank: idx + 1,
        title: item.title,
        link: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.title)}&type=51`,
        hot: item.score,
        iconType: item.word_type === "热" ? "hot" : item.word_type === "新" ? "new" : null,
      }));
    }
    return [];
  } catch (error) {
    console.error("Xiaohongshu fetch error:", error);
    return [];
  }
}

