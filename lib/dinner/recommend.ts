import { type Question, TypeSafeClient } from "@typesafe-ai/sdk";
import notesData from "@/data/dinner/dish-notes.json";
import { tracedSystemOne } from "@/lib/common/jev-trace";
import { MAINS, SIDES, SOUPS } from "./menus";
import type {
  DishResult,
  MainRecommendation,
  SideRecommendation,
  Stats,
} from "./types";

const MODEL = "jev-latest";
const SHOW_MAIN = 12;
const SHOW_SIDE = 8;

const notes: Record<string, string> = notesData;

export class MissingApiKeyError extends Error {
  constructor() {
    super("TYPESAFE_API_KEY が設定されていません");
  }
}

let cached: TypeSafeClient | undefined;
function getClient(): TypeSafeClient {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) throw new MissingApiKeyError();
  cached ??= new TypeSafeClient({ apiKey });
  return cached;
}

async function askPerDish(
  label: string,
  state: Record<string, string>,
  question: string,
  dishes: readonly string[],
) {
  const questions: Record<string, Question> = {};
  dishes.forEach((name, i) => {
    questions[`d${i}`] = {
      type: "noul",
      instructions: { question, candidate: name },
    };
  });
  const { result: res, trace } = await tracedSystemOne(getClient(), label, {
    model: MODEL,
    state,
    questions,
  });
  const stats: Stats = {
    requests: 1,
    questions: dishes.length,
    input_tokens: res.usage.input_tokens,
    output_tokens: res.usage.output_tokens,
    ms: trace.ms,
  };
  const ranked: DishResult[] = dishes
    .map((name, i) => {
      const a = res.answers[`d${i}`];
      return {
        menu: name,
        desc: notes[name] ?? "",
        p: a?.type === "noul" ? a.noul : 0,
      };
    })
    .sort((a, b) => b.p - a.p);
  return { ranked, stats, model: res.model, jev: [trace] };
}

export async function recommend(request: string): Promise<MainRecommendation> {
  const { ranked, stats, model, jev } = await askPerDish(
    "主菜",
    {
      ユーザーの状況: request,
      あなたのタスク: "今夜の夜ご飯の献立（主菜）を決める",
    },
    "今日の夜ご飯に、`candidate` はふさわしいか？",
    MAINS,
  );
  return {
    request,
    items: ranked.slice(0, SHOW_MAIN),
    total: MAINS.length,
    model,
    stats,
    jev,
  };
}

export async function recommendSides(
  request: string,
  main: string,
): Promise<SideRecommendation> {
  const dishes = [...SIDES, ...SOUPS];
  const { ranked, stats, model, jev } = await askPerDish(
    "副菜・汁物",
    {
      ユーザーの状況: request,
      今夜の主菜: main,
      あなたのタスク: "今夜の主菜に合わせる副菜と汁物を決める",
    },
    "今夜の主菜（`今夜の主菜`）と一緒に出す副菜・汁物として、`candidate` はふさわしいか？",
    dishes,
  );
  const soups: readonly string[] = SOUPS;
  return {
    main,
    sides: ranked.filter((d) => !soups.includes(d.menu)).slice(0, SHOW_SIDE),
    soups: ranked.filter((d) => soups.includes(d.menu)).slice(0, SHOW_SIDE),
    total: dishes.length,
    model,
    stats,
    jev,
  };
}
