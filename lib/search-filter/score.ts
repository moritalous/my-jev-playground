export type Probs = Record<string, number | undefined>;
export type Choice = {
  choice: string;
  confidence: number;
  probabilities: Probs;
};

export const LOW_CONFIDENCE = 0.6;

export const LABELS: Record<string, string> = {
  exact: "本命",
  substitute: "代わり",
  complement: "おまけ",
  irrelevant: "無関係",
};

export const isWanted = (c: Choice) => c.choice === "exact";

export const isUnsure = (c: Choice) => c.confidence < LOW_CONFIDENCE;
