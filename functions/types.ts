
export interface HotSearchItem {
  rank: string | number | null;
  title: string;
  link: string | null;
  hot: string | null;
  iconType: string | null;
}

export interface DouyinHotSearchItem {
  rank: number;
  title: string;
  hot: string;
  link: string;
  iconType: string | null;
}

export interface MaoyanHotItem {
  rank: number;
  title: string;
  boxOffice: string;
  releaseTime: string;
  movieId: number;
  link: string;
}

export interface MaoyanWebHeatItem {
  rank: number;
  title: string;
  heat: string;
  platform: string;
  releaseInfo: string;
  link: string;
  iconType: string | null;
}

export interface JudgementData {
  nameA: string;
  nameB: string;
  cause: string;
  sideA?: string;
  sideB?: string;
}

export interface CardInfo {
  name: string;
  isReversed: boolean;
  position: string;
}

export interface TarotRequestData {
  cards: CardInfo[];
  spreadName: string;
  question?: string;
}

export interface Env {
  DEEPSEEK_API_KEY: string;
  GOOGLE_API_KEY: string;
  GRSAI_API_KEY: string;
  GRSAI_BASE_URL?: string;
}

export interface ComplimentStyle {
  title: string;
  prompt: string;
  tags?: string[];
  source?: string[];
}
