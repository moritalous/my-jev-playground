import type { JevTrace } from "@/lib/common/jev-trace";

export type ChoiceAnswer = {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};
export type ScoreAnswer = {
  score: number;
  confidence: number;
  probabilities: number[];
};

export type RawAnswers = {
  intent: ChoiceAnswer;
  intent_rev: ChoiceAnswer;
  urgency: ScoreAnswer;
  frustration: ScoreAnswer;
  complex_case: ScoreAnswer;
  legal_threat: number;
  suspicious: number;
  multiple_requests: number;
  refund_in_policy: number;
};

export type ClassifyStats = {
  model: string;
  jevCalls: number;
  questions: number;
  ms: number;
  inputTokens: number;
  outputTokens: number;
};

export type ClassifyResponse = {
  answers: RawAnswers;
  stats: ClassifyStats;
  jev: JevTrace[];
};

export const INTENTS = [
  "order_status",
  "refund_request",
  "cancel_subscription",
  "product_question",
  "complaint",
  "account_access",
  "other",
] as const;
export type Intent = (typeof INTENTS)[number];

export const INTENT_LABELS: Record<Intent, string> = {
  order_status: "注文状況の確認",
  refund_request: "返金依頼",
  cancel_subscription: "解約",
  product_question: "商品の質問",
  complaint: "クレーム",
  account_access: "ログイン・アカウント",
  other: "その他",
};
