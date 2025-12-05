import { HotSearchItem, MaoyanWebHeatItem } from "./types";

interface HotSearchResponse {
  code: number;
  data: {
    list: HotSearchItem[] | MaoyanWebHeatItem[];
    summary?: string;
    count: number;
    timestamp: string;
  };
  message?: string;
}

export const getWeiboHotSearch = async (): Promise<{
  list: HotSearchItem[];
  summary?: string;
}> => {
  try {
    const response = await fetch("/api/weibo-hot-search");

    if (!response.ok) {
      throw new Error("获取热搜失败，请稍后再试");
    }

    const result: HotSearchResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "获取热搜返回错误");
    }

    return { list: result.data.list as HotSearchItem[], summary: result.data.summary };
  } catch (error) {
    console.error("Error fetching weibo hot search:", error);
    throw error;
  }
};

export const getDouyinHotSearch = async (): Promise<{
  list: HotSearchItem[];
  summary?: string;
}> => {
  try {
    const response = await fetch("/api/douyin-hot-search");

    if (!response.ok) {
      throw new Error("获取热搜失败，请稍后再试");
    }

    const result: HotSearchResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "获取热搜返回错误");
    }

    return { list: result.data.list as HotSearchItem[], summary: result.data.summary };
  } catch (error) {
    console.error("Error fetching douyin hot search:", error);
    throw error;
  }
};

export const getXiaohongshuHotSearch = async (): Promise<{
  list: HotSearchItem[];
  summary?: string;
}> => {
  try {
    const response = await fetch("/api/xiaohongshu-hot-search");

    if (!response.ok) {
      throw new Error("获取热搜失败，请稍后再试");
    }

    const result: HotSearchResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "获取热搜返回错误");
    }

    return { list: result.data.list as HotSearchItem[], summary: result.data.summary };
  } catch (error) {
    console.error("Error fetching xiaohongshu hot search:", error);
    throw error;
  }
};

export const getMaoyanWebHeat = async (): Promise<{
  list: MaoyanWebHeatItem[];
  summary?: string;
}> => {
  try {
    const response = await fetch("/api/maoyan-hot");

    if (!response.ok) {
      throw new Error("获取网剧热度失败，请稍后再试");
    }

    const result: HotSearchResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "获取网剧热度返回错误");
    }

    return { list: result.data.list as MaoyanWebHeatItem[], summary: result.data.summary };
  } catch (error) {
    console.error("Error fetching maoyan web heat:", error);
    throw error;
  }
};

export interface SummaryData {
  summary: string;
  mood: string;
  moodScore: number;
  keywords: Array<{ name: string; weight: number }>;
}

export const getHotSearchSummary = async (): Promise<SummaryData> => {
  try {
    const response = await fetch("/api/hot-search-summary");

    if (!response.ok) {
      throw new Error("获取热搜总结失败");
    }

    const result = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "获取热搜总结返回错误");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching hot search summary:", error);
    throw error;
  }
};
