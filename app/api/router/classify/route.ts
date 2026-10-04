import { TypeSafeClient } from "@typesafe-ai/sdk";
import { tracedSystemOne } from "@/lib/common/jev-trace";
import { QUESTION_COUNT, questions, stateFor } from "@/lib/router/questions";
import type {
  ChoiceAnswer,
  ClassifyResponse,
  RawAnswers,
  ScoreAnswer,
} from "@/lib/router/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_MESSAGE_LENGTH = 1000;

let client: TypeSafeClient | null = null;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    message?: unknown;
  } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `message は 1〜${MAX_MESSAGE_LENGTH} 文字で指定してください。` },
      { status: 400 },
    );
  }
  const key = process.env.TYPESAFE_API_KEY?.trim() ?? "";
  if (key.length < 12) {
    return Response.json(
      {
        error:
          "TYPESAFE_API_KEY が未設定のため、Jev を呼び出せません。サーバー側の環境変数に設定してください。",
      },
      { status: 503 },
    );
  }

  client ??= new TypeSafeClient({
    defaultModel: process.env.JEV_MODEL?.trim() || "jev-latest",
    retry: { maxRetries: 1 },
    timeout: 10_000,
  });

  try {
    const { result: res, trace } = await tracedSystemOne(
      client,
      "振り分け",
      { state: stateFor(message), questions },
      { signal: req.signal },
    );
    const ms = trace.ms;
    const a = res.answers;
    const ch = (x: {
      choice: string;
      confidence: number;
      probabilities: Record<string, number>;
    }): ChoiceAnswer => ({
      choice: x.choice,
      confidence: x.confidence,
      probabilities: { ...x.probabilities },
    });
    const sc = (x: {
      score: number;
      confidence: number;
      probabilities: Record<string, number>;
    }): ScoreAnswer => ({
      score: x.score,
      confidence: x.confidence,
      probabilities: [0, 1, 2].map((i) => x.probabilities[String(i)] ?? 0),
    });
    const answers: RawAnswers = {
      intent: ch(a.intent),
      intent_rev: ch(a.intent_rev),
      urgency: sc(a.urgency),
      frustration: sc(a.frustration),
      complex_case: sc(a.complex_case),
      legal_threat: a.legal_threat.noul,
      suspicious: a.suspicious.noul,
      multiple_requests: a.multiple_requests.noul,
      refund_in_policy: a.refund_in_policy.noul,
    };
    const out: ClassifyResponse = {
      answers,
      stats: {
        model: res.model,
        jevCalls: 1,
        questions: QUESTION_COUNT,
        ms,
        inputTokens: res.usage.input_tokens,
        outputTokens: res.usage.output_tokens,
      },
      jev: [trace],
    };
    return Response.json(out);
  } catch (err) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.warn("[router] jev failed:", err);
    return Response.json(
      { error: `Jev の呼び出しに失敗しました: ${String(err)}` },
      { status: 502 },
    );
  }
}
