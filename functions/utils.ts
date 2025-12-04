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
    referer: "https://app.xhs.cn/",
    "xy-direction": "22",
    shield:
      "XYAAAAAQAAAAEAAABTAAAAUzUWEe4xG1IYD9/c+qCLOlKGmTtFa+lG434Oe+FTRagxxoaz6rUWSZ3+juJYz8RZqct+oNMyZQxLEBaBEL+H3i0RhOBVGrauzVSARchIWFYwbwkV",
    "xy-platform-info":
      "platform=iOS&version=8.7&build=8070515&deviceId=C323D3A5-6A27-4CE6-AA0E-51C9D4C26A24&bundle=com.xingin.discover",
    "xy-common-params":
      "app_id=ECFAAF02&build=8070515&channel=AppStore&deviceId=C323D3A5-6A27-4CE6-AA0E-51C9D4C26A24&device_fingerprint=20230920120211bd7b71a80778509cf4211099ea911000010d2f20f6050264&device_fingerprint1=20230920120211bd7b71a80778509cf4211099ea911000010d2f20f6050264&device_model=phone&fid=1695182528-0-0-63b29d709954a1bb8c8733eb2fb58f29&gid=7dc4f3d168c355f1a886c54a898c6ef21fe7b9a847359afc77fc24ad&identifier_flag=0&lang=zh-Hans&launch_id=716882697&platform=iOS&project_id=ECFAAF&sid=session.1695189743787849952190&t=1695190591&teenager=0&tz=Asia/Shanghai&uis=light&version=8.7",
  };

  try {
    const response = await fetch(xhsApiUrl, {
      headers: xhsHeaders,
    });
    const data: any = await response.json();

    if (data && data.data && Array.isArray(data.data.items)) {
      return data.data.items.map((item: any, idx: number) => ({
        rank: idx + 1,
        title: item.title,
        link: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(
          item.title
        )}&type=51`,
        hot: item.score,
        iconType: mapIconType(item.word_type),
      }));
    }
    return [];
  } catch (error) {
    console.error("Xiaohongshu fetch error:", error);
    return [];
  }
}

function mapIconType(wordType: string): string | null {
  switch (wordType) {
    case "热":
      return "hot";
    case "新":
      return "new";
    case "无":
    default:
      return null;
  }
}

