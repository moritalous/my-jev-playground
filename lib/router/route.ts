import {
  type ChoiceAnswer,
  INTENT_LABELS,
  INTENTS,
  type Intent,
  type RawAnswers,
} from "./types";

export type Risk = "low" | "medium" | "high";
export type Decision = "AUTO" | "CONFIRM" | "HUMAN";

export const RISK_LABELS: Record<Risk, string> = {
  low: "低リスク",
  medium: "中リスク",
  high: "高リスク",
};

export type HandlerId =
  | "template_reply"
  | "refund"
  | "cancel"
  | "account_recovery"
  | "complaint"
  | "security_human"
  | "legal_human"
  | "human";

export const HANDLERS: Record<
  HandlerId,
  { label: string; risk: Risk | null; intents: readonly Intent[]; demo: string }
> = {
  template_reply: {
    label: "定型返信で自動対応",
    risk: "low",
    intents: ["order_status", "product_question"],
    demo: "注文情報・商品情報から定型文を作って返信する",
  },
  refund: {
    label: "返金処理",
    risk: "high",
    intents: ["refund_request"],
    demo: "返品を受け付け、返金手続きを開始する",
  },
  cancel: {
    label: "解約手続き",
    risk: "high",
    intents: ["cancel_subscription"],
    demo: "プレミアム会員の解約手続きを開始する",
  },
  account_recovery: {
    label: "アカウント復旧案内",
    risk: "medium",
    intents: ["account_access"],
    demo: "パスワード再設定の案内メールを送る",
  },
  complaint: {
    label: "クレーム対応",
    risk: "medium",
    intents: ["complaint"],
    demo: "AI が返信の下書きを作り、担当者が確認してから送る",
  },
  security_human: {
    label: "人間（セキュリティ担当）",
    risk: null,
    intents: [],
    demo: "セキュリティ担当に転送する",
  },
  legal_human: {
    label: "人間（法務・上位担当）",
    risk: null,
    intents: [],
    demo: "法務・上位の担当者に転送する",
  },
  human: {
    label: "人間のオペレーター",
    risk: null,
    intents: [],
    demo: "有人オペレーターに転送する",
  },
};

export type Thresholds = {
  byRisk: Record<Risk, { auto: number; confirm: number }>;
  floor: number;
  suspicious: number;
  legal: number;
  multiple: number;
  complaintHuman: {
    complex_case: number;
    frustration: number;
    urgency: number;
  };
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  byRisk: {
    low: { auto: 0.6, confirm: 0.5 },
    medium: { auto: 0.7, confirm: 0.5 },
    high: { auto: 0.85, confirm: 0.6 },
  },
  floor: 0.5,
  suspicious: 0.5,
  legal: 0.4,
  multiple: 0.5,
  complaintHuman: { complex_case: 1.5, frustration: 1.5, urgency: 1.5 },
};

export type Evidence = {
  key: string;
  label: string;
  confidence: number;
  detail: string;
};

export type RouteResult = {
  decision: Decision;
  handler: HandlerId;
  intent: Intent;
  intentConfidence: number;
  overall: number;
  weakest: Evidence | null;
  evidence: Evidence[];
  reasons: string[];
  multipleVeto: boolean;
};

const pct = (p: number) => `${Math.round(p * 100)}%`;
const c2 = (p: number) => p.toFixed(2);

export function combineIntent(a: RawAnswers) {
  const avg: Record<string, number> = {};
  for (const k of INTENTS)
    avg[k] =
      ((a.intent.probabilities[k] ?? 0) +
        (a.intent_rev.probabilities[k] ?? 0)) /
      2;
  const ranked = Object.entries(avg).sort((x, y) => y[1] - x[1]);
  const top = ranked[0][0] as Intent;
  const agree = a.intent.choice === a.intent_rev.choice;
  const margin = ranked[0][1] - (ranked[1]?.[1] ?? 0);
  const jev = Math.min(a.intent.confidence, a.intent_rev.confidence);
  const confidence = agree ? jev : Math.min(jev, 0.3);
  return { avg, top, agree, margin, jevConfidence: jev, confidence };
}

export function intentOf(c: ChoiceAnswer) {
  return c.choice as Intent;
}

export function route(a: RawAnswers, th: Thresholds): RouteResult {
  const ic = combineIntent(a);
  const intent = ic.top;
  const reasons: string[] = [];
  const intentEv: Evidence = {
    key: "intent",
    label: "intent（意図）",
    confidence: ic.confidence,
    detail: ic.agree
      ? `並び順を逆にしても同じ答え。確信度 ${c2(ic.jevConfidence)}`
      : `並び順を逆にすると答えが変わった（${INTENT_LABELS[intentOf(a.intent)]} / ${INTENT_LABELS[intentOf(a.intent_rev)]}）ので 0.30 に抑える`,
  };
  const base = {
    intent,
    intentConfidence: ic.confidence,
  };
  const intentText = `intent=${INTENT_LABELS[intent]} (確信度 ${c2(ic.confidence)})`;

  const human = (
    handler: HandlerId,
    why: string[],
    evidence: Evidence[] = [intentEv],
  ): RouteResult => {
    const w = weakestOf(evidence);
    return {
      ...base,
      decision: "HUMAN",
      handler,
      overall: w?.confidence ?? ic.confidence,
      weakest: w,
      evidence,
      reasons: [...reasons, ...why],
      multipleVeto: false,
    };
  };

  if (a.suspicious >= th.suspicious) {
    const ev: Evidence = {
      key: "suspicious",
      label: "suspicious（不審）",
      confidence: a.suspicious,
      detail: `不審である確率 ${pct(a.suspicious)}`,
    };
    return human(
      "security_human",
      [
        `suspicious ${pct(a.suspicious)} が ${pct(th.suspicious)} 以上 → 意図に関係なくセキュリティ担当へ（自動処理しない）`,
      ],
      [ev],
    );
  }
  if (a.legal_threat >= th.legal) {
    const ev: Evidence = {
      key: "legal_threat",
      label: "legal_threat（法的措置）",
      confidence: a.legal_threat,
      detail: `法的措置のほのめかしである確率 ${pct(a.legal_threat)}`,
    };
    return human(
      "legal_human",
      [
        `legal_threat ${pct(a.legal_threat)} が ${pct(th.legal)} 以上 → 意図に関係なく法務・上位担当へ（見逃しのほうが高くつくのでしきい値は低め）`,
      ],
      [ev],
    );
  }

  if (intent === "other") {
    return human("human", [
      `${intentText} は「その他」→ 自動で扱える用件ではないので人に回す`,
    ]);
  }

  const handlerId = (Object.keys(HANDLERS) as HandlerId[]).find((h) =>
    HANDLERS[h].intents.includes(intent),
  ) as HandlerId;
  const handler = HANDLERS[handlerId];
  const risk = handler.risk as Risk;
  const rt = th.byRisk[risk];

  const evidence: Evidence[] = [intentEv];
  if (handlerId === "refund") {
    evidence.push({
      key: "refund_in_policy",
      label: "refund_in_policy（返金期間内）",
      confidence: a.refund_in_policy,
      detail: `期間内である確率 ${pct(a.refund_in_policy)}（返金依頼のときだけ使う投機的な質問）`,
    });
  }
  if (handlerId === "complaint") {
    evidence.push({
      key: "complex_case",
      label: "complex_case（対応の難しさ）",
      confidence: a.complex_case.confidence,
      detail: `期待値 ${c2(a.complex_case.score)} / 0〜2、確信度 ${c2(a.complex_case.confidence)}`,
    });
  }
  const weakest = weakestOf(evidence);
  const overall = weakest?.confidence ?? 0;
  let multipleVeto = false;
  const mk = (
    decision: Decision,
    handlerOut: HandlerId,
    why: string[],
  ): RouteResult => ({
    ...base,
    decision,
    handler: handlerOut,
    overall,
    weakest,
    evidence,
    reasons: [...reasons, ...why],
    multipleVeto,
  });

  const riskText = `${handler.label}は${RISK_LABELS[risk]}`;

  if (overall < th.floor) {
    return mk("HUMAN", "human", [
      `${intentText}`,
      `最弱の環 ${weakest?.label} が ${c2(overall)} で、下限 ${c2(th.floor)} 未満 → 人に回す`,
    ]);
  }

  if (handlerId === "complaint") {
    const t = th.complaintHuman;
    const hard: string[] = [];
    if (a.complex_case.score >= t.complex_case)
      hard.push(
        `complex_case ${c2(a.complex_case.score)} ≥ ${c2(t.complex_case)}`,
      );
    if (a.frustration.score >= t.frustration)
      hard.push(
        `frustration ${c2(a.frustration.score)} ≥ ${c2(t.frustration)}`,
      );
    if (a.urgency.score >= t.urgency)
      hard.push(`urgency ${c2(a.urgency.score)} ≥ ${c2(t.urgency)}`);
    if (overall < rt.confirm || hard.length) {
      return mk("HUMAN", "human", [
        intentText,
        hard.length
          ? `${hard.join(" / ")} → 複雑・強い不満・緊急のクレームなので人に回す`
          : `確信度 ${c2(overall)} が ${RISK_LABELS[risk]}の確認ライン ${c2(rt.confirm)} 未満 → 人に回す`,
      ]);
    }
    return mk("CONFIRM", "complaint", [
      intentText,
      `complex_case ${c2(a.complex_case.score)} / frustration ${c2(a.frustration.score)} / urgency ${c2(a.urgency.score)} はいずれも基準未満 → AI が下書きを作り、担当者が確認してから送る（自動送信はしない）`,
    ]);
  }

  let decision: Decision;
  const why: string[] = [intentText];
  if (handlerId === "refund")
    why.push(
      `refund_in_policy ${pct(a.refund_in_policy)}（${a.refund_in_policy >= 0.5 ? "返金期間内" : "期間外・または未着の注文"}）`,
    );
  if (overall >= rt.auto) {
    decision = "AUTO";
    why.push(
      `${riskText}。最弱の環 ${c2(overall)} ≥ ${c2(rt.auto)} → 自動実行の基準を満たす`,
    );
  } else if (overall >= rt.confirm) {
    decision = "CONFIRM";
    why.push(
      `${riskText}。最弱の環 ${c2(overall)} は ${c2(rt.confirm)}〜${c2(rt.auto)} の間 → 実行前に確認`,
    );
  } else {
    decision = "HUMAN";
    why.push(
      `${riskText}。最弱の環 ${c2(overall)} < ${c2(rt.confirm)} → 人に回す`,
    );
  }

  if (
    a.multiple_requests >= th.multiple &&
    decision === "AUTO" &&
    risk !== "low"
  ) {
    decision = "CONFIRM";
    multipleVeto = true;
    why.push(
      `multiple_requests ${pct(a.multiple_requests)} ≥ ${pct(th.multiple)}（複数の依頼が混在）→ 自動実行せず確認に格下げ`,
    );
  }

  return mk(decision, decision === "HUMAN" ? "human" : handlerId, why);
}

function weakestOf(ev: Evidence[]): Evidence | null {
  return ev.reduce<Evidence | null>(
    (m, e) => (m === null || e.confidence < m.confidence ? e : m),
    null,
  );
}
