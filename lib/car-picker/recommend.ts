import {
  type Answers,
  confirmField,
  FIELD_LABELS,
  type FieldKey,
  VALUE_LABELS,
} from "./answers";
import { type Confidence, computeConfidence } from "./confidence";
import { type RankedModel, rankAll, type WeightMul } from "./rank";
import type { Catalog } from "./types";

export type FollowUp = {
  field: FieldKey;
  label: string;
  options: { value: string; label: string; p: number }[];
};

export type Evaluation = {
  ranking: RankedModel[];
  confidence: Confidence;
  followUp: FollowUp | null;
  rankMs: number;
};

const TOP_N = 5;
const top5 = (r: RankedModel[]) => r.slice(0, TOP_N).map((m) => m.model.key);

export function evaluate(
  a: Answers,
  source: "jev" | "offline",
  catalog: Catalog,
  weightMul?: WeightMul,
): Evaluation {
  const t0 = performance.now();
  const ranking = rankAll(a, catalog, weightMul);
  const confidence = computeConfidence(a, source);
  let followUp: FollowUp | null = null;

  if (confidence.available && confidence.low) {
    const target = confidence.items.find(
      (i) =>
        i.field &&
        i.confidence < confidence.threshold &&
        a[i.field].stated >= 0.5,
    );
    if (target?.field) {
      const x = a[target.field];
      const two = Object.entries(x.raw as Record<string, number>)
        .sort((p, q) => q[1] - p[1])
        .slice(0, 2);
      if (two.length === 2 && two[1]![1] >= 0.15) {
        const [va, vb] = two as [[string, number], [string, number]];
        const ra = top5(
          rankAll(confirmField(a, target.field, va[0]), catalog, weightMul),
        );
        const rb = top5(
          rankAll(confirmField(a, target.field, vb[0]), catalog, weightMul),
        );
        if (ra.join() !== rb.join())
          followUp = {
            field: target.field,
            label: FIELD_LABELS[target.field],
            options: two.map(([value, p]) => ({
              value,
              label: VALUE_LABELS[value] ?? value,
              p,
            })),
          };
      }
    }
  }
  const rankMs = Math.round((performance.now() - t0) * 10) / 10;
  return { ranking, confidence, followUp, rankMs };
}
