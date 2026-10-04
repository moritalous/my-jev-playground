import {
  FIELD_LABELS,
  type FieldKey,
  QUESTION_MIX,
  VALUE_LABELS,
} from "@/lib/car-picker/answers";
import type { Confidence } from "@/lib/car-picker/confidence";
import type { ChoiceAnswer, ClassifyResult } from "@/lib/car-picker/jev";
import { TAG_LABELS } from "@/lib/car-picker/types";
import { pct } from "./shared";

function Bar({
  label,
  p,
  on,
  value = pct(p),
}: {
  label: string;
  p: number;
  on: boolean;
  value?: string;
}) {
  return (
    <div className={`pbar ${on ? "on" : ""}`}>
      <div className="track">
        <i style={{ width: `${Math.round(p * 100)}%` }} />
        <span>{label}</span>
      </div>
      <span className="v">{value}</span>
    </div>
  );
}

function Choice({
  field,
  x,
  offline,
}: {
  field: FieldKey;
  x: ChoiceAnswer;
  offline: boolean;
}) {
  const values = Object.entries(x.raw).sort((p, q) => q[1] - p[1]);
  return (
    <div>
      <h4>{FIELD_LABELS[field]}</h4>
      <Bar
        label="言及あり（_stated）"
        p={x.stated}
        on={x.stated >= 0.5}
        value={offline ? (x.stated ? "該当" : "—") : pct(x.stated)}
      />
      {offline
        ? x.stated >= 0.5 && (
            <Bar label={VALUE_LABELS[x.top] ?? x.top} p={1} on value="該当" />
          )
        : values
            .slice(0, 3)
            .map(([k, p]) => (
              <Bar
                key={k}
                label={VALUE_LABELS[k] ?? k}
                p={p}
                on={k === x.top && x.stated >= 0.5}
              />
            ))}
    </div>
  );
}

function Level({
  score,
  levels,
  offline,
}: {
  score: number;
  levels: string[];
  offline: boolean;
}) {
  return (
    <Bar
      label={levels[Math.round(score)] ?? ""}
      p={score / 2}
      on={score >= 1}
      value={offline ? `level ${score}` : `${score.toFixed(2)}/2`}
    />
  );
}

function TagBars({
  tags,
  offline,
}: {
  tags: [string, number][];
  offline: boolean;
}) {
  return (
    <div>
      {tags.map(([t, p]) => (
        <Bar
          key={t}
          label={TAG_LABELS[t] ?? t}
          p={p}
          on={p >= 0.6}
          value={offline ? (p ? "該当" : "—") : pct(p)}
        />
      ))}
    </div>
  );
}

export function ConfidenceView({ c }: { c: Confidence }) {
  if (!c.available) return <p className="muted">{c.note}</p>;
  return (
    <>
      <div className="conf-line">
        全体の確信度 <b>{pct(c.overall)}</b>{" "}
        <span className="muted">
          （決め手になった回答のうち最も弱いもの。しきい値 {pct(c.threshold)}）
        </span>
      </div>
      {c.items.slice(0, 3).map((i) => (
        <Bar
          key={i.key}
          label={`${i.label}：${i.detail}`}
          p={i.confidence}
          on={i.confidence >= c.threshold}
        />
      ))}
    </>
  );
}

export function Answers({
  classify: c,
  confidence,
}: {
  classify: ClassifyResult;
  confidence: Confidence;
}) {
  const a = c.answers;
  const offline = c.source === "offline";
  const tags = Object.entries(a.tags)
    .filter(([t]) => !["safetyMax", "snow", "kids"].includes(t))
    .sort((x, y) => y[1] - x[1]);
  const half = Math.ceil(tags.length / 2);
  return (
    <section id="jev" className="jev">
      <details open>
        <summary>
          {offline ? "キーワードルールの判定" : "Jev の判断"}{" "}
          <span className="muted">
            {c.questionCount}問（選択{QUESTION_MIX.choice}・スコア
            {QUESTION_MIX.score}・はい/いいえ{QUESTION_MIX.noul}）
            {offline ? "" : `・${c.latencyMs}ms`}
          </span>
        </summary>
        <div className="answers">
          <div className="conf-box">
            <h4>確信度（weakest link）</h4>
            <ConfidenceView c={confidence} />
          </div>
          <div className="grp-title">
            車種選び用（選択5項目＝「言及あり」＋「どの値か」の組。ボディタイプは選択肢を逆順にした2回目も聞いて平均）
          </div>
          {(
            ["bodyType", "partySize", "color", "fuel", "gradePref"] as const
          ).map((f) => (
            <Choice key={f} field={f} x={a[f]} offline={offline} />
          ))}
          <div>
            <h4>重視度</h4>
            <Level
              score={a.budget.score}
              levels={[
                "価格に触れていない",
                "予算を気にしている",
                "安さが最優先",
              ]}
              offline={offline}
            />
            <Level
              score={a.safety.score}
              levels={["安全に触れていない", "基本の安全装備", "上位まで充実"]}
              offline={offline}
            />
          </div>
          <div>
            <h4>はい / いいえ</h4>
            <Bar
              label="子どもが乗る"
              p={a.kidsOnBoard}
              on={a.kidsOnBoard >= 0.6}
            />
            <Bar
              label="スライドドアが欲しい"
              p={a.slideDoor}
              on={a.slideDoor >= 0.6}
            />
            <Bar label="4WD・雪道・悪路" p={a.awd} on={a.awd >= 0.6} />
          </div>
          <div className="grp-title">
            オプション選び用（14問・車種が決まる前に聞いておく／60%以上で「要望あり」。安全の上位・雪道・子どもは上の回答から導出するので聞き直しません）
          </div>
          <TagBars tags={tags.slice(0, half)} offline={offline} />
          <TagBars tags={tags.slice(half)} offline={offline} />
        </div>
      </details>
    </section>
  );
}
