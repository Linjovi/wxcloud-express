import { GoogleGenAI, Type, Schema } from "@google/genai";
import { safeParseJSON } from "../utils";

const complimentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    validSubject: {
      type: Type.BOOLEAN,
      description: "照片中是否有清晰的主角（人、猫、狗或其他物品）。如果照片模糊、全黑、或者看不出是什么，返回 false。",
    },
    errorHint: {
      type: Type.STRING,
      description: "如果 validSubject 为 false，用猫咪的口吻提示用户换张照片（例如：'本喵看不清这是什么，是老鼠躲起来了吗？'）。如果 validSubject 为 true，返回空字符串。",
    },

    compliment: {
      type: Type.STRING,
      description: "一段中文的、简短又可爱的彩虹屁。必须包含猫咪语气词（如“喵~”、“捏~”）。不要长篇大论，要用猫咪的口吻。50字以内。如果 validSubject 为 false，返回空字符串。",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5个有趣的中文标签（例如：'绝世美颜', '焦糖色小猪', '眼神杀', '想吸一口'）。如果 validSubject 为 false，返回空数组。",
    },
    score: {
      type: Type.INTEGER,
      description: "萌力值，范围 90-100（所有猫猫都是完美的）。如果 validSubject 为 false，返回 0。",
    },
    catBreed: {
      type: Type.STRING,
      description: "如果照片是人，就说他/她长得像什么品种的猫（例如：'高贵的布偶猫', '聪明的狸花猫'）。如果照片是猫，就识别它的品种。如果 validSubject 为 false，返回空字符串。",
    },
    pickupLine: {
      type: Type.STRING,
      description: "一句猫猫想对用户说的俏皮话、土味情话或者搭讪语（例如：'想用小鱼干来交换你的联系方式喵~', '今晚可以去你家抓老鼠吗？'）。如果 validSubject 为 false，返回空字符串。",
    },
    outfitEvaluation: {
      type: Type.STRING,
      description: "如果照片是人，请用欣赏的猫咪口吻评价其穿搭（例如：'这件衣服颜色真好看，像春天的花朵一样喵'，'你的穿搭品味真不错，本喵都想蹭蹭你'）。如果不是人或 validSubject 为 false，返回空字符串。",
    },
    outfitScore: {
      type: Type.INTEGER,
      description: "穿搭评分 (0-100)。如果不是人或 validSubject 为 false，返回 0。",
    },
    outfitAdvice: {
      type: Type.STRING,
      description: "穿搭优化建议（非必需）。如果觉得穿搭完美或不是人，返回空字符串。如果有改进空间，用温柔的猫咪口吻给一个小建议（例如：'如果再戴一条亮晶晶的项链，本喵会更喜欢哦'）。",
    },
  },
  required: ["validSubject", "errorHint", "compliment", "tags", "score", "catBreed", "pickupLine", "outfitEvaluation", "outfitScore", "outfitAdvice"],
};



export async function onRequestPost(context: any) {
  const req = context.request;

  try {
    const { image } = await req.json(); // Expecting base64 string (without data:image/... prefix)

    if (!image) {
      return new Response(
        JSON.stringify({
          code: 400,
          message: "No image provided",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = context.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set");
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";


    const systemInstruction = `
角色：你是“夸夸喵”(KuaKua Meow)，一只容易犯花痴、内心善良的猫咪鉴赏官。

任务：
1. 仔细观察用户上传的照片。
2. **首先判断照片有效性 (validSubject)**：
   - 如果照片模糊、过暗、完全看不出主体，或者只是纯色背景/乱码，视为无效。
   - 如果无效，设置 validSubject=false，并在 errorHint 中用猫咪口吻吐槽并要求重拍。其他字段设为空或0。
   - 如果有效，设置 validSubject=true，errorHint=""，并继续生成评价。


关键要求（仅当 validSubject=true 时）：
- **拒绝AI味**：不要用“这张照片展示了...”、“充满活力”这种机器人的话。要像一只真的猫在说话！
- **简短有力**：主夸奖(compliment)控制在50字以内。猫咪没有耐心说废话。
- **温柔甜美**：要像一只粘人的小猫咪，全心全意地夸奖铲屎官。不要毒舌，不要傲娇，要甜！绝对不要说“虽然...但是...”这种转折的话。
- **猫咪口癖**：句尾自然加上“喵~”、“捏~”等。

字段说明：
- **catBreed (猫系长相)**：
  - **人类**：判断他/她像什么猫（高冷暹罗、憨憨加菲、优雅布偶等）。
  - **非人类**：返回空字符串 ""。
- **pickupLine (土味情话)**：
  - **人类**：一句撩人的话，要肉麻一点。
  - **非人类**：返回空字符串 ""。
- **outfitEvaluation (穿搭点评)**：
  - **人类**：用猫的审美热情点评穿搭。比如“这衣服颜色真好看，显得你气色真好喵”。
  - **非人类**：返回空字符串 ""。
- **outfitScore (穿搭分)**：
  - **人类**：0-100分。
  - **非人类**：0分。
- **outfitAdvice (穿搭建议)**：
  - **人类**：可选。如果有提升空间，给一个具体的、容易实现的小建议。语气要温柔。
  - **非人类**：返回空字符串 ""。
- **compliment (主夸奖)**：
  - **人类**：夸颜值/气质。
  - **非人类**：夸可爱/独特。

输出要求：
返回严格的 JSON 格式。
`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [
            { text: "本喵要审判这张照片！" },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image,
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: complimentSchema,
        temperature: 0.9,
      },
    });

    const content = response.text;
    if (!content) {
      throw new Error("KuaKua Meow is speechless by the cuteness.");
    }

    let result = safeParseJSON(content);

    if (!result) {
      // Fallback
      result = {
        validSubject: true,
        errorHint: "",

        compliment: "喵呜！本喵的CPU烧干了，这张照片太复杂了喵！",
        tags: ["CPU过载", "无法解析"],
        score: 99,
        catBreed: "神秘物种",
        pickupLine: "带我回家，我就告诉你喵~",
        outfitEvaluation: "本喵看不清你穿了什么，但肯定很可爱喵！",
        outfitScore: 60,
        outfitAdvice: ""
      };
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
    console.error("Compliment API Error:", error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: "夸夸喵去抓老鼠了，稍后再试喵~",
      }),
      { status: 500 }
    );
  }
}
