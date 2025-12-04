import { getCatJudgement } from "../../functions/utils"; // Cyclic dependency issue if not careful, but we'll implement logic inline or separate
import { createDeepSeekClient, JudgementData } from "../utils";

export async function onRequestPost(context: any) {
  const req = context.request;
  
  try {
    const data: JudgementData = await req.json();
    const { nameA, nameB, cause, sideA, sideB } = data;

    if (!nameA || !nameB || !cause) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
    }

    const openai = createDeepSeekClient(context.env);

    const prompt = `
Role: You are a Fair but extremely Cute Anime Cat Judge (猫猫法官). 
Your goal is to judge a case between two parties.

Case Details:
- Party A: ${nameA} ${sideA ? `(${sideA})` : ""}
- Party B: ${nameB} ${sideB ? `(${sideB})` : ""}
- Cause of Dispute: ${cause}

Output Format (JSON Only):
{
  "verdict": "string (The final verdict)",
  "winner": "string (Name of the winner, or 'Draw')",
  "comment": "string (Cute commentary with 'meow'/'喵')",
  "scores": { "${nameA}": number, "${nameB}": number }
}
`;

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a cute cat judge. Speak Chinese. Respond in JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content?.trim() || "{}";
    // Simple cleanup for markdown code blocks
    const jsonStr = content.replace(/^```json\s*/, "").replace(/```$/, "");
    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ 
      code: 0, 
      data: result, 
      message: "Success" 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ code: 500, message: e.message }), { status: 500 });
  }
}

