import { getMaoyanWebHeat } from "../utils";

export async function onRequestGet() {
  try {
    const list = await getMaoyanWebHeat();
    return new Response(JSON.stringify({
      code: 0,
      message: "Success",
      data: {
        list,
        count: list.length,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ code: 500, message: e.message }), { status: 500 });
  }
}

