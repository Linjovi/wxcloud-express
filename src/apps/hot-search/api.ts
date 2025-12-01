import { HotSearchItem } from "./types";

interface HotSearchResponse {
  code: number;
  data: {
    list: HotSearchItem[];
    count: number;
    timestamp: string;
  };
  message?: string;
}

interface AllHotSearchResponse {
  code: number;
  data: {
    weibo: HotSearchItem[];
    douyin: HotSearchItem[];
    summary?: string;
    timestamp: string;
  };
  message?: string;
}

export const getAllHotSearch = async (): Promise<{
  weibo: HotSearchItem[];
  douyin: HotSearchItem[];
  summary?: string;
}> => {
  try {
    const response = await fetch("/api/all-hot-search");

    if (!response.ok) {
      throw new Error("获取热搜失败，请稍后再试");
    }

    const result: AllHotSearchResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "获取热搜返回错误");
    }

    return {
      weibo: result.data.weibo,
      douyin: result.data.douyin,
      summary: result.data.summary,
    };
  } catch (error) {
    console.error("Error fetching all hot search:", error);
    throw error;
  }
};

export const getWeiboHotSearch = async (): Promise<HotSearchItem[]> => {
  try {
    const response = await fetch("/api/weibo-hot-search");

    if (!response.ok) {
      throw new Error("获取热搜失败，请稍后再试");
    }

    const result: HotSearchResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "获取热搜返回错误");
    }

    return result.data.list;
  } catch (error) {
    console.error("Error fetching weibo hot search:", error);
    throw error;
  }
};

export const getDouyinHotSearch = async (): Promise<HotSearchItem[]> => {
  try {
    const response = await fetch("/api/douyin-hot-search");

    if (!response.ok) {
      throw new Error("获取热搜失败，请稍后再试");
    }

    const result: HotSearchResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "获取热搜返回错误");
    }

    return result.data.list;
  } catch (error) {
    console.error("Error fetching douyin hot search:", error);
    throw error;
  }
};

