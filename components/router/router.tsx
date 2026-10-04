"use client";

import { useMemo, useState } from "react";
import { JevDrawer } from "@/components/common/jev-drawer";
import type { JevTrace } from "@/lib/common/jev-trace";
import {
  combineIntent,
  DEFAULT_THRESHOLDS,
  HANDLERS,
  RISK_LABELS,
  type Risk,
  type RouteResult,
  route,
  type Thresholds,
} from "@/lib/router/route";
import {
  type ClassifyResponse,
  INTENT_LABELS,
  INTENTS,
  type RawAnswers,
} from "@/lib/router/types";

type Sample = { label: string; message: string };

const pct = (p: number) => `${Math.round(p * 100)}%`;
const DECISION_TEXT = {
  AUTO: "自動で対応",
  CONFIRM: "確認してから実行",
  HUMAN: "人に回す",
} as const;

const NO_TRACES: JevTrace[] = [];

export function Router({
  hasKey,
  samples,
  customer,
  questionsJson,
}: {
  hasKey: boolean;
  samples: Sample[];
  customer: unknown;
  questionsJson: string;
}) {
  const [message, setMessage] = useState("");
  const [asked, setAsked] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClassifyResponse | null>(null);
  const [th, setTh] = useState<Thresholds>(DEFAULT_THRESHOLDS);

  const routed = useMemo(
    () => (result ? route(result.answers, th) : null),
    [result, th],
  );

  async function run(text: string) {
    const m = text.trim();
    if (!m || running) return;
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/router/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: m }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setResult(null);
        setError(data?.error ?? `エラー (${res.status})`);
        return;
      }
      setAsked(m);
      setResult(data as ClassifyResponse);
    } catch (e) {
      setResult(null);
      setError(`エラー: ${String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="wrap">
      <JevDrawer traces={result?.jev ?? NO_TRACES} />
      <header>
        <h1>問い合わせ振り分け</h1>
        <p className="lead">
          お客様のメッセージを Jev に <b>1回</b>
          聞いて意図などを判定し、「自動で対応 / 確認してから実行 /
          人に回す」の振り分けは確信度としきい値を使った<b>コード</b>
          で決めます。取り返しのつかない操作ほど、自動実行に高い確信度を求めます。
          <br />
          <span className="demo">
            （デモ）振り分け先の処理は実際には実行しません。
          </span>
        </p>
      </header>

      {!hasKey && (
        <div className="warn">
          TYPESAFE_API_KEY
          が未設定です。サーバー側に設定すると「振り分ける」が使えます。
        </div>
      )}

      <section className="panel">
        <h2>1. 問い合わせを選ぶ（または入力する）</h2>
        <div className="samples">
          {samples.map((s) => (
            <button
              key={s.label}
              type="button"
              className="sample"
              disabled={running}
              onClick={() => {
                setMessage(s.message);
                if (hasKey) run(s.message);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <form
          className="input"
          onSubmit={(e) => {
            e.preventDefault();
            run(message);
          }}
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="お客様からの問い合わせを入力"
            aria-label="お客様のメッセージ"
          />
          <button
            type="submit"
            className="primary"
            disabled={!hasKey || running || !message.trim()}
          >
            {running ? "判定中…" : "振り分ける"}
          </button>
        </form>
        <details className="req">
          <summary>Jev に渡す内容（state と質問）を見る</summary>
          <p className="note">
            顧客情報と返金ポリシーは固定のデモ用データです。質問は9問・すべて独立で、
            1リクエストにまとめて聞きます。
          </p>
          <pre>
            {JSON.stringify(
              {
                state: {
                  message: "<上の問い合わせ>",
                  ...(customer as object),
                },
              },
              null,
              2,
            )}
          </pre>
          <pre>{questionsJson}</pre>
        </details>
      </section>

      {error && <div className="warn">{error}</div>}

      {result && routed && (
        <>
          <Stats stats={result.stats} />
          <Decision routed={routed} message={asked} />
          <AnswersTable answers={result.answers} routed={routed} />
          <ThresholdTable th={th} setTh={setTh} />
        </>
      )}
    </main>
  );
}

function Stats({ stats }: { stats: ClassifyResponse["stats"] }) {
  return (
    <div className="stats">
      Jev {stats.jevCalls}回 ・ {stats.questions}問 ・ {stats.ms}ms ・ 入力{" "}
      {stats.inputTokens.toLocaleString()} トークン ・ {stats.model}
    </div>
  );
}

function Decision({
  routed,
  message,
}: {
  routed: RouteResult;
  message: string;
}) {
  const h = HANDLERS[routed.handler];
  return (
    <section className={`panel decision ${routed.decision}`}>
      <h2>2. 振り分け結果</h2>
      <p className="msg">「{message}」</p>
      <div className="head">
        <span className={`badge ${routed.decision}`}>{routed.decision}</span>
        <div>
          <div className="dtext">{DECISION_TEXT[routed.decision]}</div>
          <div className="handler">
            {h.label}
            {h.risk && (
              <span className={`risk ${h.risk}`}>{RISK_LABELS[h.risk]}</span>
            )}
          </div>
        </div>
      </div>
      <ul className="reasons">
        {routed.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="note">
        （デモ）実際には実行しません。本来の処理: {h.demo}。
        {routed.weakest && (
          <>
            {" "}
            判定に使った最弱の環: <b>{routed.weakest.label}</b>{" "}
            {routed.weakest.confidence.toFixed(2)}
          </>
        )}
      </p>
    </section>
  );
}

function Bar({ p, className }: { p: number; className?: string }) {
  return (
    <span className="bar" aria-hidden="true">
      <span
        className={`fill ${className ?? ""}`}
        style={{ width: `${Math.round(Math.max(0, Math.min(1, p)) * 100)}%` }}
      />
    </span>
  );
}

function usageOf(key: string, r: RouteResult) {
  if (r.evidence.some((e) => e.key === key)) return "経路で使用";
  switch (key) {
    case "suspicious":
    case "legal_threat":
      return "最優先のゲート";
    case "multiple_requests":
      return r.multipleVeto
        ? "自動実行を止めた（AUTO → CONFIRM）"
        : "AUTO の拒否権（今回は未発動）";
    case "intent":
    case "intent_rev":
      return "経路で使用";
    case "frustration":
    case "urgency":
      return r.intent === "complaint" ? "クレームの判定" : "（未使用）";
    case "complex_case":
      return r.intent === "complaint" ? "クレームの判定" : "（未使用）";
    case "refund_in_policy":
      return "（返金依頼以外では捨てる）";
    default:
      return "";
  }
}

function AnswersTable({
  answers: a,
  routed,
}: {
  answers: RawAnswers;
  routed: RouteResult;
}) {
  const ic = combineIntent(a);
  const weakKey = routed.weakest?.key;
  const confOf = (key: string, fallback: number) =>
    routed.evidence.find((e) => e.key === key)?.confidence ?? fallback;
  const intentTop = INTENTS.map((k) => ({ k, p: ic.avg[k] }))
    .sort((x, y) => y.p - x.p)
    .slice(0, 3);
  const noulRows: { key: string; label: string; q: string; p: number }[] = [
    {
      key: "refund_in_policy",
      label: "refund_in_policy",
      q: "返金期間内か（投機的）",
      p: a.refund_in_policy,
    },
    {
      key: "multiple_requests",
      label: "multiple_requests",
      q: "複数の依頼が混在",
      p: a.multiple_requests,
    },
    {
      key: "legal_threat",
      label: "legal_threat",
      q: "法的措置のほのめかし",
      p: a.legal_threat,
    },
    {
      key: "suspicious",
      label: "suspicious",
      q: "フィッシング・不審",
      p: a.suspicious,
    },
  ];
  const scoreRows = [
    {
      key: "complex_case",
      label: "complex_case",
      q: "対応の難しさ",
      s: a.complex_case,
      lv: ["単純", "要判断", "専門"],
    },
    {
      key: "frustration",
      label: "frustration",
      q: "不満・怒りの強さ",
      s: a.frustration,
      lv: ["なし", "不満", "強い怒り"],
    },
    {
      key: "urgency",
      label: "urgency",
      q: "緊急度",
      s: a.urgency,
      lv: ["低", "中", "高"],
    },
  ];
  return (
    <section className="panel">
      <h2>3. Jev の答え（確率と確信度）</h2>
      <p className="note">
        Jev
        は答えと確率だけを返します。「どう振り分けるか」は次の表のしきい値でコードが決めます。
        ★ は今回の判定の最弱の環です。
      </p>
      <div className="scroll">
        <table className="answers">
          <thead>
            <tr>
              <th>質問</th>
              <th>答え</th>
              <th>確率</th>
              <th>確信度</th>
              <th>今回の使われ方</th>
            </tr>
          </thead>
          <tbody>
            <tr className={weakKey === "intent" ? "weak" : ""}>
              <td>
                <b>intent</b>
                <small>choice ×2（並び順を逆にして平均）</small>
              </td>
              <td>
                {INTENT_LABELS[ic.top]}
                {!ic.agree && (
                  <span className="flag">
                    並び順で答えが変わった（
                    {
                      INTENT_LABELS[
                        a.intent.choice as keyof typeof INTENT_LABELS
                      ]
                    }
                    {" / "}
                    {
                      INTENT_LABELS[
                        a.intent_rev.choice as keyof typeof INTENT_LABELS
                      ]
                    }
                    ）
                  </span>
                )}
              </td>
              <td>
                {intentTop.map((x) => (
                  <div className="prob" key={x.k}>
                    <span className="lbl">{INTENT_LABELS[x.k]}</span>
                    <Bar p={x.p} />
                    <span className="num">{pct(x.p)}</span>
                  </div>
                ))}
              </td>
              <td className="conf">
                {routed.intentConfidence.toFixed(2)}
                {weakKey === "intent" && " ★"}
              </td>
              <td>{usageOf("intent", routed)}</td>
            </tr>
            {noulRows.map((r) => (
              <tr key={r.key} className={weakKey === r.key ? "weak" : ""}>
                <td>
                  <b>{r.label}</b>
                  <small>noul：{r.q}</small>
                </td>
                <td>{r.p >= 0.5 ? "はい" : "いいえ"}</td>
                <td>
                  <div className="prob">
                    <Bar p={r.p} className="yes" />
                    <span className="num">はい {pct(r.p)}</span>
                  </div>
                </td>
                <td className="conf">
                  {confOf(r.key, Math.abs(2 * r.p - 1)).toFixed(2)}
                  {weakKey === r.key && " ★"}
                </td>
                <td>{usageOf(r.key, routed)}</td>
              </tr>
            ))}
            {scoreRows.map((r) => (
              <tr key={r.key} className={weakKey === r.key ? "weak" : ""}>
                <td>
                  <b>{r.label}</b>
                  <small>score（3段階）：{r.q}</small>
                </td>
                <td>期待値 {r.s.score.toFixed(2)} / 2</td>
                <td>
                  {r.s.probabilities.map((p, i) => (
                    <div className="prob" key={r.lv[i]}>
                      <span className="lbl">{r.lv[i]}</span>
                      <Bar p={p} />
                      <span className="num">{pct(p)}</span>
                    </div>
                  ))}
                </td>
                <td className="conf">
                  {confOf(r.key, r.s.confidence).toFixed(2)}
                  {weakKey === r.key && " ★"}
                </td>
                <td>{usageOf(r.key, routed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        確信度: choice / score は Jev が返す値（intent
        は2回のうち小さいほう。並び順で答えが変わったら 0.30 に抑える）。noul は
        |2p−1|（0.5 付近ほど低い）。ただし返金のように
        「はい」が必要な条件では、その操作を正しいと言える度合い = p
        をそのまま使います。
      </p>
    </section>
  );
}

function NumberInput({
  value,
  onChange,
  step = 0.05,
  max = 1,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  max?: number;
  label: string;
}) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v)) onChange(Math.max(0, Math.min(max, v)));
      }}
    />
  );
}

const RISKS: Risk[] = ["low", "medium", "high"];

function ThresholdTable({
  th,
  setTh,
}: {
  th: Thresholds;
  setTh: (t: Thresholds) => void;
}) {
  const setRisk = (r: Risk, k: "auto" | "confirm", v: number) =>
    setTh({
      ...th,
      byRisk: { ...th.byRisk, [r]: { ...th.byRisk[r], [k]: v } },
    });
  const setCh = (k: keyof Thresholds["complaintHuman"], v: number) =>
    setTh({ ...th, complaintHuman: { ...th.complaintHuman, [k]: v } });
  return (
    <section className="panel">
      <h2>4. しきい値（リスク別）— 動かすと即座に再判定</h2>
      <p className="zero">
        Jev 呼び出し <b>0回</b>
        で再判定（上の結果はこの表の値で、ブラウザ内で計算し直しています）
      </p>
      <div className="scroll">
        <table className="thresholds">
          <thead>
            <tr>
              <th>リスク</th>
              <th>振り分け先</th>
              <th>AUTO（以上）</th>
              <th>CONFIRM（以上）</th>
              <th>未満</th>
            </tr>
          </thead>
          <tbody>
            {RISKS.map((r) => (
              <tr key={r}>
                <td>
                  <span className={`risk ${r}`}>{RISK_LABELS[r]}</span>
                </td>
                <td>
                  {Object.values(HANDLERS)
                    .filter((h) => h.risk === r)
                    .map((h) => h.label)
                    .join("、")}
                </td>
                <td>
                  <NumberInput
                    label={`${RISK_LABELS[r]}の自動実行しきい値`}
                    value={th.byRisk[r].auto}
                    onChange={(v) => setRisk(r, "auto", v)}
                  />
                </td>
                <td>
                  <NumberInput
                    label={`${RISK_LABELS[r]}の確認しきい値`}
                    value={th.byRisk[r].confirm}
                    onChange={(v) => setRisk(r, "confirm", v)}
                  />
                </td>
                <td>HUMAN</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="others">
        <div className="row">
          <span>全体の下限（これ未満は人へ）</span>
          <NumberInput
            label="全体の下限"
            value={th.floor}
            onChange={(v) => setTh({ ...th, floor: v })}
          />
        </div>
        <div className="row">
          <span>suspicious がこれ以上 → セキュリティ担当へ</span>
          <NumberInput
            label="suspicious のしきい値"
            value={th.suspicious}
            onChange={(v) => setTh({ ...th, suspicious: v })}
          />
        </div>
        <div className="row">
          <span>legal_threat がこれ以上 → 法務へ</span>
          <NumberInput
            label="legal_threat のしきい値"
            value={th.legal}
            onChange={(v) => setTh({ ...th, legal: v })}
          />
        </div>
        <div className="row">
          <span>multiple_requests がこれ以上 → 自動実行せず確認</span>
          <NumberInput
            label="multiple_requests のしきい値"
            value={th.multiple}
            onChange={(v) => setTh({ ...th, multiple: v })}
          />
        </div>
        <div className="row">
          <span>クレーム: complex_case 期待値がこれ以上 → 人へ</span>
          <NumberInput
            label="complex_case のしきい値"
            value={th.complaintHuman.complex_case}
            max={2}
            onChange={(v) => setCh("complex_case", v)}
          />
        </div>
        <div className="row">
          <span>クレーム: frustration 期待値がこれ以上 → 人へ</span>
          <NumberInput
            label="frustration のしきい値"
            value={th.complaintHuman.frustration}
            max={2}
            onChange={(v) => setCh("frustration", v)}
          />
        </div>
        <div className="row">
          <span>クレーム: urgency 期待値がこれ以上 → 人へ</span>
          <NumberInput
            label="urgency のしきい値"
            value={th.complaintHuman.urgency}
            max={2}
            onChange={(v) => setCh("urgency", v)}
          />
        </div>
      </div>
      <button
        type="button"
        className="reset"
        onClick={() => setTh(DEFAULT_THRESHOLDS)}
      >
        初期値に戻す
      </button>
    </section>
  );
}
