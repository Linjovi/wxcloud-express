import {
  safeParseJSON,
  getComplimentStylePrompt,
  updateComplimentStylesCache,
  createDeepSeekClient,
  generateComplimentPrompt,
} from "../utils";

export async function onRequestPost(context: any) {
  const req = context.request;

  try {
    const { image, prompt, mimeType, outputSize, style, stream } =
      await req.json();

    let finalPrompt = prompt;
    if (style) {
      let cachedPrompt = getComplimentStylePrompt(style);

      // If no cached prompt found for the style, try to generate one on the fly
      if (!cachedPrompt) {
        try {
          console.log(`No cached prompt for style "${style}", generating...`);
          const client = createDeepSeekClient(context.env);
          const generated = await generateComplimentPrompt(client, style, 1.1);

          if (typeof generated === "string" && generated) {
            console.log(`Generated prompt for "${style}":`, generated);
            cachedPrompt = generated;
            // Update cache for future use
            updateComplimentStylesCache({ title: style, prompt: generated });
          }
        } catch (err) {
          console.error(`Failed to generate prompt for style "${style}":`, err);
        }
      }

      if (cachedPrompt) {
        finalPrompt = `${cachedPrompt}，${prompt || ""}`;
      } else {
        // Fallback: use style title itself
        finalPrompt = `请以“${style}”为主题，对这张照片进行处理。${prompt || ""
          }`;
      }
    }

    if (!image || (!finalPrompt && !style)) {
      return new Response(
        JSON.stringify({
          code: 400,
          message: "No image or prompt provided",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Direct endpoint usage as requested
    const baseUrl = context.env.GRSAI_BASE_URL || "https://api.grsai.com";
    const url = `${baseUrl}/v1/draw/nano-banana`;
    const apiKey = context.env.GRSAI_API_KEY;

    if (!apiKey) {
      throw new Error("GRSAI_API_KEY is not set");
    }

    const systemInstruction = `【重要提示：保持人物面部特征、五官身份完全不变】
${finalPrompt}`;

    const payload = {
      model: "nano-banana-pro",
      prompt: systemInstruction,
      urls: [image], // Assuming API accepts base64 string in 'image' field
      aspectRatio: "auto",
      imageSize: "2K",
      stream: stream,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (stream) {
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
            "Connection": "keep-alive",
          },
        });
      }

      // Pass through the streaming response directly
      // If the upstream API returns standard SSE, we can just pipe it.
      // We wrap it in a new Response to ensure headers are correct for the client.
      const { readable, writable } = new TransformStream();

      // If the upstream response body is null, we can't stream.
      if (!response.body) {
        throw new Error("Upstream response has no body for streaming");
      }

      response.body.pipeTo(writable).catch((err) => {
        console.error("Stream pipe error:", err);
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming mode
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const result = await response.json();

    // Check if result needs parsing or is already in expected format
    // Assuming result structure contains base64Image directly or inside data
    // Adapt as needed based on actual API response.
    // If API returns { base64Image: "..." } or { data: { base64Image: "..." } }

    let base64Image = null;
    if (result.base64Image) {
      base64Image = result.base64Image;
    } else if (result.data && result.data.base64Image) {
      base64Image = result.data.base64Image;
    }

    if (!base64Image) {
      // Fallback: maybe it returns OpenAI-like choice structure?
      // But user said "don't use openai anymore".
      console.error("Unexpected API response structure:", result);
      throw new Error("修图失败，返回数据格式不正确喵~");
    }

    // Re-wrap to match our frontend expectation
    return new Response(
      JSON.stringify({
        code: 0,
        message: "Success",
        data: { base64Image },
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Edit API Error:", error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: error.message || "修图喵出错了，稍后再试喵~",
      }),
      { status: 500 }
    );
  }
}
