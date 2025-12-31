import { pollImageGenerationResult } from "../../services/image-generation";

export async function onRequestGet(context: any) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  return pollImageGenerationResult(context, id);
}
