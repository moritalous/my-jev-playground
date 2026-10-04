"use client";

import { useState } from "react";
import { JevDrawer } from "@/components/common/jev-drawer";
import type { JevTrace } from "@/lib/common/jev-trace";
import {
  type Choice,
  isUnsure,
  isWanted,
  LABELS,
} from "@/lib/search-filter/score";

type ProductView = {
  id: string;
  title: string | null;
  brand: string | null;
  color: string | null;
};
type QueryView = {
  query: string;
  products: ProductView[];
};
type JudgeResponse = {
  answers: Record<number, Choice>;
  stats: {
    ms: number;
    questions: number;
    requests: number;
    costUsd: number;
  };
  jev: JevTrace[];
};

const pct = (p: number | undefined) => `${Math.round((p ?? 0) * 100)}%`;

export function Demo({
  hasKey,
  queries,
}: {
  hasKey: boolean;
  queries: QueryView[];
}) {
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Record<number, Choice>>({});
  const [stats, setStats] = useState("");
  const [running, setRunning] = useState(false);
  const [only, setOnly] = useState(false);
  const [jev, setJev] = useState<JevTrace[]>([]);

  const q = queries[current];

  function select(i: number) {
    setCurrent(i);
    setResults({});
    setStats("");
  }

  async function run() {
    setResults({});
    setRunning(true);
    setStats("判定中…");
    try {
      const res = await fetch(`/api/search-filter/judge/${current}`);
      if (!res.ok) {
        setJev([]);
        setStats(await res.text());
        return;
      }
      const data = (await res.json()) as JudgeResponse;
      setResults(data.answers);
      setJev(data.jev ?? []);
      const answers = Object.values(data.answers);
      const wanted = answers.filter(isWanted).length;
      const unsure = answers.filter(isUnsure).length;
      const s = data.stats;
      setStats(
        `探してるもの ${wanted}/${q.products.length}件（うち迷い ${unsure}件） ・ Jev ${s.requests}回で ${s.questions}問 ・ ${s.ms}ms ・ $${s.costUsd.toFixed(4)}`,
      );
    } catch (e) {
      setStats(`エラー: ${String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <JevDrawer traces={jev} />
      <header className="top">
        <h1>探してるものだけ表示</h1>
        <p>
          Amazon の検索結果には、探していない商品が混ざります。Jev（TypeSafe）
          が各商品を見分けて、探しているものだけを残します。緑に光るのが探してるもの、🚫
          は探してないもの、点線の「Jev
          が迷った」は確信度が低い判定です。データ: Amazon Shopping Queries
          Dataset（ESCI, Apache-2.0）日本語サブセット。
        </p>
      </header>
      {!hasKey && (
        <div className="warn">
          TYPESAFE_API_KEY が未設定です。商品の一覧だけを表示しています。
        </div>
      )}
      <div className="bar">
        <select
          value={current}
          onChange={(e) => select(Number(e.target.value))}
          aria-label="検索キーワード"
        >
          {queries.map((x, i) => (
            <option key={x.query} value={i}>
              {x.query}（{x.products.length}件）
            </option>
          ))}
        </select>
        <button
          type="button"
          className="primary"
          disabled={!hasKey || running}
          onClick={run}
        >
          Jev で判定
        </button>
        <label className="toggle">
          <input
            type="checkbox"
            checked={only}
            onChange={(e) => setOnly(e.target.checked)}
          />{" "}
          探してるものだけ表示
        </label>
        <span className="stats">{stats}</span>
      </div>
      <div className="query">
        <span className="q">{q.query}</span>
      </div>
      <main className="grid">
        {q.products.map((p, i) => {
          const r = results[i];
          const cls = ["card"];
          if (r) cls.push(isWanted(r) ? "go" : "stop");
          if (only && r && !isWanted(r)) cls.push("hidden");
          return (
            <div
              className={cls.join(" ")}
              key={p.id}
              title={
                r
                  ? `本命 ${pct(r.probabilities.exact)} / 代わり ${pct(r.probabilities.substitute)} / おまけ ${pct(r.probabilities.complement)} / 無関係 ${pct(r.probabilities.irrelevant)} ・ 確信度 ${r.confidence.toFixed(2)}`
                  : undefined
              }
            >
              <div className="title">{p.title}</div>
              <div className="meta">
                {p.brand}
                {p.color ? ` ・ ${p.color}` : ""}
              </div>
              {r ? (
                <div className="chips">
                  <span className={`chip ${isWanted(r) ? "yes" : ""}`}>
                    {LABELS[r.choice] ?? r.choice}{" "}
                    {pct(r.probabilities[r.choice])}
                  </span>
                  {isUnsure(r) ? (
                    <span className="chip unknown">
                      Jev が迷った（確信度 {r.confidence.toFixed(2)}）
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="ban" aria-hidden="true">
                🚫
              </div>
            </div>
          );
        })}
      </main>
    </>
  );
}
