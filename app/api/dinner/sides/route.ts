import { clean, errorResponse } from "@/lib/dinner/api";
import { recommendSides } from "@/lib/dinner/recommend";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    request?: unknown;
    main?: unknown;
  };
  const request = clean(body.request, 1000);
  const main = clean(body.main, 100);
  if (!request || !main) {
    return Response.json({ error: "入力が空です" }, { status: 400 });
  }
  try {
    return Response.json(await recommendSides(request, main));
  } catch (e) {
    return errorResponse(e);
  }
}
