import { safeParseJSON } from "../utils";

export async function onRequestPost(context: any) {
  const req = context.request;

  try {
    const {
      image,
      refImage,
      style,
      type = 1,
      gifPrompt,
      description,
    } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({
          code: 400,
          message: "请上传图片",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let prompt = "";
    let urls = [image];
    let model = "nano-banana"; // Default model for Type 1 & 2

    // Determine prompt, urls, and model based on type
    if (type === 1) {
      // Type 1: 9-Grid Meme
      model = "nano-banana-fast";
      const descriptionText =
        description && description.trim()
          ? `。用户希望：${description.trim()}`
          : "";
      if (style === "cartoon") {
        prompt = `以这张图片的主体为主角，制作九宫格的表情包。纯白色背景。卡通风格。需包含6-9个生动夸张的表情和动作（如：震惊、大笑、委屈、疑惑、暗中观察等）。画面精致，可爱搞怪，极具表现力。不要在图片中包含任何文字${descriptionText}`;
      } else {
        // Realistic default
        prompt = `以这张照片中的动物为主角，制作九宫格的表情包。不要在图片中包含任何文字${descriptionText}`;
      }
    } else if (type === 2) {
      // Type 2: Expression Transfer
      model = "nano-banana-pro";
      if (!refImage) {
        return new Response(
          JSON.stringify({
            code: 400,
            message: "Type 2 生成需要提供参考图 (refImage)",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      // Prompt for expression transfer
      prompt = `Keep the character/subject from the first image exactly as is, but make them perform the facial expression and pose shown in the second image. High quality, expressive, meme style. No text in image.`;
      urls = [image, refImage];
    } else if (type === 3) {
      // Type 3: GIF
      model = "nano-banana-pro";
      const action = gifPrompt || "吐一下舌头";
      prompt = `为我生成图中角色的GIF表情包每一帧的图片。 使用 4行x4列 布局共生成16个小图片。16个小图片为“${action}”动作的连贯的拆分动作，使用这16张可以组成一个完整的、循环动画，动作流畅逼真，最后一帧应流畅地循环回到第一帧。16个小图片的边缘不要增加间距，每张图片都不要超出自己的区域。 不要画分割线。`;
    } else {
      return new Response(
        JSON.stringify({
          code: 400,
          message: "不支持的 type 类型",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const baseUrl = context.env.GRSAI_BASE_URL || "https://api.grsai.com";
    const url = `${baseUrl}/v1/draw/nano-banana`;
    const apiKey = context.env.GRSAI_API_KEY;

    if (!apiKey) {
      throw new Error("GRSAI_API_KEY is not set");
    }

    const payload = {
      model: model,
      prompt,
      urls: urls,
      aspectRatio: "1:1",
      imageSize: "2K",
      stream: true,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      // Wrap JSON response in SSE format
      const encoder = new TextEncoder();
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      writer.write(encoder.encode(`data: [DONE]\n\n`));
      writer.close();

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Pass through the streaming response directly
    if (!response.body) {
      throw new Error("Upstream response has no body for streaming");
    }

    const { readable, writable } = new TransformStream();
    const reader = response.body.getReader();
    const writer = writable.getWriter();
    const decoder = new TextDecoder();

    // We need to capture the full response to extract the final image URL/data for backup
    let fullResponse = "";

    // Process the stream
    context.waitUntil(
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Write to client immediately
            await writer.write(value);

            // Accumulate for backup
            const text = decoder.decode(value, { stream: true });
            fullResponse += text;
          }
          await writer.close();

          // After stream is done, try to parse the result for backup
          // The stream usually ends with data: [DONE], we need to find the last valid JSON
          const lines = fullResponse.split("\n");
          let imageUrl: string | null = null;
          let remoteId: string | null = null;

          for (const line of lines) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const jsonStr = line.slice(6);
                const data = JSON.parse(jsonStr);

                // Capture ID if available
                if (data.id) {
                  remoteId = data.id;
                }

                // Check for image data in this chunk
                if (
                  data.results &&
                  data.results.length > 0 &&
                  data.results[0].url
                ) {
                  imageUrl = data.results[0].url;
                }
              } catch (e) {
                // ignore parsing errors for partial chunks
              }
            }
          }

          // Perform backup if we found image data
          if (imageUrl && context.env.MEME_BACKUP_BUCKET) {
            try {
              let body: ArrayBuffer | Uint8Array | null = null;
              let suffix = "png";

              if (imageUrl) {
                const imgRes = await fetch(imageUrl);
                if (imgRes.ok) {
                  body = await imgRes.arrayBuffer();
                }
              }

              if (body) {
                // Use remoteId if available, otherwise fallback to UUID
                const id = remoteId || crypto.randomUUID();
                const key = `meme/${id}.${suffix}`;
                await context.env.MEME_BACKUP_BUCKET.put(key, body);
                console.log(`[Backup] Uploaded to R2: ${key}`);
              }
            } catch (e) {
              console.error("[Backup] Failed to upload to R2:", e);
            }
          }
        } catch (err) {
          console.error("Stream processing error:", err);
          try {
            await writer.close();
          } catch {}
        }
      })()
    );

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Meme Gen API Error:", error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: error.message || "表情包生成出错了，稍后再试喵~",
      }),
      { status: 500 }
    );
  }
}
