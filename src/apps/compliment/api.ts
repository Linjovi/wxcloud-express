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

export const getCompliment = async (
  image: string,
  prompt: string,
  mimeType: string,
  outputSize: string | undefined,
  style: string | undefined,
  onProgress?: (data: any) => void,
  onComplete?: (result: ComplimentResponse) => void
): Promise<void> => {
  try {
    const response = await fetch("/api/compliment-cat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image, prompt, mimeType, outputSize, style, stream: true }),
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
            } else if (data.status === "succeeded" && data.results && data.results.length > 0) {
              // Handle completion
              // The API returns image URL, we might need to fetch it to convert to base64 or just use URL if <img src> supports it.
              // Current app expects base64Image in ComplimentResponse.
              // However, the new API returns a URL.
              // Let's try to fetch the URL and convert to base64 to maintain compatibility with the UI which expects base64Image
              
              const imageUrl = data.results[0].url;
              if (imageUrl) {
                 // Fetch the image from the URL to convert to base64
                 // Note: this might run into CORS if the image server doesn't allow it.
                 // Ideally the backend should proxy this or UI should support URL.
                 // For now, let's try to pass the URL as base64Image (UI uses it in src="data:image/jpeg;base64,...")
                 // WAIT, UI code does: <img src={`data:image/jpeg;base64,${result.base64Image}`}
                 // We need to fetch it.
                 
                 // BUT, for speed, let's assume we can change UI to support URL or we fetch it here.
                 // To minimize UI changes, let's fetch here.
                 try {
                     const imgRes = await fetch(imageUrl);
                     const blob = await imgRes.blob();
                     const reader = new FileReader();
                     reader.onloadend = () => {
                         const base64data = (reader.result as string).split(',')[1];
                         if (onComplete) {
                             onComplete({ base64Image: base64data });
                         }
                     };
                     reader.readAsDataURL(blob);
                 } catch (e) {
                     console.error("Failed to fetch result image", e);
                     if (onComplete) {
                         // Fallback?
                         onComplete({ error: "Failed to download result image" } as any);
                     }
                 }
              }
            } else if (data.status === "failed") {
                 if (onComplete) {
                     onComplete({ error: data.failure_reason || "Generation failed" } as any);
                 }
            }
          } catch (e) {
            console.error("Error parsing stream data", e);
          }
        }
      }
    }
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
