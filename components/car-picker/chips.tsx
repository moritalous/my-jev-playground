import type { RankedGrade } from "@/lib/car-picker/rank";
import { TAG_LABELS } from "@/lib/car-picker/types";
import { pct } from "./shared";

export function HighlightChips({
  rg,
  max = 2,
}: {
  rg: RankedGrade;
  max?: number;
}) {
  const hs = [
    ...rg.highlights.filter((h) => h.kind === "good").slice(0, max),
    ...rg.highlights.filter((h) => h.kind === "warn").slice(0, max),
  ];
  return (
    <>
      {hs.map((h) => (
        <span key={`${h.kind}:${h.text}`} className={`chip ${h.kind}`}>
          {h.kind === "good" ? "✓" : "!"} {h.text}
        </span>
      ))}
    </>
  );
}

export function JevChips({
  reasons,
}: {
  reasons: { tag: string; p: number }[];
}) {
  return (
    <>
      {reasons.map((r) => (
        <span key={r.tag} className="chip jev" title="Jev の判定">
          {TAG_LABELS[r.tag] ?? r.tag} <b>{pct(r.p)}</b>
        </span>
      ))}
    </>
  );
}
