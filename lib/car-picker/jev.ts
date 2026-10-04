import { TypeSafeClient } from "@typesafe-ai/sdk";
import { type JevTrace, tracedSystemOne } from "@/lib/common/jev-trace";
import {
  type Answers,
  buildTags,
  type ClassifyResult,
  FIELD_VALUES,
  makeChoice,
  type ScoreAnswer,
} from "./answers";
import { ASKED_TAG_KEYS, QUESTION_COUNT, questions } from "./questions";

export type {
  Answers,
  ChoiceAnswer,
  ClassifyResult,
  ScoreAnswer,
} from "./answers";

let client: TypeSafeClient | null = null;

export function jevEnabled(): boolean {
  const key = process.env.TYPESAFE_API_KEY?.trim() ?? "";
  return key.length >= 12 && process.env.FORCE_OFFLINE !== "true";
}

type Choice = {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};
type Score = {
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
};

export async function classifyWithJev(
  text: string,
  signal?: AbortSignal,
): Promise<{ result: ClassifyResult; jev: JevTrace[] }> {
  client ??= new TypeSafeClient({
    defaultModel: process.env.JEV_MODEL || "jev-latest",
    retry: { maxRetries: 1 },
    timeout: 4_000,
  });
  const { result: res, trace } = await tracedSystemOne(
    client,
    "判定",
    { state: { request: text }, questions },
    { signal },
  );
  const latencyMs = trace.ms;
  const a = res.answers as unknown as Record<string, any>;

  const field = <K extends keyof typeof FIELD_VALUES>(k: K) =>
    makeChoice(
      FIELD_VALUES[k] as readonly string[],
      a[`${k}_stated`].noul,
      (a[k] as Choice).probabilities,
      (a[k] as Choice).confidence,
    );

  const b1 = a.bodyType as Choice;
  const b2 = a.bodyType_reversed as Choice;
  const bodyValues = FIELD_VALUES.bodyType;
  const avg = Object.fromEntries(
    bodyValues.map((v) => [
      v,
      ((b1.probabilities[v] ?? 0) + (b2.probabilities[v] ?? 0)) / 2,
    ]),
  );
  const bodyType = makeChoice(
    bodyValues,
    a.bodyType_stated.noul,
    avg,
    Math.min(b1.confidence, b2.confidence),
    { orderDisagree: b1.choice !== b2.choice },
  );

  const sc = (r: Score): ScoreAnswer => ({
    score: r.score,
    confidence: r.confidence,
    probabilities: { ...r.probabilities },
  });
  const safety = sc(a.safety);
  const answers: Answers = {
    bodyType,
    partySize: field("partySize") as Answers["partySize"],
    color: field("color") as Answers["color"],
    fuel: field("fuel") as Answers["fuel"],
    gradePref: field("gradePref") as Answers["gradePref"],
    budget: sc(a.budget),
    safety,
    kidsOnBoard: a.kidsOnBoard.noul,
    slideDoor: a.slideDoor.noul,
    awd: a.awd.noul,
    tags: buildTags(
      Object.fromEntries(
        ASKED_TAG_KEYS.map((t) => [t, a[`opt_${t}`].noul as number]),
      ) as Record<(typeof ASKED_TAG_KEYS)[number], number>,
      safety,
      a.kidsOnBoard.noul,
      a.awd.noul,
    ),
  };
  const result: ClassifyResult = {
    answers,
    source: "jev",
    model: res.model,
    latencyMs,
    questionCount: QUESTION_COUNT,
    jevCalls: 1,
    usage: res.usage,
  };
  return { result, jev: [trace] };
}
