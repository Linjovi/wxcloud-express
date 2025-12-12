import { HotSearchItem, DouyinHotSearchItem, MaoyanHotItem, MaoyanWebHeatItem } from "./types";
import OpenAI from "openai";

// --- Cache Implementation ---
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface ComplimentStyle {
  title: string;
  prompt: string;
}

const DEFAULT_STYLES: Record<string, string> = {
  "清除路人": "专业后期修图，智能移除画面背景中的路人、杂物和干扰元素，智能填充背景，保持画面自然完整，构图干净整洁。",
  "更换场景": "保持人物主体光影和透视关系不变，将背景环境智能替换为：",
  "一键美化": "大师级人像精修，自然磨皮美白，亮眼提神，五官立体化，肤色均匀通透，调整光影质感，增强画面清晰度，杂志封面级修图。",
  "动漫风格": "二次元动漫风格，日本动画电影质感，新海诚画风，唯美光影，细腻笔触，梦幻色彩，2D插画效果。",
  "更换天气": "调整环境天气效果，模拟自然真实的气象氛围，将天气更改为："
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

const CACHE: {
  weibo: CacheEntry<HotSearchItem[]> | null;
  douyin: CacheEntry<DouyinHotSearchItem[]> | null;
  xiaohongshu: CacheEntry<HotSearchItem[]> | null;
  maoyanWeb: CacheEntry<MaoyanWebHeatItem[]> | null;
  complimentStyles: CacheEntry<ComplimentStyle[]> | null;
} = {
  weibo: null,
  douyin: null,
  xiaohongshu: null,
  maoyanWeb: null,
  complimentStyles: null,
};

// ...

export function setComplimentStylesCache(styles: ComplimentStyle[]) {
  CACHE.complimentStyles = {
    data: styles,
    timestamp: Date.now()
  };
}

export function getComplimentStylesCache() {
  if (CACHE.complimentStyles && Date.now() - CACHE.complimentStyles.timestamp < CACHE_DURATION) {
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
    const style = CACHE.complimentStyles.data.find(s => s.title === title || `🔥 ${s.title}` === title || s.title === title.replace(/^🔥\s*/, ''));
    return style ? style.prompt : null;
  }
  return null;
}

// --- JSON Repair Utility ---
export function safeParseJSON(jsonString: string): any {
  if (!jsonString) return null;

  // 1. Remove markdown code blocks
  let content = jsonString
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // 2. Try standard parse
  try {
    return JSON.parse(content);
  } catch (e) {
    // Continue to advanced repair if simple parse fails
  }

  // 3. Extract JSON object/array if embedded in other text
  const firstBrace = content.indexOf('{');
  const firstBracket = content.indexOf('[');
  
  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = content.lastIndexOf('}') + 1;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = content.lastIndexOf(']') + 1;
  }

  if (start !== -1 && end !== -1) {
    content = content.substring(start, end);
    try {
      return JSON.parse(content);
    } catch (e) {
      // Continue to more aggressive repair
    }
  }

  // 4. Basic cleanup for common issues (trailing commas, etc - risky but helpful for simple cases)
  try {
     // Remove trailing commas before } or ]
     const cleaned = content.replace(/,\s*([\]}])/g, '$1');
     return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Repair failed:", e);
    return null;
  }
}

export function createDeepSeekClient(env: any) {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  return new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: env.DEEPSEEK_API_KEY,
    dangerouslyAllowBrowser: true, // Required for Workers sometimes if it detects 'browser' env
  });
}

// --- Maoyan Utils (Crypto Polyfill for Workers) ---
const maoyanUtils = {
  parseQueryString: (qs: string) => Object.fromEntries((new URLSearchParams(qs) as any).entries()),
  
  // Cloudflare Workers/Browser MD5 implementation
  md5: async (message: string) => {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('MD5', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  },

  base64: (str: string) => btoa(unescape(encodeURIComponent(str))),
}

const getMaoyanSig = async (qs: string) => {
  const sortedStr = Object.entries({ path: '/dashboard-ajax', ...maoyanUtils.parseQueryString(qs) })
    .sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()))
    .map(([_, v]) => (typeof v === 'object' ? JSON.stringify(v) : v))
    .join('_')

  const ts = Date.now()
  const ms1 = await maoyanUtils.md5(`581409236#${sortedStr}$${ts}`)

  return JSON.stringify({
    m1: '0.0.3',
    ms1,
    ts,
  })
}

const getMaoyanParams = async () => {
  const fixedParams = { method: 'GET', key: 'A013F70DB97834C0A5492378BD76C53A' }

  const signData: Record<string, any> = {
    timeStamp: Date.now(),
    'User-Agent': maoyanUtils.base64('Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36'),
    index: Math.floor(Math.random() * 1000 + 1),
    channelId: 40009,
    sVersion: 2,
  }

  const signKey = await maoyanUtils.md5(new URLSearchParams({ ...fixedParams, ...signData }).toString().replace(/\s+/g, ' '))

  return new URLSearchParams({ ...signData, signKey })
}

export async function getMaoyanWebHeat(): Promise<MaoyanWebHeatItem[]> {
  // Check Cache
  if (CACHE.maoyanWeb && Date.now() - CACHE.maoyanWeb.timestamp < CACHE_DURATION) {
    return CACHE.maoyanWeb.data;
  }

  try {
    const params = await getMaoyanParams()
    const sig = await getMaoyanSig(params.toString())
    const url = `https://piaofang.maoyan.com/dashboard-ajax?${params}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'mygsig': sig
      }
    });
    
    const data: any = await response.json();
    
    if (!data?.webList?.data?.list) {
      console.error("Maoyan web list structure changed or empty", data);
      return [];
    }

    const list = data.webList.data.list.map((item: any, idx: number) => ({
      rank: idx + 1,
      title: item.seriesInfo.name,
      heat: item.currHeatDesc,
      platform: item.seriesInfo.platformDesc,
      releaseInfo: item.seriesInfo.releaseInfo,
      link: `https://piaofang.maoyan.com/movie/${item.seriesInfo.seriesId}`, // Or appropriate link
      iconType: idx < 3 ? 'hot' : null
    }));

    // Update Cache
    CACHE.maoyanWeb = {
      data: list,
      timestamp: Date.now()
    };

    return list;

  } catch (error) {
    console.error("Maoyan Web Heat fetch error:", error);
    // If cache exists (even if expired), return it as fallback
    if (CACHE.maoyanWeb) return CACHE.maoyanWeb.data;
    return [];
  }
}


// --- Maoyan Box Office (Global History) ---
function formatBoxOffice(boxOffice: number | string, decimals: number = 2): string {
  if (typeof decimals !== 'number' || decimals < 0) {
    throw new Error('decimals must be a non-negative number')
  }

  const amount = Number(boxOffice)
  if (Number.isNaN(amount)) throw new Error('Invalid input: boxOffice must be a valid number')

  const UNIT_WAN = 10 ** 4
  const UNIT_YI = 10 ** 8
  const UNIT_WAN_YI = 10 ** 12

  const formatNumber = (num: number): string => num.toFixed(decimals).replace(/\.?0+$/, '')

  if (amount < UNIT_WAN) {
    return `${formatNumber(amount)}元`
  } else if (amount < UNIT_YI) {
    return `${formatNumber(amount / UNIT_WAN)}万元`
  } else if (amount < UNIT_WAN_YI) {
    return `${formatNumber(amount / UNIT_YI)}亿元`
  } else {
    return `${formatNumber(amount / UNIT_WAN_YI)}万亿元`
  }
}

export async function getMaoyanHistory(): Promise<MaoyanHotItem[]> {
  try {
    const headers = {
      referer: 'https://piaofang.maoyan.com/',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    };

    const response = await fetch('https://piaofang.maoyan.com/i/globalBox/historyRank', { headers });
    const html = await response.text();
    
    const json = /var props = (\{.*?\});/.exec(html)?.[1] || '{}';
    const data = JSON.parse(json)?.data || {};
    const list = (data?.detail?.list || []) as any[];

    return list
      .sort((a, b) => b.rawValue - a.rawValue)
      .map((e, idx) => ({
        rank: idx + 1,
        movieId: e.movieId,
        title: e.movieName,
        releaseTime: e.releaseTime,
        boxOffice: formatBoxOffice(e.rawValue),
        link: `https://piaofang.maoyan.com/movie/${e.movieId}`
      }));

  } catch (error) {
    console.error("Maoyan fetch error:", error);
    return [];
  }
}

// --- Weibo Hot Search (Regex Version) ---
export async function getWeiboHotSearch(): Promise<HotSearchItem[]> {
  // Check Cache
  if (CACHE.weibo && Date.now() - CACHE.weibo.timestamp < CACHE_DURATION) {
    return CACHE.weibo.data;
  }

  try {
    const response = await fetch(
      "https://s.weibo.com/top/summary?cate=realtimehot",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
          Cookie:
            "SUB=_2AkMebfezf8NxqwFRmv0czmnlboVyygrEieKoMQZoJRMxHRl-yT9yqkpStRB6Ne3ZXCfB-VcAPncxijnFzAx2_M6F-iod;SUBP=0033WrSXqPxfM72-Ws9jqgMF55529P9D9WF4LuZl67SBOynUqS9RyVUh",
        },
      }
    );
    const html = await response.text();
    // console.log(html);

    const list: HotSearchItem[] = [];

    // Find the list section to narrow down scope
    const listStart = html.indexOf('<section class="list">');
    const listEnd = html.indexOf('</section>', listStart);
    
    if (listStart === -1 || listEnd === -1) {
      // Fallback or just return empty if structure completely changed
      console.error("Could not find list section in Weibo HTML");
      return [];
    }

    const listHtml = html.substring(listStart, listEnd);
    
    // Split by <li>
    const items = listHtml.split('<li>');
    
    // Skip the first split part which is before the first <li>
    items.shift();

    items.forEach((itemHtml) => {
      let rank: string | number | null = null;
      let title = "";
      let link: string | null = null;
      let hot: string | null = null;
      let iconType: string | null = null;

      // 1. Extract Rank
      // Normal rank: <strong class="hot">1</strong>
      // Ad/Sticky: <strong class="hot" ...>•</strong>
      const rankMatch = itemHtml.match(/<strong[^>]*>(.*?)<\/strong>/);
      if (rankMatch) {
        const r = rankMatch[1].trim();
        if (/^\d+$/.test(r)) {
          rank = parseInt(r, 10);
        } else {
          // Usually '•' or empty, treat as null (ad or sticky without rank)
          rank = null;
        }
      } else {
        // Pinned items usually don't have a rank <strong>
        // They might have icon_pinned
      }

      // 2. Extract Link
      const linkMatch = itemHtml.match(/<a href="([^"]+)"/);
      if (linkMatch) {
        let href = linkMatch[1];
        if (href.startsWith('/')) {
          href = "https://s.weibo.com" + href;
        } else if (href === "#") {
           // Pinned item often has href="#"
           // We can try to construct a search link if needed, or leave as is.
           // Ideally, we might want to skip link if it's useless, 
           // but for now let's keep it or set to null if strictly '#'
           // link = null; 
        }
        link = href;
      }

      // 3. Extract Title and Hot Value
      // Structure: <span>Title<em>HotValue</em> </span>
      // Or just <span>Title</span>
      const contentMatch = itemHtml.match(/<span>(.*?)<\/span>/s);
      if (contentMatch) {
        const spanContent = contentMatch[1];
        const emMatch = spanContent.match(/(.*?)<em>(.*?)<\/em>/s);
        if (emMatch) {
          title = emMatch[1].trim();
          hot = emMatch[2].trim();
        } else {
          title = spanContent.trim();
        }
      }

      // 4. Extract Icon
      if (itemHtml.includes('icon_new')) iconType = "new";
      else if (itemHtml.includes('icon_hot')) iconType = "hot";
      else if (itemHtml.includes('icon_boil')) iconType = "boil";
      else if (itemHtml.includes('icon_fei')) iconType = "fei";
      else if (itemHtml.includes('icon_recommend')) iconType = "recommend";
      
      if (itemHtml.includes('icon_pinned')) {
        iconType = "pinned";
        // Ensure rank is null for pinned
        rank = null; 
      }

      if (title) {
        list.push({ rank, title, link, hot, iconType });
      }
    });

    // Update Cache
    CACHE.weibo = {
      data: list,
      timestamp: Date.now()
    };

    return list;
  } catch (e) {
    console.error("Weibo fetch error:", e);
    // Return cached if available
    if (CACHE.weibo) return CACHE.weibo.data;
    return [];
  }
}

// --- Douyin Hot Search ---
export async function getDouyinHotSearch(): Promise<DouyinHotSearchItem[]> {
  // Check Cache
  if (CACHE.douyin && Date.now() - CACHE.douyin.timestamp < CACHE_DURATION) {
    return CACHE.douyin.data;
  }

  try {
    const response = await fetch(
      "https://aweme-lq.snssdk.com/aweme/v1/hot/search/list/?aid=1128&version_code=880",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
        },
      }
    );
    const data: any = await response.json();

    if (data && data.data && Array.isArray(data.data.word_list)) {
      const list = data.data.word_list.map((item: any, index: number) => ({
        rank: index + 1,
        title: item.word,
        hot: (item.hot_value / 10000).toFixed(1) + "万",
        link: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
        iconType: index < 3 ? "hot" : null,
      }));

      // Update Cache
      CACHE.douyin = {
        data: list,
        timestamp: Date.now()
      };
      
      return list;
    }
    return [];
  } catch (error) {
    console.error("Douyin fetch error:", error);
    if (CACHE.douyin) return CACHE.douyin.data;
    return [];
  }
}

// --- Xiaohongshu Hot Search ---
export async function getXiaohongshuHotSearch(): Promise<HotSearchItem[]> {
  // Check Cache
  if (CACHE.xiaohongshu && Date.now() - CACHE.xiaohongshu.timestamp < CACHE_DURATION) {
    return CACHE.xiaohongshu.data;
  }

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
      const list = data.data.items.map((item: any, idx: number) => ({
        rank: idx + 1,
        title: item.title,
        link: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(
          item.title
        )}&type=51`,
        hot: item.score,
        iconType: mapIconType(item.word_type),
      }));

      // Update Cache
      CACHE.xiaohongshu = {
        data: list,
        timestamp: Date.now()
      };
      
      return list;
    }
    return [];
  } catch (error) {
    console.error("Xiaohongshu fetch error:", error);
    if (CACHE.xiaohongshu) return CACHE.xiaohongshu.data;
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
