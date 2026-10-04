import {
  type Answers,
  FIELD_KEYS,
  FIELD_LABELS,
  type FieldKey,
  VALUE_LABELS,
} from "./answers";
import { TAG_LABELS } from "./types";

export const LOW_CONFIDENCE = 0.6;
const DECISIVE_P = 0.25;
const WANT = 0.6;

export type ConfidenceItem = {
  key: string;
  label: string;
  confidence: number;
  detail: string;
  field?: FieldKey;
};

export type Confidence =
  | {
      available: true;
      overall: number;
      low: boolean;
      threshold: number;
      items: ConfidenceItem[];
      signals: string[];
      weakest: ConfidenceItem | null;
    }
  | { available: false; note: string };

const pct = (p: number) => `${Math.round(p * 100)}%`;
const noulConf = (p: number) => Math.abs(2 * p - 1);

export function computeConfidence(
  a: Answers,
  source: "jev" | "offline",
): Confidence {
  if (source === "offline")
    return {
      available: false,
      note: "キーワードルールの判定なので、確信度はありません（確率ではなく、当てはまった/はまらないだけです）。",
    };

  const items: ConfidenceItem[] = [];
  for (const f of FIELD_KEYS) {
    const x = a[f];
    if (x.stated < DECISIVE_P) continue;
    const statedConf = noulConf(x.stated);
    let confidence = statedConf;
    let detail = `言及 ${pct(x.stated)}`;
    if (x.stated >= 0.5) {
      const sorted = Object.entries(x.raw).sort(
        (p, q) => (q[1] as number) - (p[1] as number),
      ) as [string, number][];
      const margin = (sorted[0]?.[1] ?? 1) - (sorted[1]?.[1] ?? 0);
      confidence = x.confirmed
        ? 1
        : Math.min(
            statedConf,
            margin,
            x.confidence ?? 1,
            x.orderDisagree ? 0.3 : 1,
          );
      const two = sorted
        .slice(0, 2)
        .map(([k, p]) => `${VALUE_LABELS[k] ?? k} ${pct(p)}`);
      detail = x.confirmed
        ? `${VALUE_LABELS[x.top]}（あなたが選択）`
        : `言及 ${pct(x.stated)}・${two.join(" / ")}${x.orderDisagree ? "・選択肢の順序で結果が割れた" : ""}`;
    }
    items.push({
      key: f,
      label: FIELD_LABELS[f],
      confidence,
      detail,
      field: f,
    });
  }
  const noulItems: [string, string, number, number][] = [
    ["kidsOnBoard", "子どもが乗る", a.kidsOnBoard, 0.5],
    ["slideDoor", "スライドドア希望", a.slideDoor, 0.5],
    ["awd", "4WD・雪道", a.awd, 0.5],
    ...Object.entries(a.tags)
      .filter(([t]) => !["safetyMax", "snow", "kids"].includes(t))
      .map(([t, p]): [string, string, number, number] => [
        t,
        TAG_LABELS[t] ?? t,
        p,
        WANT,
      ]),
  ];
  for (const [key, label, p, gate] of noulItems)
    if (p >= gate)
      items.push({
        key,
        label,
        confidence: noulConf(p),
        detail: `はい ${pct(p)}`,
      });
  for (const [key, label, x] of [
    ["budget", "価格の敏感さ", a.budget],
    ["safety", "安全装備の水準", a.safety],
  ] as const)
    if (x.score >= 0.5)
      items.push({
        key,
        label,
        confidence: x.confidence ?? 1,
        detail: `期待値 ${x.score.toFixed(2)}/2`,
      });

  items.sort((x, y) => x.confidence - y.confidence);
  const weakest = items[0] ?? null;
  const overall = weakest ? weakest.confidence : 1;
  const signals = [
    ...FIELD_KEYS.filter((f) => a[f].stated >= 0.5).map((f) => FIELD_LABELS[f]),
    ...noulItems.filter(([, , p, g]) => p >= g).map(([, l]) => l),
    ...(a.budget.score >= 0.8 ? ["価格"] : []),
    ...(a.safety.score >= 0.8 ? ["安全装備"] : []),
  ];
  return {
    available: true,
    overall,
    low: overall < LOW_CONFIDENCE,
    threshold: LOW_CONFIDENCE,
    items,
    signals,
    weakest,
  };
}
