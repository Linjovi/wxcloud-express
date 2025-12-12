import { GoogleGenAI, Type, Schema } from "@google/genai";
import { safeParseJSON, getComplimentStylePrompt } from "../utils";

const editSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    base64Image: {
      type: Type.STRING,
      description: " The edited image encoded in Base64 (without data prefix). If unable to edit, return null.",
    },
    error: {
      type: Type.STRING,
      description: "Error message if editing failed.",
    },
  },
  required: ["base64Image"],
};

export async function onRequestPost(context: any) {
  const req = context.request;

  try {
    const { image, prompt, mimeType, outputSize, style } = await req.json();

    let finalPrompt = prompt;
    if (style) {
      const cachedPrompt = getComplimentStylePrompt(style);
      if (cachedPrompt) {
        finalPrompt = `${cachedPrompt}，${prompt || ""}`;
      } else {
        // Fallback: use style title itself
        finalPrompt = `请参考“${style}”的风格，对这张照片进行风格化调整。${prompt || ""}`;
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

    const apiKey = context.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set");
    }

    const ai = new GoogleGenAI({ apiKey });
    // User requested "Gemini 2.5 Flash Image"
    const modelId = "gemini-3-pro-image-preview";

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

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [
            { text: `Instruction: ${finalPrompt}` },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: image,
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: editSchema,
        imageConfig: {
          imageSize: outputSize || "2K"
        }
      },
    });
    let result: any = {};

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response?.candidates?.[0]?.content?.parts) {
        if (part.inlineData && part.inlineData.data) {
          result.base64Image = part.inlineData.data;
        } else if (part.text) {
          try {
            const parsed = safeParseJSON(part.text);
            if (parsed && parsed.base64Image) {
              result = parsed;
            }
          } catch (e) {
            // Ignore parse error
          }
        }
      }
    }

    if (!result.base64Image) {
      console.error("Model did not return image bytes.");
      throw new Error("修图失败，喵喵尽力了但没法直接生成图片数据喵~");
    }

    return new Response(
      JSON.stringify({
        code: 0,
        message: "Success",
        data: result,
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
