import { HotSearchItem } from "./types";

export interface MaoyanWebHeatItem {
  rank: number;
  title: string;
  heat: string;
  platform: string;
  releaseInfo: string;
  link: string;
  iconType: string | null;
}

export type HotSearchType = HotSearchItem | MaoyanWebHeatItem;

export interface HotSearchItem {
  rank: number | string | null;
  title: string;
  link: string | null;
  hot: string | number | null;
  iconType: string | null;
}

// Alias for backward compatibility if needed, or just use HotSearchItem
export type WeiboHotSearchItem = HotSearchItem;
