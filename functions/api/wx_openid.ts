export async function onRequestGet(context: any) {
  const req = context.request;
  const headers = req.headers;
  
  const wxSource = headers.get("x-wx-source");
  const wxOpenId = headers.get("x-wx-openid");

  if (wxSource) {
    return new Response(wxOpenId || "", { status: 200 });
  } else {
    // This endpoint depends on WeChat Cloud Run headers which might not exist on Cloudflare.
    // You might need to implement jscode2session here with AppID and Secret if moving away from WX Cloud.
    return new Response("Missing x-wx-source header", { status: 400 });
  }
}

