import { getComplimentStylesCache, refreshStyles } from "../utils";

export async function onRequestGet(context: any) {
  try {
    const cachedStyles = getComplimentStylesCache();
    
    // Always return cached styles (even if empty/stale, to ensure speed)
    // The cron job is responsible for keeping this fresh.
    if (cachedStyles) {
      return new Response(
        JSON.stringify({
          code: 0,
          message: "Success (Cached)",
          data: cachedStyles.map((s) => ({
            title: s.title,
            source: (s as any).source,
          })),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Fallback: If no cache, perform an immediate refresh
    // This ensures first users don't get empty data if the cron hasn't run yet
    try {
        console.log("No cache found, performing immediate refresh...");
        await refreshStyles(context);
        
        // Fetch the newly populated cache
        const freshStyles = getComplimentStylesCache();
        
        if (freshStyles) {
             return new Response(
                JSON.stringify({
                  code: 0,
                  message: "Success (Fresh)",
                  data: freshStyles.map((s) => ({
                    title: s.title,
                    source: (s as any).source,
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
    
    // Final Fallback if refresh fails
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

