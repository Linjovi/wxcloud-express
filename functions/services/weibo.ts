import { HotSearchItem } from "../types";
import { CACHE, CACHE_DURATION } from "../cache";

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
    const listEnd = html.indexOf("</section>", listStart);

    if (listStart === -1 || listEnd === -1) {
      // Fallback or just return empty if structure completely changed
      console.error("Could not find list section in Weibo HTML");
      return [];
    }

    const listHtml = html.substring(listStart, listEnd);

    // Split by <li>
    const items = listHtml.split("<li>");

    // Skip the first split part which is before the first <li>
    items.shift();

    items.forEach((itemHtml) => {
      let rank: string | number | null = null;
      let title = "";
      let link: string | null = null;
      let hot: string | null = null;
      let iconType: string | null = null;

      // 1. Extract Rank
      const rankMatch = itemHtml.match(/<strong[^>]*>(.*?)<\/strong>/);
      if (rankMatch) {
        const r = rankMatch[1].trim();
        if (/^\d+$/.test(r)) {
          rank = parseInt(r, 10);
        } else {
          rank = null;
        }
      }

      // 2. Extract Link
      const linkMatch = itemHtml.match(/<a href="([^"]+)"/);
      if (linkMatch) {
        let href = linkMatch[1];
        if (href.startsWith("/")) {
          href = "https://s.weibo.com" + href;
        } else if (href === "#") {
          // link = null;
        }
        link = href;
      }

      // 3. Extract Title and Hot Value
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
      if (itemHtml.includes("icon_new")) iconType = "new";
      else if (itemHtml.includes("icon_hot")) iconType = "hot";
      else if (itemHtml.includes("icon_boil")) iconType = "boil";
      else if (itemHtml.includes("icon_fei")) iconType = "fei";
      else if (itemHtml.includes("icon_recommend")) iconType = "recommend";

      if (itemHtml.includes("icon_pinned")) {
        iconType = "pinned";
        rank = null;
      }

      if (title) {
        list.push({ rank, title, link, hot, iconType });
      }
    });

    // Update Cache
    CACHE.weibo = {
      data: list,
      timestamp: Date.now(),
    };

    return list;
  } catch (e) {
    console.error("Weibo fetch error:", e);
    if (CACHE.weibo) return CACHE.weibo.data;
    return [];
  }
}

