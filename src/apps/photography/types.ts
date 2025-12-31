export interface PhotographyResponse {
  base64Image?: string;
  imageUrl?: string;
  error?: string;
}

export interface HotStyle {
  title: string;
  source?: string[];
  prompt?: string;
}
