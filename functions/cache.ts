import {
  HotSearchItem,
  DouyinHotSearchItem,
  MaoyanWebHeatItem,
  ComplimentStyle,
} from "./types";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Compliment styles cache never expires automatically (updated by cron)
export const COMPLIMENT_CACHE_DURATION = 24 * 60 * 60 * 1000; 

export const CACHE: {
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

