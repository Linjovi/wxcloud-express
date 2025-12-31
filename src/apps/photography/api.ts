import { HotStyle, PhotographyResponse } from "./types";

interface PhotographyApiResponse {
  code: number;
  message: string;
  data: PhotographyResponse;
}

interface StylesResponse {
  code: number;
  data: Array<{ label: string; text: string }>;
  message?: string;
}

export const getPhotography = async (
  image: string,
  prompt: string,
  mimeType: string,
  outputSize: string | undefined,
  style: string | undefined,
  backgroundImage: string | undefined,
  onProgress?: (data: any) => void,
  onComplete?: (result: PhotographyResponse) => void
): Promise<void> => {
  try {
    const response = await fetch("/api/image/photography-cat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image,
        prompt,
        mimeType,
        outputSize,
        style,
        backgroundImage,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Failed to read response stream");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          if (jsonStr === "[DONE]") break;

          try {
            const data = JSON.parse(jsonStr);

            // Check for progress updates
            if (data.status === "running") {
              if (onProgress) {
                onProgress(data);
              }
            } else if (
              data.status === "succeeded" &&
              data.results &&
              data.results.length > 0
            ) {
              const imageUrl = data.results[0].url;
              if (imageUrl) {
                if (onComplete) {
                  onComplete({ imageUrl });
                }
              }
            } else if (data.status === "failed") {
              if (onComplete) {
                onComplete({
                  error: data.failure_reason || "Generation failed",
                } as any);
              }
            }
          } catch (e) {
            console.error("Error parsing stream data", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Photography API Error:", error);
    throw new Error("网络连接失败，请稍后再试喵~");
  }
};

export const getPhotographyStyles = async (): Promise<HotStyle[]> => {
  try {
    const response = await fetch("/api/image/photography-styles");
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const result: any = await response.json();
    if (result.code !== 0) {
      throw new Error(result.message || "获取灵感失败");
    }
    return result.data.map((item: any) => ({
      title: item.title,
      source: item.source,
      prompt: item.prompt,
    }));
  } catch (error) {
    console.error("Photography Styles API Error:", error);
    throw new Error("获取灵感失败了喵~");
  }
};
