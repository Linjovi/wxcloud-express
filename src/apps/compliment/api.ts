import { ComplimentResponse } from "./types";

interface ComplimentApiResponse {
  code: number;
  message: string;
  data: ComplimentResponse;
}

export const getCompliment = async (image: string): Promise<ComplimentResponse> => {
  try {
    const response = await fetch("/api/compliment-cat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result: ComplimentApiResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "夸夸喵暂时不想说话");
    }

    return result.data;
  } catch (error) {
    console.error("Compliment API Error:", error);
    throw new Error("网络连接失败，请稍后再试喵~");
  }
};

