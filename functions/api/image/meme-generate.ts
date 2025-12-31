import { streamImageGeneration, createErrorResponse } from "../../services/image-generation";

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
      return createErrorResponse(400, "请上传图片");
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
        return createErrorResponse(400, "Type 2 生成需要提供参考图 (refImage)");
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
      return createErrorResponse(400, "不支持的 type 类型");
    }

    const payload = {
      model: model,
      prompt,
      urls: urls,
      aspectRatio: "1:1",
      imageSize: "2K",
      stream: true,
    };

    // Backup Callback
    const handleBackup = async (data: any) => {
        if (context.env.MEME_BACKUP_BUCKET && data.results && data.results.length > 0 && data.results[0].url) {
            try {
                const imageUrl = data.results[0].url;
                const remoteId = data.id;
                let body: ArrayBuffer | Uint8Array | null = null;
                const imgRes = await fetch(imageUrl);
                if (imgRes.ok) {
                    body = await imgRes.arrayBuffer();
                }

                if (body) {
                    const id = remoteId || crypto.randomUUID();
                    const key = `meme/${id}.png`;
                    await context.env.MEME_BACKUP_BUCKET.put(key, body);
                    console.log(`[Backup] Uploaded to R2: ${key}`);
                }
            } catch (e) {
                console.error("[Backup] Failed to upload to R2:", e);
            }
        }
    };

    return streamImageGeneration(context, "/v1/draw/nano-banana", payload, handleBackup);

  } catch (error: any) {
    console.error("Meme Gen API Error:", error);
    return createErrorResponse(500, error.message || "表情包生成出错了，稍后再试喵~");
  }
}
