import { HotSearchItem } from "../types";
import { CACHE, CACHE_DURATION } from "../cache";

export async function getXiaohongshuHotSearch(): Promise<HotSearchItem[]> {
  // Check Cache
  if (
    CACHE.xiaohongshu &&
    Date.now() - CACHE.xiaohongshu.timestamp < CACHE_DURATION
  ) {
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
        timestamp: Date.now(),
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

