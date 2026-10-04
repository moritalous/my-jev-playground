import {
  type Answers,
  confirmField,
  FIELD_KEYS,
} from "@/lib/car-picker/answers";
import { catalog } from "@/lib/car-picker/catalog";
import { evaluate } from "@/lib/car-picker/recommend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    answers?: Answers;
    source?: "jev" | "offline";
    overrides?: Record<string, string>;
    weightMul?: Record<string, number>;
  } | null;
  if (!body?.answers?.bodyType || !body.answers.tags) {
    return Response.json({ error: "answers is required" }, { status: 400 });
  }
  let answers = body.answers;
  for (const [field, value] of Object.entries(body.overrides ?? {}))
    if ((FIELD_KEYS as string[]).includes(field))
      answers = confirmField(
        answers,
        field as (typeof FIELD_KEYS)[number],
        value,
      );
  const weightMul = Object.fromEntries(
    Object.entries(body.weightMul ?? {}).filter(
      ([, v]) => typeof v === "number" && v >= 0 && v <= 3,
    ),
  );
  const ev = evaluate(answers, body.source ?? "jev", catalog, weightMul);
  return Response.json({ answers, jevCalls: 0, ...ev, jev: [] });
}
