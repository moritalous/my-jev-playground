import { APIUserAbortError } from "@typesafe-ai/sdk";
import { catalog } from "@/lib/car-picker/catalog";
import {
  type ClassifyResult,
  classifyWithJev,
  jevEnabled,
} from "@/lib/car-picker/jev";
import { classifyOffline } from "@/lib/car-picker/offline";
import { evaluate } from "@/lib/car-picker/recommend";
import type { JevTrace } from "@/lib/common/jev-trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function classify(
  text: string,
  mode: string,
  signal: AbortSignal,
): Promise<{ result: ClassifyResult; jev: JevTrace[] }> {
  if (mode === "offline" || !jevEnabled())
    return { result: classifyOffline(text), jev: [] };
  const out = await classifyWithJev(text, signal);
  const r = out.result;
  console.info(
    `[jev] ${r.model} ${r.latencyMs}ms ${r.questionCount}q in=${r.usage?.input_tokens} "${text.slice(0, 40)}"`,
  );
  return out;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    text?: string;
    mode?: string;
  } | null;
  const text = body?.text?.trim() ?? "";
  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const { result: c, jev } = await classify(
      text,
      body?.mode ?? "jev",
      req.signal,
    );
    const ev = evaluate(c.answers, c.source, catalog);
    return Response.json({ text, classify: c, ...ev, jev });
  } catch (err) {
    if (err instanceof APIUserAbortError || req.signal.aborted) {
      return new Response(null, { status: 499 });
    }
    console.warn("[jev] failed:", err);
    const c = classifyOffline(text);
    return Response.json({
      text,
      classify: c,
      fallbackReason: String(err),
      ...evaluate(c.answers, c.source, catalog),
      jev: [] as JevTrace[],
    });
  }
}
