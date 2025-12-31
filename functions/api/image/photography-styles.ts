import {
  getStoredPhotographyStyles,
  refreshStyles,
} from "../../services/photography";

export async function onRequestGet(context: any) {
  try {
    // 1. Try to get from Cache (Memory or D1)
    const cachedStyles = await getStoredPhotographyStyles(context);

    if (cachedStyles && cachedStyles.length > 0) {
      return new Response(
        JSON.stringify({
          code: 0,
          message: "Success (Cached)",
          data: cachedStyles.map((s) => ({
            title: s.title,
            source: s.source,
            prompt: s.prompt, // Include prompt in response
          })),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Fallback: If no cache (first run or missing in D1), refresh immediately
    try {
      console.log("No cache found, performing immediate refresh...");
      const freshStyles = await refreshStyles(context);

      if (freshStyles && freshStyles.length > 0) {
        return new Response(
          JSON.stringify({
            code: 0,
            message: "Success (Fresh)",
            data: freshStyles.map((s) => ({
              title: s.title,
              source: s.source,
              prompt: s.prompt, // Include prompt in response
            })),
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (err) {
      console.error("Immediate refresh failed:", err);
    }

    // 3. Final Fallback if refresh fails
    return new Response(
      JSON.stringify({
        code: 0,
        message: "No styles available yet",
        data: [],
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ code: 500, message: e.message }), {
      status: 500,
    });
  }
}
