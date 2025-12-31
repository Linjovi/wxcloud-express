export interface ImageGenerationConfig {
  baseUrl: string;
  apiKey: string;
}

export function getImageGenerationConfig(context: any): ImageGenerationConfig {
  const baseUrl = context.env.GRSAI_BASE_URL || "https://api.grsai.com";
  const apiKey = context.env.GRSAI_API_KEY;

  if (!apiKey) {
    throw new Error("GRSAI_API_KEY is not set");
  }

  return { baseUrl, apiKey };
}

export function createErrorResponse(code: number, message: string) {
  return new Response(
    JSON.stringify({
      code,
      message,
    }),
    { status: code, headers: { "Content-Type": "application/json" } }
  );
}

export async function streamImageGeneration(
  context: any,
  endpoint: string,
  payload: any,
  onStreamData?: (data: any) => Promise<void>
) {
  try {
    const { baseUrl, apiKey } = getImageGenerationConfig(context);
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // Handle JSON response (some APIs might return JSON even if stream requested, or if immediately finished/error)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      
      // If client expects stream, wrap JSON in SSE format
      if (payload.stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();
        
        // Execute callback if provided (e.g. for backup)
        if (onStreamData) {
            await onStreamData(data);
        }

        writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        writer.write(encoder.encode(`data: [DONE]\n\n`));
        writer.close();

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      }
      
      // Standard JSON response
      // Normalize result structure if needed
      let base64Image = null;
      if (data.base64Image) {
        base64Image = data.base64Image;
      } else if (data.data && data.data.base64Image) {
        base64Image = data.data.base64Image;
      }
      
      return new Response(
        JSON.stringify({
          code: 0,
          message: "Success",
          data: base64Image ? { base64Image } : data,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Pass through the streaming response directly
    if (!response.body) {
      throw new Error("Upstream response has no body for streaming");
    }

    if (!payload.stream) {
        // If not streaming but got a stream-like body (unexpected for some APIs), try to text it
        const text = await response.text();
        throw new Error(`Unexpected response format: ${text}`);
    }

    // Intercept stream for backup if needed, otherwise direct pipe
    if (onStreamData) {
        const { readable, writable } = new TransformStream();
        const reader = response.body.getReader();
        const writer = writable.getWriter();
        const decoder = new TextDecoder();
        
        context.waitUntil(
            (async () => {
                let fullResponse = "";
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        await writer.write(value);
                        fullResponse += decoder.decode(value, { stream: true });
                    }
                    await writer.close();
                    
                    // Parse accumulated response for backup
                    const lines = fullResponse.split("\n");
                    for (const line of lines) {
                        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                await onStreamData(data);
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                } catch (e) {
                    console.error("Stream processing error", e);
                    try { await writer.close(); } catch {}
                }
            })()
        );

        return new Response(readable, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
            },
        });
    }

    // Direct pipe if no interception needed
    const { readable, writable } = new TransformStream();
    response.body.pipeTo(writable).catch((err) => {
      console.error("Stream pipe error:", err);
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Image Generation API Error:", error);
    return createErrorResponse(500, error.message || "生成失败，请稍后再试");
  }
}

export async function pollImageGenerationResult(context: any, id: string | null) {
  if (!id) {
    return createErrorResponse(400, "缺少 id 参数");
  }

  try {
    const { baseUrl, apiKey } = getImageGenerationConfig(context);
    const url = `${baseUrl}/v1/draw/result`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Upstream API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ code: 0, data: data, msg: "success" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Poll Result API Error:", error);
    return createErrorResponse(500, error.message || "查询任务失败");
  }
}

