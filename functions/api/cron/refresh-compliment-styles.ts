import { refreshStyles } from "../../services/photography";

export async function onRequest(context: any) {
    console.log("Scheduled Refresh: Starting...");
    try {
        await refreshStyles(context);
        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (e: any) {
        console.error("Scheduled Refresh Failed:", e);
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
}
