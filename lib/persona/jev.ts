import { noul, type Questions, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { getVercelOidcToken } from "@vercel/oidc";
import { tracedSystemOne } from "@/lib/common/jev-trace";
import {
  type Judgement,
  type JudgeResponse,
  LEVELS,
  levelTextOf,
  MAX_SCORE,
  panelists,
  zoneOf,
} from "./panel";

const ASK_INVESTMENT = true;

const TIMEOUT_MS = 30_000;

const SCORE_PROMPT =
  "次の人物は、この新規事業のアイデアにどの程度興味を持つか。人物の経歴・価値観・関心領域に照らして判断すること。";
const INVEST_PROMPT = "次の人物は、この新規事業に自分の資金を出すか。";

function buildQuestions(): Questions {
  const questions: Questions = {};

  for (const p of panelists) {
    const person = {
      名前: p.name,
      紹介: p.profile,
      関心領域: p.interests,
    };

    questions[p.id] = score({ 問い: SCORE_PROMPT, 人物: person }, LEVELS);

    if (ASK_INVESTMENT) {
      questions[`${p.id}__invest`] = noul({
        問い: INVEST_PROMPT,
        人物: { 名前: p.name, 紹介: p.profile },
      });
    }
  }

  return questions;
}

const GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/typesafe";

const GATEWAY_MODEL = "typesafe-ai/jev";

type Credentials = {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
};

function gatewayCredentials(apiKey: string): Credentials {
  return {
    apiKey,
    baseURL: GATEWAY_BASE_URL,
    defaultModel: process.env.TYPESAFE_DEFAULT_MODEL?.trim() || GATEWAY_MODEL,
  };
}

function mayHaveOidc(): boolean {
  return Boolean(
    process.env.VERCEL ??
      process.env.VERCEL_ENV ??
      process.env.VERCEL_OIDC_TOKEN,
  );
}

async function credentials(): Promise<Credentials | null> {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (gatewayKey) return gatewayCredentials(gatewayKey);

  const directKey = process.env.TYPESAFE_API_KEY?.trim();
  if (directKey) return { apiKey: directKey };

  if (mayHaveOidc()) {
    try {
      const token = await getVercelOidcToken({
        expirationBufferMs: 5 * 60 * 1000,
      });
      if (token) return gatewayCredentials(token);
    } catch (error) {
      console.warn("[judge] OIDC トークンを取得できませんでした:", error);
    }
  }

  return null;
}

export async function judge(idea: string): Promise<JudgeResponse> {
  const creds = await credentials();
  if (!creds) return mockJudge(idea);

  const client = new TypeSafeClient({ ...creds, timeout: TIMEOUT_MS });
  const questions = buildQuestions();
  const startedAt = Date.now();

  const { result, trace } = await tracedSystemOne(
    client,
    "パネル (1/1)",
    {
      state: { 新規事業のアイデア: idea },
      questions,
    },
    { timeout: TIMEOUT_MS },
  );

  const results: Judgement[] = panelists.map((p) => {
    const answer = result.answers[p.id];
    if (answer?.type !== "score") {
      throw new Error(`パネリスト ${p.id} の score 応答が得られませんでした`);
    }

    const investAnswer = result.answers[`${p.id}__invest`];
    const invest = investAnswer?.type === "noul" ? investAnswer.noul : null;

    const probabilities = Array.from({ length: LEVELS.length }, (_, i) => {
      const value = (answer.probabilities as Record<string, number>)[String(i)];
      return typeof value === "number" ? value : 0;
    });

    return {
      id: p.id,
      score: answer.score,
      confidence: answer.confidence,
      levelText: levelTextOf(answer.score),
      probabilities,
      invest,
      zone: zoneOf(answer.score),
    };
  });

  return {
    results,
    model: result.model,
    usage: result.usage,
    mock: false,
    elapsedMs: Date.now() - startedAt,
    questionCount: Object.keys(questions).length,
    jev: [trace],
  };
}

function seededHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function mockJudge(idea: string): JudgeResponse {
  const startedAt = Date.now();

  const results: Judgement[] = panelists.map((p) => {
    const hits = p.interests.filter((interest) =>
      idea.includes(interest.slice(0, 3)),
    ).length;
    const noise = seededHash(p.id + idea);
    const raw = 0.6 + hits * 1.1 + noise * 2.6;
    const value = Math.min(MAX_SCORE, Math.max(0, raw));

    const weights = LEVELS.map((_, i) => Math.exp(-((i - value) ** 2) / 0.9));
    const total = weights.reduce((a, b) => a + b, 0);
    const probabilities = weights.map((w) => w / total);

    return {
      id: p.id,
      score: value,
      confidence: Math.max(...probabilities),
      levelText: levelTextOf(value),
      probabilities,
      invest: Math.min(1, Math.max(0, value / MAX_SCORE - 0.15 + noise * 0.2)),
      zone: zoneOf(value),
    };
  });

  return {
    results,
    model: "mock",
    usage: null,
    mock: true,
    elapsedMs: Date.now() - startedAt,
    questionCount: ASK_INVESTMENT ? panelists.length * 2 : panelists.length,
    jev: [],
  };
}
