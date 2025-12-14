import {
  safeParseJSON,
  getComplimentStylePrompt,
} from "../utils";

export async function onRequestPost(context: any) {
  const req = context.request;

  try {
    const { image, prompt, mimeType, outputSize, style, stream } = await req.json();

    let finalPrompt = prompt;
    if (style) {
      const cachedPrompt = getComplimentStylePrompt(style);
      if (cachedPrompt) {
        finalPrompt = `${cachedPrompt}，${prompt || ""}`;
      } else {
        // Fallback: use style title itself
        finalPrompt = `请参考“${style}”的风格，对这张照片进行风格化调整。${
          prompt || ""
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
    const url = "https://api.grsai.com/v1/draw/nano-banana";
    const apiKey = context.env.GRSAI_API_KEY;

    if (!apiKey) {
      throw new Error("GRSAI_API_KEY is not set");
    }

    const systemInstruction = `
Role: You are an Expert AI Image Editor.
Task: Edit the supplied image according to the user's detailed instruction.
Guidelines:
1. **Professional Quality**: Ensure the edited result is photorealistic, high-resolution, and visually stunning.
2. **Precise Execution**: Follow the user's request exactly. If they ask for a specific change (e.g., "remove background"), do it cleanly.
3. **Preserve Details**: Maintain the original identity, lighting, and style of the key subjects unless explicitly asked to change them.
4. **Enhancement**: If the user's instruction is vague (e.g., "make it better"), apply professional color grading, lighting adjustments, and subtle beauty enhancements to create a magazine-quality photo.
Output: You must return a JSON object containing the 'base64Image' of the edited result.
    `;

    const payload = {
      model: "nano-banana-pro",
      prompt: `${systemInstruction}\n\nInstruction: ${finalPrompt}`,
      image: image, // Assuming API accepts base64 string in 'image' field
      stream: !!stream,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (stream) {
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
          "Connection": "keep-alive",
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
