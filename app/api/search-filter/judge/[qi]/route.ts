import {
  getApiKey,
  judgeQuery,
  queries,
} from "@/lib/search-filter/search-filter";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ qi: string }> },
) {
  const { qi } = await ctx.params;
  const q = queries[Number(qi)];
  if (!q) return new Response("not found", { status: 404 });
  const apiKey = getApiKey();
  if (!apiKey) {
    return new Response("TYPESAFE_API_KEY が未設定です", { status: 503 });
  }
  try {
    return Response.json(await judgeQuery(apiKey, q), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return new Response(String(e), { status: 502 });
  }
}
