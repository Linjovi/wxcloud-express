import { DouyinHotSearchItem } from "../types";
import { CACHE, CACHE_DURATION } from "../cache";

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
        timestamp: Date.now(),
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

