import type { Answers } from "./answers";
import { DERIVED_TAGS } from "./questions";
import {
  BODY_LABELS,
  type BodyType,
  type Catalog,
  COLOR_LABELS,
  type Color,
  type ColorFamily,
  type ExclusiveChoice,
  type Grade,
  type Model,
  type Package,
  TAG_LABELS,
  type Tag,
} from "./types";

export const WANT = 0.6;

const BODY_SIM: Record<BodyType, Partial<Record<BodyType, number>>> = {
  sedan: { wagon: 0.55, compact: 0.35, suv: 0.25 },
  wagon: { sedan: 0.55, suv: 0.5, compact: 0.25 },
  suv: { wagon: 0.5, sedan: 0.25, minivan: 0.25 },
  compact: { sedan: 0.35, wagon: 0.25, minivan: 0.2 },
  minivan: { suv: 0.3, wagon: 0.3, compact: 0.2 },
};

export type Factor = {
  key: string;
  label: string;
  fit: number;
  weight: number;
  jev: string;
  car: string;
  active: boolean;
  loss: number;
};

export type OptionPick = {
  kind: "package" | "option" | "exclusive";
  id: string;
  name: string;
  monthlyPrice: number;
  reasons: { tag: Tag; p: number }[];
};

export type Skipped = { name: string; reason: string; tag: Tag; p: number };

export type Build = {
  color: Color;
  colorNote: string;
  package: Package;
  picks: OptionPick[];
  skipped: Skipped[];
  monthlyTotal: number;
};

export type Highlight = { text: string; kind: "good" | "warn" };
export type RankedGrade = {
  grade: Grade;
  score: number;
  factors: Factor[];
  build: Build;
  highlights: Highlight[];
};
export type RankedModel = {
  model: Model;
  score: number;
  best: RankedGrade;
  grades: RankedGrade[];
};

const pct = (p: number) => `${Math.round(p * 100)}%`;
const PARTY_LABELS: Record<string, string> = {
  one_two: "1〜2人",
  three_four: "3〜4人",
  five: "5人",
  six_plus: "6人以上",
  unspecified: "言及なし",
};
const FUEL_LABELS: Record<string, string> = {
  hybrid: "ハイブリッド",
  gasoline: "ガソリン",
  unspecified: "言及なし",
};
const GRADE_LABELS: Record<string, string> = {
  top: "上位グレード",
  basic: "手頃なグレード",
  unspecified: "言及なし",
};
const said = (
  x: { value: string; probabilities: Record<string, number> },
  labels: Record<string, string>,
) =>
  x.value === "unspecified"
    ? "言及なし"
    : `${labels[x.value] ?? x.value} ${pct(x.probabilities[x.value] ?? 0)}`;

const wantedTags = (a: Answers) =>
  (Object.entries(a.tags) as [Tag, number][])
    .filter(([, p]) => p >= WANT)
    .sort((x, y) => y[1] - x[1]);

const scoredTags = (a: Answers) =>
  wantedTags(a).filter(([t]) => !(t in DERIVED_TAGS));

export type WeightMul = Partial<Record<string, number>>;

function colorFit(a: Answers, colors: Color[]): number {
  const have = new Set(colors.flatMap((c) => c.families));
  let fit = a.color.probabilities.unspecified ?? 0;
  for (const [fam, p] of Object.entries(a.color.probabilities))
    if (fam !== "unspecified" && have.has(fam as ColorFamily)) fit += p;
  return fit;
}

function scoreGrade(
  a: Answers,
  model: Model,
  g: Grade,
  ctx: {
    minPrice: number;
    maxPrice: number;
    maxSafety: number;
    weightMul?: WeightMul;
  },
): RankedGrade {
  const bt = a.bodyType.probabilities;
  let bodyFit = bt.unspecified ?? 0;
  for (const [want, p] of Object.entries(bt))
    if (want !== "unspecified")
      bodyFit +=
        p *
        (want === model.bodyType
          ? 1
          : (BODY_SIM[want as BodyType]?.[model.bodyType] ?? 0.1));

  const needSix = a.partySize.probabilities.six_plus ?? 0;
  const seatsFit = g.seats >= 7 ? 1 : 1 - needSix;
  const SMALL_FIT: Record<BodyType, number> = {
    compact: 1,
    sedan: 0.95,
    wagon: 0.9,
    suv: 0.9,
    minivan: 0.7,
  };
  const sizeFit =
    1 -
    (a.partySize.probabilities.one_two ?? 0) * (1 - SMALL_FIT[model.bodyType]);

  const cFit = colorFit(a, g.colors);

  const slideFit = g.features.slideDoor ? 1 : 1 - a.slideDoor * 0.7;

  const fp = a.fuel.probabilities;
  const fuelFit =
    (fp.unspecified ?? 0) +
    (g.fuel === "hybrid" ? (fp.hybrid ?? 0) : (fp.gasoline ?? 0)) +
    0.3 * (g.fuel === "hybrid" ? (fp.gasoline ?? 0) : (fp.hybrid ?? 0));

  const awdFit =
    g.drive === "4WD"
      ? a.awd < 0.4
        ? 0.96
        : 1
      : a.awd < 0.4
        ? 1
        : 1 - (a.awd - 0.4) * 1.3;

  const priceNorm =
    (g.monthlyPrice - ctx.minPrice) / Math.max(1, ctx.maxPrice - ctx.minPrice);
  const budgetW = a.budget.score / 2;
  const budgetFit = 1 - (0.05 + 0.95 * budgetW) * priceNorm;

  const safetyW = a.safety.score / 2;
  const safetyLevel = g.standard.safety.length / Math.max(1, ctx.maxSafety);
  const safetyFit = 1 - safetyW * (1 - safetyLevel) * 0.8;

  const modelPrices = model.grades.map((x) => x.monthlyPrice);
  const lo = Math.min(...modelPrices),
    hi = Math.max(...modelPrices);
  const rel = hi > lo ? (g.monthlyPrice - lo) / (hi - lo) : 0.5;
  const gp = a.gradePref.probabilities;
  const gradeFit =
    (gp.unspecified ?? 0) * 0.8 +
    (gp.top ?? 0) * (0.4 + 0.6 * rel) +
    (gp.basic ?? 0) * (1 - 0.6 * rel);

  const kidsFit =
    1 -
    a.kidsOnBoard *
      (1 - a.slideDoor) *
      0.25 *
      (g.features.slideDoor ? 0 : model.bodyType === "compact" ? 1 : 0.5);

  const wanted = scoredTags(a);
  let tagFit = 1;
  const tagNotes: string[] = [];
  if (wanted.length) {
    let sum = 0,
      wsum = 0;
    for (const [tag, p] of wanted) {
      const std = g.standard.tags.includes(tag);
      const opt =
        g.options.some((o) => o.tags.includes(tag)) ||
        g.packages.some((pk) => pk.tags.includes(tag));
      const f = std ? 1 : opt ? 0.75 : 0.3;
      tagNotes.push(
        `${TAG_LABELS[tag]}: ${std ? "標準" : opt ? "オプション" : "なし"}`,
      );
      sum += p * f;
      wsum += p;
    }
    tagFit = sum / wsum;
  }

  const colorFams = [...new Set(g.colors.flatMap((c) => c.families))];
  const rows: Omit<Factor, "loss">[] = [
    {
      key: "body",
      label: "ボディタイプ",
      fit: bodyFit,
      weight: 1.5,
      jev: said(a.bodyType, BODY_LABELS as Record<string, string>),
      car: model.bodyTypeLabel,
      active: (bt.unspecified ?? 0) < 0.5,
    },
    {
      key: "seats",
      label: "乗車定員",
      fit: seatsFit,
      weight: 2,
      jev: `6人以上 ${pct(needSix)}`,
      car: `${g.seats}人乗り`,
      active: needSix >= 0.2,
    },
    {
      key: "size",
      label: "サイズ感",
      fit: sizeFit,
      weight: 0.8,
      jev: said(a.partySize, PARTY_LABELS),
      car: model.bodyTypeLabel,
      active: (a.partySize.probabilities.one_two ?? 0) >= 0.2,
    },
    {
      key: "color",
      label: "色",
      fit: cFit,
      weight: 1.2,
      jev: said(a.color, COLOR_LABELS as Record<string, string>),
      car: colorFams.map((f) => COLOR_LABELS[f]).join("・"),
      active: (a.color.probabilities.unspecified ?? 0) < 0.5,
    },
    {
      key: "slide",
      label: "スライドドア",
      fit: slideFit,
      weight: 1,
      jev: `希望 ${pct(a.slideDoor)}`,
      car: g.features.slideDoor ? "あり" : "なし",
      active: a.slideDoor >= 0.3,
    },
    {
      key: "fuel",
      label: "燃料",
      fit: fuelFit,
      weight: 0.7,
      jev: said(a.fuel, FUEL_LABELS),
      car: g.fuel === "hybrid" ? "ハイブリッド" : "ガソリン",
      active: (fp.unspecified ?? 0) < 0.5,
    },
    {
      key: "awd",
      label: "4WD",
      fit: awdFit,
      weight: 1,
      jev: `4WD・雪道 ${pct(a.awd)}`,
      car: g.drive,
      active: a.awd >= 0.4,
    },
    {
      key: "budget",
      label: "価格",
      fit: budgetFit,
      weight: 0.5 + 1.5 * budgetW,
      jev: `価格の敏感さ: 最優先 ${pct(a.budget.probabilities["2"] ?? 0)}・気にする ${pct(a.budget.probabilities["1"] ?? 0)}`,
      car: `¥${g.monthlyPrice.toLocaleString()}/月`,
      active: a.budget.score >= 0.5,
    },
    {
      key: "safety",
      label: "安全装備",
      fit: safetyFit,
      weight: 0.5 + 1.0 * safetyW,
      jev: `安全装備の水準: 上位まで ${pct(a.safety.probabilities["2"] ?? 0)}・基本 ${pct(a.safety.probabilities["1"] ?? 0)}`,
      car: `先進安全 ${g.standard.safety.length}項目`,
      active: a.safety.score >= 0.5,
    },
    {
      key: "grade",
      label: "グレードの格",
      fit: gradeFit,
      weight: 0.6,
      jev: said(a.gradePref, GRADE_LABELS),
      car: g.label,
      active: (gp.unspecified ?? 0) < 0.5,
    },
    {
      key: "kids",
      label: "子どもの乗せ降ろし",
      fit: kidsFit,
      weight: 0.6,
      jev: `子どもが乗る ${pct(a.kidsOnBoard)}`,
      car: g.features.slideDoor ? "スライドドア" : "ヒンジドア",
      active: a.kidsOnBoard >= 0.5,
    },
    {
      key: "tags",
      label: "欲しい装備",
      fit: tagFit,
      weight: 0.8,
      jev: wanted.length
        ? wanted.map(([t, p]) => `${TAG_LABELS[t]} ${pct(p)}`).join("・")
        : "特になし",
      car: tagNotes.join("・") || "—",
      active: wanted.length > 0,
    },
  ];
  const clamp = (f: number) => Math.max(0.02, Math.min(1, f));
  for (const r of rows) r.weight *= ctx.weightMul?.[r.key] ?? 1;
  const wsum = rows.reduce((s, f) => s + f.weight, 0);
  const logSum = rows.reduce(
    (s, f) => s + f.weight * Math.log(clamp(f.fit)),
    0,
  );
  const raw = 100 * Math.exp(logSum / wsum);
  const score = Math.round(raw * 10) / 10;
  const factors: Factor[] = rows.map((f) => ({
    ...f,
    loss:
      Math.round(
        (100 * Math.exp((logSum - f.weight * Math.log(clamp(f.fit))) / wsum) -
          raw) *
          10,
      ) / 10,
  }));

  return {
    grade: g,
    score,
    factors,
    build: buildFor(a, g),
    highlights: highlightsFor(a, model, g, priceNorm),
  };
}

function highlightsFor(
  a: Answers,
  model: Model,
  g: Grade,
  priceNorm: number,
): Highlight[] {
  const out: Highlight[] = [];
  const good = (text: string) => out.push({ text, kind: "good" });
  const warn = (text: string) => out.push({ text, kind: "warn" });

  const bt = a.bodyType.value;
  if (bt !== "unspecified" && (a.bodyType.probabilities[bt] ?? 0) >= WANT)
    bt === model.bodyType
      ? good(`希望の${BODY_LABELS[bt]}`)
      : warn(`${BODY_LABELS[bt]}ではなく${model.bodyTypeLabel}`);

  const col = a.color.value;
  if (col !== "unspecified" && (a.color.probabilities[col] ?? 0) >= WANT) {
    const label = COLOR_LABELS[col as ColorFamily];
    g.colors.some((c) => c.families.includes(col as ColorFamily))
      ? good(`${label}を選べる`)
      : warn(`${label}の設定なし`);
  }

  if ((a.partySize.probabilities.six_plus ?? 0) >= 0.5)
    g.seats >= 7 ? good(`${g.seats}人乗り`) : warn(`定員${g.seats}人`);
  if (a.slideDoor >= WANT)
    g.features.slideDoor ? good("スライドドア") : warn("スライドドアなし");
  else if (a.kidsOnBoard >= WANT && g.features.slideDoor)
    good("スライドドアで乗せ降ろし楽");
  if (a.awd >= WANT) g.drive === "4WD" ? good("4WD") : warn("2WD");
  if ((a.fuel.probabilities.hybrid ?? 0) >= WANT && g.fuel === "hybrid")
    good("ハイブリッド");
  if (a.budget.score >= 1.2)
    priceNorm <= 0.33
      ? good("月額が手頃")
      : priceNorm >= 0.66
        ? warn("月額は高め")
        : null;
  if (a.safety.score >= 1.2 || (a.tags.safetyMax ?? 0) >= WANT)
    g.standard.safety.length >= 4
      ? good("先進安全装備が充実")
      : g.standard.safety.length <= 1
        ? warn("先進安全装備は少なめ")
        : null;
  for (const [tag] of wantedTags(a)
    .filter(([t]) => g.standard.tags.includes(t))
    .slice(0, 2))
    good(`${TAG_LABELS[tag]}は標準装備`);
  return out;
}

function reasonsFor(a: Answers, tags: Tag[]) {
  return tags
    .filter((t) => t !== "basic")
    .map((t) => ({ tag: t, p: a.tags[t as Exclude<Tag, "basic">] ?? 0 }))
    .filter((r) => r.p >= WANT)
    .sort((x, y) => y.p - x.p);
}

const alreadyStandard = (g: Grade, rules: string[]) =>
  rules.length > 0 && rules.every((r) => g.standard.rules.includes(r));

export function buildFor(a: Answers, g: Grade): Build {
  const cp = a.color.probabilities;
  const colorScore = (c: Color) =>
    Math.max(0, ...c.families.map((f) => cp[f] ?? 0));
  const color = [...g.colors].sort(
    (x, y) => colorScore(y) - colorScore(x) || x.monthlyPrice - y.monthlyPrice,
  )[0]!;
  const wantedColor =
    a.color.value !== "unspecified" && (cp[a.color.value] ?? 0) >= WANT;
  const colorNote = !wantedColor
    ? "色の指定なし → 追加料金なしの色"
    : color.families.includes(a.color.value as ColorFamily)
      ? `希望の${a.color.value}系`
      : `希望の${a.color.value}系はこのグレードにない`;

  const skipped: Skipped[] = [];

  const base = [...g.packages].sort(
    (x, y) => x.monthlyPrice - y.monthlyPrice,
  )[0]!;
  let pkg = base;
  let bestGain = 0;
  for (const p of g.packages) {
    if (p === base) continue;
    const gain = reasonsFor(a, p.tags).reduce((s, r) => s + r.p, 0);
    if (
      gain > bestGain + 0.01 ||
      (gain > 0 &&
        Math.abs(gain - bestGain) <= 0.01 &&
        p.monthlyPrice < pkg.monthlyPrice)
    ) {
      bestGain = gain;
      pkg = p;
    }
  }

  const picks: OptionPick[] = [];
  if (pkg !== base)
    picks.push({
      kind: "package",
      id: pkg.id,
      name: pkg.name,
      monthlyPrice: pkg.monthlyPrice - base.monthlyPrice,
      reasons: reasonsFor(a, pkg.tags),
    });

  for (const grp of pkg.exclusive) {
    const priceFirst = (a.budget.probabilities["2"] ?? 0) >= 0.5;
    const real = grp.choices.filter((c) => !/なし/.test(c.name));
    let pick: ExclusiveChoice | undefined;
    if (!priceFirst && real.length)
      pick = [...real].sort((x, y) => x.monthlyPrice - y.monthlyPrice)[0];
    else
      pick =
        grp.choices.find((c) => /なし/.test(c.name)) ??
        [...grp.choices].sort((x, y) => x.monthlyPrice - y.monthlyPrice)[0];
    if (pick) picks.push({ kind: "exclusive", ...pick, reasons: [] });
  }

  const covered = new Set([...g.standard.rules, ...pkg.rules]);
  const tagsDone = new Set<Tag>(
    pkg === base ? [] : reasonsFor(a, pkg.tags).map((r) => r.tag),
  );
  for (const o of [...g.options].sort(
    (x, y) => x.monthlyPrice - y.monthlyPrice,
  )) {
    const reasons = reasonsFor(a, o.tags);
    if (!reasons.length) continue;
    if (reasons.every((r) => tagsDone.has(r.tag))) {
      skipped.push({
        name: o.name,
        reason: "同じ要望を別の装備で対応済み",
        tag: reasons[0]!.tag,
        p: reasons[0]!.p,
      });
      continue;
    }
    if (
      alreadyStandard(g, o.rules) ||
      (o.rules.length && o.rules.every((r) => covered.has(r)))
    ) {
      skipped.push({
        name: o.name,
        reason: g.standard.rules.some((r) => o.rules.includes(r))
          ? "同等の装備が標準"
          : "選んだパッケージに含まれる",
        tag: reasons[0]!.tag,
        p: reasons[0]!.p,
      });
      continue;
    }
    picks.push({
      kind: "option",
      id: o.id,
      name: o.name,
      monthlyPrice: o.monthlyPrice,
      reasons,
    });
    for (const r of reasons) tagsDone.add(r.tag);
  }

  for (const [tag, p] of wantedTags(a))
    if (
      g.standard.tags.includes(tag) &&
      !tagsDone.has(tag) &&
      !picks.some((x) => x.reasons.some((r) => r.tag === tag)) &&
      !skipped.some((s) => s.tag === tag)
    )
      skipped.push({
        name: g.standard.byTag[tag]?.join("、") ?? "(標準装備)",
        reason: "標準装備で対応",
        tag,
        p,
      });

  const monthlyTotal =
    g.monthlyPrice +
    color.monthlyPrice +
    picks.reduce((s, x) => s + x.monthlyPrice, 0);
  return { color, colorNote, package: pkg, picks, skipped, monthlyTotal };
}

export function rankAll(
  a: Answers,
  catalog: Catalog,
  weightMul?: WeightMul,
): RankedModel[] {
  const all = catalog.models.flatMap((m) => m.grades);
  const ctx = {
    minPrice: Math.min(...all.map((g) => g.monthlyPrice)),
    maxPrice: Math.max(...all.map((g) => g.monthlyPrice)),
    maxSafety: Math.max(...all.map((g) => g.standard.safety.length)),
    weightMul,
  };
  return catalog.models
    .map((model) => {
      const grades = model.grades
        .map((g) => scoreGrade(a, model, g, ctx))
        .sort((x, y) => y.score - x.score);
      return { model, score: grades[0]!.score, best: grades[0]!, grades };
    })
    .sort((x, y) => y.score - x.score);
}
