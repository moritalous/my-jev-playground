import type { ASKED_TAG_KEYS } from "./questions";
import type { Tag } from "./types";

export const FIELD_VALUES = {
  bodyType: ["compact", "sedan", "wagon", "suv", "minivan"],
  partySize: ["one_two", "three_four", "five", "six_plus"],
  color: ["red", "white", "black", "gray", "blue", "beige", "green", "yellow"],
  fuel: ["hybrid", "gasoline"],
  gradePref: ["top", "basic"],
} as const;
export type FieldKey = keyof typeof FIELD_VALUES;
export const FIELD_KEYS = Object.keys(FIELD_VALUES) as FieldKey[];
export const FIELD_LABELS: Record<FieldKey, string> = {
  bodyType: "ボディタイプ",
  partySize: "乗る人数",
  color: "ボディカラー",
  fuel: "燃料",
  gradePref: "グレード",
};
export const VALUE_LABELS: Record<string, string> = {
  compact: "コンパクト",
  sedan: "セダン",
  wagon: "ワゴン",
  suv: "SUV",
  minivan: "ミニバン",
  unspecified: "言及なし",
  one_two: "1〜2人",
  three_four: "3〜4人",
  five: "5人",
  six_plus: "6人以上",
  red: "赤",
  white: "白",
  black: "黒",
  gray: "グレー・シルバー",
  blue: "青",
  beige: "ベージュ",
  green: "カーキ・グリーン",
  yellow: "イエロー",
  hybrid: "ハイブリッド",
  gasoline: "ガソリン",
  top: "上位グレード",
  basic: "手頃なグレード",
};

export type ChoiceAnswer<T extends string = string> = {
  value: T | "unspecified";
  top: T;
  stated: number;
  confidence: number | null;
  raw: Record<T, number>;
  probabilities: Record<T | "unspecified", number>;
  orderDisagree?: boolean;
  confirmed?: boolean;
};
export type ScoreAnswer = {
  score: number;
  confidence: number | null;
  probabilities: Record<string, number>;
};

export type Answers = {
  bodyType: ChoiceAnswer<(typeof FIELD_VALUES.bodyType)[number]>;
  partySize: ChoiceAnswer<(typeof FIELD_VALUES.partySize)[number]>;
  color: ChoiceAnswer<(typeof FIELD_VALUES.color)[number]>;
  fuel: ChoiceAnswer<(typeof FIELD_VALUES.fuel)[number]>;
  gradePref: ChoiceAnswer<(typeof FIELD_VALUES.gradePref)[number]>;
  budget: ScoreAnswer;
  safety: ScoreAnswer;
  kidsOnBoard: number;
  slideDoor: number;
  awd: number;
  tags: Record<Exclude<Tag, "basic">, number>;
};

export const QUESTION_MIX = { choice: 6, score: 2, noul: 22 } as const;

export type ClassifyResult = {
  answers: Answers;
  source: "jev" | "offline";
  model: string;
  latencyMs: number;
  questionCount: number;
  jevCalls: number;
  usage?: { input_tokens: number; output_tokens: number };
};

export function makeChoice<T extends string>(
  values: readonly T[],
  stated: number,
  rawIn: Partial<Record<T, number>>,
  confidence: number | null,
  extra: { orderDisagree?: boolean; confirmed?: boolean } = {},
): ChoiceAnswer<T> {
  const sum = values.reduce((s, v) => s + (rawIn[v] ?? 0), 0) || 1;
  const raw = Object.fromEntries(
    values.map((v) => [v, (rawIn[v] ?? 0) / sum]),
  ) as Record<T, number>;
  const top = values.reduce((b, v) => (raw[v] > raw[b] ? v : b), values[0]!);
  const probabilities = {
    ...(Object.fromEntries(values.map((v) => [v, stated * raw[v]])) as Record<
      T,
      number
    >),
    unspecified: 1 - stated,
  };
  return {
    value: stated >= 0.5 ? top : "unspecified",
    top,
    stated,
    confidence,
    raw,
    probabilities,
    ...extra,
  };
}

export function buildTags(
  asked: Record<(typeof ASKED_TAG_KEYS)[number], number>,
  safety: ScoreAnswer,
  kidsOnBoard: number,
  awd: number,
): Answers["tags"] {
  return {
    ...asked,
    safetyMax: safety.probabilities["2"] ?? 0,
    snow: awd,
    kids: kidsOnBoard,
  };
}

export function confirmField(
  a: Answers,
  field: FieldKey,
  value: string,
): Answers {
  const values = FIELD_VALUES[field] as readonly string[];
  if (!values.includes(value)) return a;
  return {
    ...a,
    [field]: makeChoice(values, 1, { [value]: 1 }, 1, { confirmed: true }),
  };
}

export const ADJUSTABLE_FACTORS = [
  { key: "body", label: "ボディタイプ" },
  { key: "color", label: "色" },
  { key: "budget", label: "価格" },
  { key: "safety", label: "安全装備" },
] as const;
