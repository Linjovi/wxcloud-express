export interface HotSearchItem {
  rank: number | string | null;
  title: string;
  link: string | null;
  hot: string | number | null;
  iconType: string | null;
}

// Alias for backward compatibility if needed, or just use HotSearchItem
export type WeiboHotSearchItem = HotSearchItem;

