import "server-only";
import demo from "@/data/search-filter/demo.json";
import { type JevTrace, makeJevTrace } from "@/lib/common/jev-trace";

export type Product = {
  id: string;
  label: "E" | "S" | "C" | "I";
  title: string | null;
  brand: string | null;
  color: string | null;
  bullets: string | null;
  description: string | null;
};
export type Query = { query: string; products: Product[] };

export const queries = demo as Query[];

const API_URL = "https://api.typesafe.ai/v1/systemone";
export const MODEL = process.env.JEV_MODEL?.trim() || "jev-latest";
export const PRICE_PER_M_INPUT = 0.042;

export const getApiKey = () =>
  process.env.TYPESAFE_API_KEY?.trim() || undefined;

export const stateFor = (query: string) => ({ search_query: query });

export const MATCH_CRITERIA: Record<string, string> = {
  exact:
    "The product is the kind of item the shopper wants AND satisfies every condition in the query (type, size, capacity, color, compatible model, brand, etc.). If any condition is clearly not met, choose substitute instead.",
  substitute:
    "The same kind of item as the shopper wants, but at least one condition in the query is clearly different. If it is an accessory or part for the wanted item rather than the item itself, choose complement instead.",
  complement:
    "A different kind of item that is used together with what the shopper wants (accessory, part, consumable) and cannot replace it. If unrelated, choose irrelevant.",
  irrelevant:
    "Not the wanted item, not a substitute, and not something used together with it.",
};

const MATCH_QUESTION =
  "A shopper typed `search_query` into an online store. How does the product described in `candidate` relate to what the shopper is looking for?";

export const MATCH_OPTIONS = Object.keys(MATCH_CRITERIA);

export const MAX_PER_REQUEST = 50;

export const questionFor = (p: Product) => ({
  type: "choice",
  instructions: {
    question: MATCH_QUESTION,
    candidate: { title: p.title ?? "" },
  },
  criteria: MATCH_CRITERIA,
});

export const questionsFor = (products: Product[], offset = 0) =>
  Object.fromEntries(
    products.map((p, i) => [`p${offset + i}`, questionFor(p)]),
  );

type JevResponse = {
  model: string;
  // biome-ignore lint/suspicious/noExplicitAny: answer shape differs per question
  answers: Record<string, any>;
  usage: { input_tokens: number; output_tokens: number };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function askJev(
  apiKey: string,
  state: unknown,
  questions: unknown,
): Promise<JevResponse> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, state, questions }),
      cache: "no-store",
    });
    if ((res.status === 429 || res.status === 529) && attempt < 4) {
      await sleep(500 * 2 ** attempt);
      continue;
    }
    if (!res.ok) throw new Error(`Jev ${res.status}: ${await res.text()}`);
    return (await res.json()) as JevResponse;
  }
}

export type JudgeResult = {
  answers: Record<
    number,
    {
      choice: string;
      confidence: number;
      probabilities: Record<string, number>;
    }
  >;
  stats: {
    model: string;
    requests: number;
    questions: number;
    inputTokens: number;
    ms: number;
    costUsd: number;
  };
  jev: JevTrace[];
};

export async function judgeQuery(
  apiKey: string,
  q: Query,
): Promise<JudgeResult> {
  const t0 = performance.now();
  const state = stateFor(q.query);
  const chunks: [number, Product[]][] = [];
  for (let o = 0; o < q.products.length; o += MAX_PER_REQUEST)
    chunks.push([o, q.products.slice(o, o + MAX_PER_REQUEST)]);
  const traced = await Promise.all(
    chunks.map(async ([o, ps], i) => {
      const questions = questionsFor(ps, o);
      const started = performance.now();
      const r = await askJev(apiKey, state, questions);
      const label =
        chunks.length > 1 ? `判定 (${i + 1}/${chunks.length})` : "判定";
      const trace = makeJevTrace(
        label,
        { model: MODEL, state, questions },
        r,
        performance.now() - started,
      );
      return { r, trace };
    }),
  );
  const rs = traced.map((x) => x.r);
  const answers: JudgeResult["answers"] = {};
  let inputTokens = 0;
  for (const r of rs) {
    inputTokens += r.usage.input_tokens;
    for (const [id, a] of Object.entries(r.answers))
      answers[Number(id.slice(1))] = a;
  }
  return {
    answers,
    stats: {
      model: rs[0]?.model ?? MODEL,
      requests: rs.length,
      questions: q.products.length,
      inputTokens,
      ms: Math.round(performance.now() - t0),
      costUsd: (inputTokens / 1e6) * PRICE_PER_M_INPUT,
    },
    jev: traced.map((x) => x.trace),
  };
}
