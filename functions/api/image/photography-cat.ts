import {
  safeParseJSON,
  getPhotographyStylePrompt,
  updatePhotographyStylesCache,
  createDeepSeekClient,
  generatePhotographyPrompt,
} from "../../utils";
import { streamImageGeneration, createErrorResponse } from "../../services/image-generation";

export async function onRequestPost(context: any) {
  const req = context.request;

  try {
    const { image, prompt, mimeType, outputSize, style, backgroundImage, stream } =
      await req.json();

    let finalPrompt = prompt;
    let images = [image];
    
    if (style) {
      if (style === "更换背景" && backgroundImage) {
          images = [image, backgroundImage];
          finalPrompt = "请将第一张图片中的人物主体，融合到第二张图片作为背景中。保持人物的光影、透视与新背景自然融合。不要改变人物的相貌特征。";
          if (prompt) {
              finalPrompt += ` 额外要求：${prompt}`;
          }
      } else {
        let cachedPrompt = getPhotographyStylePrompt(style);

        // If no cached prompt found for the style, try to generate one on the fly
        if (!cachedPrompt) {
          try {
            console.log(`No cached prompt for style "${style}", generating...`);
            const client = createDeepSeekClient(context.env);
            const generated = await generatePhotographyPrompt(client, style, 1.1);

            if (typeof generated === "string" && generated) {
              console.log(`Generated prompt for "${style}":`, generated);
              cachedPrompt = generated;
              // Update cache for future use
              updatePhotographyStylesCache({ title: style, prompt: generated });
            }
          } catch (err) {
            console.error(`Failed to generate prompt for style "${style}":`, err);
          }
        }

        if (cachedPrompt) {
          finalPrompt = `${cachedPrompt}，${prompt || ""}`;
        } else {
          // Fallback: use style title itself
          finalPrompt = `请以“${style}”为主题，对这张照片进行处理。${prompt || ""}`;
        }
      }
    }

    if (!image || (!finalPrompt && !style)) {
      return createErrorResponse(400, "No image or prompt provided");
    }

    const systemInstruction = `【重要提示：保持人物面部特征、五官身份完全不变】
${finalPrompt}`;

    const payload = {
      model: "nano-banana-pro",
      prompt: systemInstruction,
      urls: images, 
      aspectRatio: "auto",
      imageSize: "2K",
      stream: stream,
    };

    return streamImageGeneration(context, "/v1/draw/nano-banana", payload);

  } catch (error: any) {
    console.error("Edit API Error:", error);
    return createErrorResponse(500, error.message || "修图喵出错了，稍后再试喵~");
  }
}
