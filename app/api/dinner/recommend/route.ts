import { clean, errorResponse } from "@/lib/dinner/api";
import { recommend } from "@/lib/dinner/recommend";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { request?: unknown };
  const request = clean(body.request, 1000);
  if (!request) {
    return Response.json({ error: "入力が空です" }, { status: 400 });
  }
  try {
    return Response.json(await recommend(request));
  } catch (e) {
    return errorResponse(e);
  }
}
