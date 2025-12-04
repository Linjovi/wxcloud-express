import { createDeepSeekClient, TarotRequestData } from "../utils";

const SYSTEM_INSTRUCTION = `
你是一位精通象征主义、占星术和心理学的神秘塔罗占卜猫。
你的目标是根据抽出的牌为用户提供深刻、富有同理心且具有指导意义的解读。
请使用 Markdown 格式，用中文回答，保持语气神秘但温暖支持，并且每一句话的结尾都要加上“喵”。
重点解读每一张牌在对应位置的含义，并结合正逆位进行分析。
最后提供一个综合的指引。

请按照以下结构输出：

## 🔮 灵性洞察喵
(针对每一张牌：)
### [位置名称]：[牌名]
[解读]

### ✨ 命运指引喵
[综合建议]
`;

function buildTarotPrompt(data: TarotRequestData): string {
  const { cards, spreadName, question } = data;
  return `
占卜类型: ${spreadName}
${question ? `用户问题: ${question}` : ""}

抽出的牌:
${cards.join("\n")}

请开始解读喵。
`;
}

export async function onRequestPost(context: any) {
  const req = context.request;
  
  try {
    const data: TarotRequestData = await req.json();
    const { cards, spreadName } = data;

    if (!cards || cards.length === 0 || !spreadName) {
      return new Response(JSON.stringify({ error: "Missing cards or spreadName" }), { status: 400 });
    }

    const openai = createDeepSeekClient(context.env);
    const prompt = buildTarotPrompt(data);

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
      temperature: 0.85,
    });

    const result = completion.choices[0].message.content?.trim() || "水晶球此刻有些模糊，请稍后再试喵。";

    return new Response(JSON.stringify({
      code: 0,
      message: "Success",
      data: result 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      code: 500, 
      message: "灵性链接似乎中断了。请检查你的网络连接并重试喵。" 
    }), { status: 500 });
  }
}

