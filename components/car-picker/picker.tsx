"use client";

import { useRef, useState } from "react";
import { JevDrawer } from "@/components/common/jev-drawer";
import { ADJUSTABLE_FACTORS } from "@/lib/car-picker/answers";
import type { Confidence } from "@/lib/car-picker/confidence";
import type { ClassifyResult } from "@/lib/car-picker/jev";
import type { RankedGrade, RankedModel } from "@/lib/car-picker/rank";
import type { FollowUp } from "@/lib/car-picker/recommend";
import type { Color, ColorFamily } from "@/lib/car-picker/types";
import type { JevTrace } from "@/lib/common/jev-trace";
import { Answers, ConfidenceView } from "./answers";
import { HighlightChips } from "./chips";
import { Detail } from "./detail";
import { CarIcon, yen } from "./shared";

type Resp = {
  text: string;
  classify: ClassifyResult;
  rankMs: number;
  ranking: RankedModel[];
  confidence: Confidence;
  followUp: FollowUp | null;
  fallbackReason?: string;
  jev: JevTrace[];
};

type Rerank = {
  answers: ClassifyResult["answers"];
  jevCalls: 0;
  rankMs: number;
  ranking: RankedModel[];
  confidence: Confidence;
  followUp: FollowUp | null;
};

type Mode = "jev" | "offline";

const SAMPLES = [
  "家族四人（小学生２人）で乗れるセダン、ボディカラーは赤で、自動ブレーキで止まるやつ",
  "6人家族で、キャンプによく行く。雪国に住んでいる",
  "一人暮らし。とにかく安く済ませたい。ドラレコだけは欲しい",
  "駐車が苦手な妻がメインで運転する。SUVでかっこいいやつ",
  "保育園の送り迎えに使う。スライドドアで、花粉とにおいが気になる",
  "週末は夫婦でゴルフと温泉。長距離が多いので疲れにくい車。色は青か黒",
];

const TOP_N = 5;

export function Picker() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("jev");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<Resp | null>(null);
  const [model, setModel] = useState(0);
  const [grade, setGrade] = useState(0);
  const [colorOverride, setColorOverride] = useState<Record<string, string>>(
    {},
  );
  const [requests, setRequests] = useState(0);
  const [jevCalls, setJevCalls] = useState(0);
  const [weightMul, setWeightMul] = useState<Record<string, number>>({});
  const [rerankInfo, setRerankInfo] = useState<{
    ms: number;
    what: string;
  } | null>(null);
  const sliderTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [roundTripMs, setRoundTripMs] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const [jev, setJev] = useState<JevTrace[]>([]);

  async function run(input = text) {
    const body = input.trim();
    if (!body || loading) return;
    setLoading(true);
    const t0 = performance.now();
    try {
      const r = await fetch("/api/car-picker/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: body, mode }),
      });
      const next = (await r.json()) as Resp;
      if (!next.ranking) return;
      setRequests((n) => n + 1);
      setJevCalls((n) => n + next.classify.jevCalls);
      setWeightMul({});
      setRerankInfo(null);
      setResp(next);
      setJev(next.jev ?? []);
      setModel(0);
      setGrade(0);
      setColorOverride({});
      setShowAll(false);
      setRoundTripMs(Math.round(performance.now() - t0));
    } catch (err) {
      console.warn("recommend failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function rerank(
    what: string,
    patch: {
      overrides?: Record<string, string>;
      weightMul?: Record<string, number>;
    },
  ) {
    if (!resp) return;
    const t0 = performance.now();
    try {
      const r = await fetch("/api/car-picker/rerank", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answers: resp.classify.answers,
          source: resp.classify.source,
          overrides: patch.overrides,
          weightMul: patch.weightMul ?? weightMul,
        }),
      });
      const next = (await r.json()) as Rerank;
      if (!next.ranking) return;
      setResp({
        ...resp,
        classify: { ...resp.classify, answers: next.answers },
        ranking: next.ranking,
        confidence: next.confidence,
        followUp: next.followUp,
        rankMs: next.rankMs,
      });
      setModel(0);
      setGrade(0);
      setRerankInfo({ ms: Math.round(performance.now() - t0), what });
    } catch (err) {
      console.warn("rerank failed:", err);
    }
  }

  function setWeight(key: string, value: number) {
    const next = { ...weightMul, [key]: value };
    setWeightMul(next);
    clearTimeout(sliderTimer.current);
    sliderTimer.current = setTimeout(
      () => rerank("重みの変更", { weightMul: next }),
      200,
    );
  }

  const chosenColor = (rg: RankedGrade): Color =>
    rg.grade.colors.find((c) => c.id === colorOverride[rg.grade.id]) ??
    rg.build.color;

  const totalWith = (rg: RankedGrade, color: Color) =>
    rg.build.monthlyTotal - rg.build.color.monthlyPrice + color.monthlyPrice;

  const ranking = resp?.ranking ?? [];
  const rest = ranking.length - TOP_N;
  const current = ranking[model];

  return (
    <>
      <JevDrawer traces={jev} />
      <header className="hero">
        <div className="brand">
          <span className="logo">ソラカー Car Picker</span>
          <span className="badge">Jev 投機的ファンアウト検証</span>
        </div>
        <h1>どんなクルマを探していますか？</h1>
        <p className="lead">
          家族構成・使い方・色・こだわりを、話すように書いてください。車種 →
          グレード → 色 → オプションまで一度に提案します。
        </p>
        <p className="lead" style={{ fontSize: 12, opacity: 0.7 }}>
          ※
          架空の販売店・車名によるデモです。実在の販売店や車種とは関係ありません。
        </p>

        <form
          className="ask"
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                run();
              }
            }}
            placeholder="例: 家族四人（小学生２人）で乗れるセダン、ボディカラーは赤で、自動ブレーキで止まるやつ"
          />
          <button type="submit" disabled={loading} aria-label="おすすめを見る">
            <span className="go-label">おすすめを見る</span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>

        <div className="hero-foot">
          <div className="samples">
            {SAMPLES.map((s) => (
              <button
                type="button"
                key={s}
                title={s}
                onClick={() => {
                  setText(s);
                  run(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mode" role="radiogroup" aria-label="分類器">
            <label>
              <input
                type="radio"
                name="mode"
                value="jev"
                checked={mode === "jev"}
                onChange={() => setMode("jev")}
              />
              <span>Jev</span>
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="offline"
                checked={mode === "offline"}
                onChange={() => setMode("offline")}
              />
              <span>キーワード判定</span>
            </label>
          </div>
        </div>
      </header>

      {resp && (
        <>
          <Stats
            resp={resp}
            requests={requests}
            jevCalls={jevCalls}
            roundTripMs={roundTripMs}
            rerankInfo={rerankInfo}
          />
          <ConfidencePanel
            resp={resp}
            weightMul={weightMul}
            onPick={(field, value, label) =>
              rerank(`「${label}」の選択`, { overrides: { [field]: value } })
            }
            onWeight={setWeight}
            onResetWeights={() => {
              setWeightMul({});
              rerank("重みのリセット", { weightMul: {} });
            }}
          />
        </>
      )}

      {!resp && (
        <div className="empty">
          <div className="how">
            <div>
              <b>1</b>
              <span>
                要望を Jev に<strong>1回だけ</strong>
                問い合わせ（30問：選択6・スコア2・はい/いいえ22）。各項目は「言及があるか」と「どの値か」を別々に聞く
              </span>
            </div>
            <div>
              <b>2</b>
              <span>
                全車種・全グレードを採点して、上位 5 車種をおすすめ順に表示
              </span>
            </div>
            <div>
              <b>3</b>
              <span>
                車種・グレードを選ぶと、同じ回答からオプションを即決定（追加の呼び出しなし）
              </span>
            </div>
          </div>
        </div>
      )}

      {resp && current && (
        <main className={`results ${loading ? "loading" : ""}`}>
          <section className="list">
            <h2>
              おすすめ順{" "}
              <span className="h2-note">
                {ranking.length}車種すべてを採点し、上位
                {Math.min(TOP_N, ranking.length)}件を表示
              </span>
            </h2>
            <div>
              {ranking
                .slice(0, showAll ? ranking.length : TOP_N)
                .map((rm, i) => (
                  <CarCard
                    key={rm.model.key}
                    rm={rm}
                    index={i}
                    selected={i === model}
                    color={chosenColor(rm.best)}
                    total={totalWith(rm.best, chosenColor(rm.best))}
                    onSelect={() => {
                      setModel(i);
                      setGrade(0);
                      if (matchMedia("(max-width: 880px)").matches) {
                        detailRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }
                    }}
                  />
                ))}
              {rest > 0 && (
                <button
                  className="show-rest"
                  type="button"
                  onClick={() => {
                    if (showAll && model >= TOP_N) {
                      setModel(0);
                      setGrade(0);
                    }
                    setShowAll(!showAll);
                  }}
                >
                  {showAll ? "上位5件だけにする" : `6位以下の${rest}車種も見る`}
                </button>
              )}
            </div>
          </section>
          <div ref={detailRef}>
            <Detail
              ranked={current}
              gradeIndex={grade}
              wantFamily={
                resp.classify.answers.color.value as ColorFamily | "unspecified"
              }
              chosenColor={chosenColor}
              totalWith={totalWith}
              onSelectGrade={setGrade}
              onSelectColor={(gradeId, colorId) =>
                setColorOverride((o) => ({ ...o, [gradeId]: colorId }))
              }
            />
          </div>
        </main>
      )}

      {resp && (
        <Answers classify={resp.classify} confidence={resp.confidence} />
      )}
    </>
  );
}

function Stat({
  label,
  value,
  cls = "",
}: {
  label: string;
  value: string;
  cls?: string;
}) {
  return (
    <span className={`stat ${cls}`}>
      {label} <b>{value}</b>
    </span>
  );
}

function Stats({
  resp,
  requests,
  jevCalls,
  roundTripMs,
  rerankInfo,
}: {
  resp: Resp;
  requests: number;
  jevCalls: number;
  roundTripMs: number;
  rerankInfo: { ms: number; what: string } | null;
}) {
  const c = resp.classify;
  return (
    <div className="stats">
      {c.source === "jev" ? (
        <Stat label="Jev" value={`${c.latencyMs}ms`} cls="hl" />
      ) : (
        <Stat label="分類" value="キーワードルール（確率ではありません）" />
      )}
      <Stat label="質問" value={`${c.questionCount}問を1回で`} />
      {c.usage && (
        <Stat
          label="tokens"
          value={`${c.usage.input_tokens} / ${c.usage.output_tokens}`}
        />
      )}
      <Stat label="採点" value={`${resp.rankMs}ms`} />
      <Stat label="往復" value={`${roundTripMs}ms`} />
      <Stat label="Jev 呼び出し" value={`合計${jevCalls}回`} cls="hl" />
      {rerankInfo && (
        <Stat
          label={`${rerankInfo.what}で再ランク`}
          value={`Jev 呼び出し 0回・${rerankInfo.ms}ms`}
          cls="hl"
        />
      )}
      <span className="stat">
        車種・グレード・色の切り替えや再ランクでは増えません（要望の送信{" "}
        {requests}回）
      </span>
      {resp.fallbackReason && (
        <span className="stat warn">Jev 失敗のためキーワード判定</span>
      )}
    </div>
  );
}

function ConfidencePanel({
  resp,
  weightMul,
  onPick,
  onWeight,
  onResetWeights,
}: {
  resp: Resp;
  weightMul: Record<string, number>;
  onPick: (field: string, value: string, label: string) => void;
  onWeight: (key: string, value: number) => void;
  onResetWeights: () => void;
}) {
  const c = resp.confidence;
  const fu = resp.followUp;
  return (
    <section className={`conf ${c.available && c.low ? "low" : ""}`}>
      <ConfidenceView c={c} />
      {c.available && c.signals.length === 0 && (
        <div className="muted">
          要望から決め手になる条件をほとんど読み取れませんでした。ふつうの順で並べています。もう少し具体的に書くと精度が上がります。
        </div>
      )}
      {c.available && c.signals.length > 0 && (
        <div className="muted">読み取れた条件: {c.signals.join("・")}</div>
      )}
      {fu && (
        <div className="followup">
          <span>
            {c.available && c.weakest
              ? `自信が低い項目は「${fu.label}」。`
              : ""}
            どちらに近いですか？
          </span>
          {fu.options.map((o) => (
            <button
              type="button"
              key={o.value}
              onClick={() => onPick(fu.field, o.value, o.label)}
            >
              {o.label}？
            </button>
          ))}
          <span className="muted">
            押すとコードだけで並べ替えます（Jev は呼びません）
          </span>
        </div>
      )}
      <details className="weights">
        <summary>
          重みを変えてみる（コードだけで再ランク・Jev は呼びません）
        </summary>
        <div className="w-grid">
          {ADJUSTABLE_FACTORS.map((f) => (
            <label key={f.key}>
              <span>{f.label}</span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.25}
                value={weightMul[f.key] ?? 1}
                onChange={(e) => onWeight(f.key, Number(e.target.value))}
              />
              <span>×{(weightMul[f.key] ?? 1).toFixed(2)}</span>
            </label>
          ))}
        </div>
        <button type="button" onClick={onResetWeights}>
          重みをもとに戻す
        </button>
      </details>
    </section>
  );
}

function CarCard({
  rm,
  index,
  selected,
  color,
  total,
  onSelect,
}: {
  rm: RankedModel;
  index: number;
  selected: boolean;
  color: Color;
  total: number;
  onSelect: () => void;
}) {
  const rg = rm.best;
  return (
    <button
      type="button"
      className={`car ${selected ? "sel" : ""} ${index === 0 ? "first" : ""} ${index >= TOP_N ? "rest" : ""}`}
      onClick={onSelect}
    >
      <span className="rank">{index + 1}</span>
      <CarIcon
        bodyType={rm.model.bodyType}
        color={color}
        label={`${rm.model.name} ${color.name}`}
      />
      <div>
        <div className="name">
          {rm.model.name}
          <span className="type">{rm.model.bodyTypeLabel}</span>
        </div>
        <div className="match">
          <div className="meter">
            <i style={{ width: `${rm.score}%` }} />
          </div>
          <span>{Math.round(rm.score)}%</span>
        </div>
        <div className="price">
          {yen(total)}
          <small>/月</small>
        </div>
        <div className="sub">
          {rg.grade.name}・{color.name}
        </div>
      </div>
      <div className="hls">
        <HighlightChips rg={rg} />
      </div>
    </button>
  );
}
