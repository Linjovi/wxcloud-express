import { safeParseJSON } from "../utils";

export async function onRequestPost(context: any) {
  const req = context.request;

  try {
    const { image, refImage, style, stream, type = 1, gifPrompt } = await req.json();

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
      model = "nano-banana";
      if (style === "cartoon") {
        prompt = `以这张图片的主体为主角，制作九宫格的表情包。纯白色背景。卡通风格。需包含6-9个生动夸张的表情和动作（如：震惊、大笑、委屈、疑惑、暗中观察等）。画面精致，可爱搞怪，极具表现力。不要在图片中包含任何文字。`;
      } else {
        // Realistic default
        prompt = `以这张照片中的动物为主角，制作九宫格的表情包，需包含9个生动夸张的表情和动作。不要在图片中包含任何文字。`;
      }
    } else if (type === 2) {
      // Type 2: Expression Transfer
      model = "nano-banana";
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

    const url = "https://api.grsai.com/v1/draw/nano-banana";
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
            Connection: "keep-alive",
          },
        });
      }

      // Pass through the streaming response directly
      if (!response.body) {
        throw new Error("Upstream response has no body for streaming");
      }

      const { readable, writable } = new TransformStream();
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

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    let base64Image = null;
    let imageUrl = null;

    if (result.results && result.results.length > 0 && result.results[0].url) {
        imageUrl = result.results[0].url;
    } else if (result.base64Image) {
      base64Image = result.base64Image;
    } else if (result.data && result.data.base64Image) {
      base64Image = result.data.base64Image;
    }

    if (!base64Image && !imageUrl) {
      throw new Error("生成失败，返回数据格式不正确");
    }

    return new Response(
      JSON.stringify({
        code: 0,
        message: "Success",
        data: { base64Image, imageUrl },
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
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
