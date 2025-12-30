export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ code: 400, message: "缺少 id 参数" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = env.GRSAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ code: 500, message: "服务端配置错误" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const baseUrl = env.GRSAI_BASE_URL || "https://api.grsai.com";
    const upstreamUrl = `${baseUrl}/v1/draw/result`;

    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upstream API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    
    // 转发响应
    return new Response(JSON.stringify({ code: 0, data: data, msg: "success" }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Meme Result API Error:", error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: error.message || "查询任务出错了，稍后再试喵~",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
