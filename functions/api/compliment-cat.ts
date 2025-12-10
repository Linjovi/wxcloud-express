import { GoogleGenAI, Type, Schema } from "@google/genai";
import { safeParseJSON } from "../utils";

const complimentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    compliment: {
      type: Type.STRING,
      description: "一段中文的、夸张、肉麻、可爱又充满创意的彩虹屁夸奖。必须包含猫咪语气词（如“喵~”、“捏~”），可以使用比喻、拟人或网络热梗。",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5个有趣的中文标签（例如：'绝世美颜', '焦糖色小猪', '眼神杀', '想吸一口'）。",
    },
    score: {
      type: Type.INTEGER,
      description: "萌力值，范围 90-100（所有猫猫都是完美的）。",
    },
    catBreed: {
      type: Type.STRING,
      description: "如果照片是人，就说他/她长得像什么品种的猫（例如：'高贵的布偶猫', '聪明的狸花猫'）。如果照片是猫，就识别它的品种，或者给它起个有趣的品种名（例如：'中华田园小脑斧'）。",
    },
    pickupLine: {
      type: Type.STRING,
      description: "一句猫猫想对用户说的俏皮话、土味情话或者搭讪语（例如：'想用小鱼干来交换你的联系方式喵~', '今晚可以去你家抓老鼠吗？'）。",
    },
  },
  required: ["compliment", "tags", "score", "catBreed", "pickupLine"],
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
角色：你是“夸夸喵”(KuaKua Meow)，一只专业吹“彩虹屁”的猫咪，也是猫界首席鉴赏官。

任务：
1. 仔细观察用户上传的照片（**注意：用户通常会上传自己的照片，而不是猫的照片**）。
2. 用**中文**生成一段夸张、肉麻、可爱又充满创意的“彩虹屁”夸奖。
3. **关键要求**：
   - **判断主体**：首先判断照片主体是否为**人类**。
   - **拒绝平庸**：不要只说“可爱”、“好看”。要用比喻、拟人、网络热梗！
   - **细节控**：必须提到照片里的具体细节（如发型、穿搭、眼神、动作）。
   - **猫咪口癖**：句尾要自然地加上“喵~”、“捏~”、“哇呜~”等语气词。
   - **趣味性**：
     - **catBreed (猫系长相)**：
       - **如果是人类**：仔细观察人物的气质和五官，判断他/她最像哪种猫咪（例如：高冷像暹罗，慵懒像加菲，优雅像布偶，活泼像橘猫），并给出简短理由。
       - **如果不是人类**（如猫、狗、物品等）：**必须返回空字符串 ""**。
     - **pickupLine (土味情话)**：
       - **如果是人类**：以猫咪的视角，对用户说一句撩人的土味情话（例如：“想用小鱼干来交换你的联系方式喵~”，“今晚可以去你家抓老鼠吗？”，“你的眼睛比猫罐头还诱人”）。
       - **如果不是人类**：**必须返回空字符串 ""**。
     - **compliment (主夸奖)**：一段100字左右的彩虹屁。如果是人，重点夸赞颜值和气质；如果不是人，就夸赞它的可爱、精致或独特之处。

输出要求：
返回严格的 JSON 格式。
`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [
            { text: "快看这张照片！狠狠地夸它！" },
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
        temperature: 0.85,
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
        compliment: "喵呜！这张照片太美了，本喵的系统都被美晕了，无法组织语言！(解析错误)",
        tags: ["美晕了", "无法言喻"],
        score: 100,
        catBreed: "来自喵星的神秘物种",
        pickupLine: "不管你是谁，本喵都想和你回家！"
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
