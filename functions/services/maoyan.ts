import { MaoyanWebHeatItem, MaoyanHotItem } from "../types";
import { CACHE, CACHE_DURATION } from "../cache";

// --- Maoyan Utils (Crypto Polyfill for Workers) ---
const maoyanUtils = {
  parseQueryString: (qs: string) =>
    Object.fromEntries((new URLSearchParams(qs) as any).entries()),

  // Cloudflare Workers/Browser MD5 implementation
  md5: async (message: string) => {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("MD5", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  },

  base64: (str: string) => btoa(unescape(encodeURIComponent(str))),
};

const getMaoyanSig = async (qs: string) => {
  const sortedStr = Object.entries({
    path: "/dashboard-ajax",
    ...maoyanUtils.parseQueryString(qs),
  })
    .sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()))
    .map(([_, v]) => (typeof v === "object" ? JSON.stringify(v) : v))
    .join("_");

  const ts = Date.now();
  const ms1 = await maoyanUtils.md5(`581409236#${sortedStr}$${ts}`);

  return JSON.stringify({
    m1: "0.0.3",
    ms1,
    ts,
  });
};

const getMaoyanParams = async () => {
  const fixedParams = {
    method: "GET",
    key: "A013F70DB97834C0A5492378BD76C53A",
  };

  const signData: Record<string, any> = {
    timeStamp: Date.now(),
    "User-Agent": maoyanUtils.base64(
      "Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36"
    ),
    index: Math.floor(Math.random() * 1000 + 1),
    channelId: 40009,
    sVersion: 2,
  };

  const signKey = await maoyanUtils.md5(
    new URLSearchParams({ ...fixedParams, ...signData })
      .toString()
      .replace(/\s+/g, " ")
  );

  return new URLSearchParams({ ...signData, signKey });
};

export async function getMaoyanWebHeat(): Promise<MaoyanWebHeatItem[]> {
  // Check Cache
  if (
    CACHE.maoyanWeb &&
    Date.now() - CACHE.maoyanWeb.timestamp < CACHE_DURATION
  ) {
    return CACHE.maoyanWeb.data;
  }

  try {
    const params = await getMaoyanParams();
    const sig = await getMaoyanSig(params.toString());
    const url = `https://piaofang.maoyan.com/dashboard-ajax?${params}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        mygsig: sig,
      },
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
      iconType: idx < 3 ? "hot" : null,
    }));

    // Update Cache
    CACHE.maoyanWeb = {
      data: list,
      timestamp: Date.now(),
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
function formatBoxOffice(
  boxOffice: number | string,
  decimals: number = 2
): string {
  if (typeof decimals !== "number" || decimals < 0) {
    throw new Error("decimals must be a non-negative number");
  }

  const amount = Number(boxOffice);
  if (Number.isNaN(amount))
    throw new Error("Invalid input: boxOffice must be a valid number");

  const UNIT_WAN = 10 ** 4;
  const UNIT_YI = 10 ** 8;
  const UNIT_WAN_YI = 10 ** 12;

  const formatNumber = (num: number): string =>
    num.toFixed(decimals).replace(/\.?0+$/, "");

  if (amount < UNIT_WAN) {
    return `${formatNumber(amount)}元`;
  } else if (amount < UNIT_YI) {
    return `${formatNumber(amount / UNIT_WAN)}万元`;
  } else if (amount < UNIT_WAN_YI) {
    return `${formatNumber(amount / UNIT_YI)}亿元`;
  } else {
    return `${formatNumber(amount / UNIT_WAN_YI)}万亿元`;
  }
}

export async function getMaoyanHistory(): Promise<MaoyanHotItem[]> {
  try {
    const headers = {
      referer: "https://piaofang.maoyan.com/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    };

    const response = await fetch(
      "https://piaofang.maoyan.com/i/globalBox/historyRank",
      { headers }
    );
    const html = await response.text();

    const json = /var props = (\{.*?\});/.exec(html)?.[1] || "{}";
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
        link: `https://piaofang.maoyan.com/movie/${e.movieId}`,
      }));
  } catch (error) {
    console.error("Maoyan fetch error:", error);
    return [];
  }
}

