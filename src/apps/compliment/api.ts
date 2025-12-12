import { ComplimentResponse } from "./types";

interface ComplimentApiResponse {
  code: number;
  message: string;
  data: ComplimentResponse;
}

interface StylesResponse {
  code: number;
  data: Array<{ label: string; text: string }>;
  message?: string;
}

export const getCompliment = async (image: string, prompt: string, mimeType: string, outputSize?: string, style?: string): Promise<ComplimentResponse> => {
  try {
    const response = await fetch("/api/compliment-cat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image, prompt, mimeType, outputSize, style }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json(); // Don't enforce structure yet, backend returns what it returns

    if (result.code !== 0) {
      throw new Error(result.message || "夸夸喵暂时不想说话");
    }

    return result.data;
  } catch (error) {
    console.error("Compliment API Error:", error);
    throw new Error("网络连接失败，请稍后再试喵~");
  }
};

export const getComplimentStyles = async (): Promise<Array<{ title: string }>> => {
  try {
    const response = await fetch("/api/compliment-styles");
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const result: any = await response.json();
    if (result.code !== 0) {
      throw new Error(result.message || "获取灵感失败");
    }
    return result.data.map((item: any) => ({
      title: item.title,
    }));
  } catch (error) {
    console.error("Compliment Styles API Error:", error);
    throw new Error("获取灵感失败了喵~");
  }
};
