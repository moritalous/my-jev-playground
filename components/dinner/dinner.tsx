"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import { JevDrawer } from "@/components/common/jev-drawer";
import type { JevTrace } from "@/lib/common/jev-trace";
import type {
  DishResult,
  MainRecommendation,
  SideRecommendation,
  Stats,
} from "@/lib/dinner/types";

const EXAMPLES = [
  "疲れているので、ご飯が進む和食がいい",
  "子どもが喜ぶ洋食。野菜も食べさせたい",
  "ビールに合う、さっぱりした夜ごはん",
  "冷蔵庫に豚こまとキャベツと豆腐。簡単なのがいい",
  "豚肉は食べられない。がっつり食べたい",
];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as T;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function Dinner() {
  const [text, setText] = useState("");
  const [request, setRequest] = useState("");
  const [mains, setMains] = useState<MainRecommendation | null>(null);
  const [selected, setSelected] = useState("");
  const [sides, setSides] = useState<SideRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sideSeq = useRef(0);
  const resultRef = useRef<HTMLElement>(null);
  const winnerRef = useRef<HTMLDivElement>(null);
  const [mainsJev, setMainsJev] = useState<JevTrace[]>([]);
  const [sidesJev, setSidesJev] = useState<JevTrace[]>([]);

  async function selectMain(menu: string, req: string) {
    setSelected(menu);
    setSides(null);
    setSidesJev([]);
    const seq = ++sideSeq.current;
    try {
      const res = await post<SideRecommendation>("/api/dinner/sides", {
        request: req,
        main: menu,
      });
      if (seq !== sideSeq.current) return;
      setSides(res);
      setSidesJev(res.jev ?? []);
    } catch (err) {
      if (seq === sideSeq.current) setError((err as Error).message);
    }
  }

  async function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await post<MainRecommendation>("/api/dinner/recommend", {
        request: trimmed,
      });
      setRequest(trimmed);
      setMains(res);
      setMainsJev(res.jev ?? []);
      setSidesJev([]);
      const top = res.items[0];
      if (top) {
        void selectMain(top.menu, trimmed);
      } else {
        sideSeq.current++;
        setSelected("");
        setSides(null);
      }
      setTimeout(
        () =>
          resultRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        0,
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit(text);
  }

  const okSides = sides?.sides ?? [];
  const okSoups = sides?.soups ?? [];
  const others = (list: DishResult[], n: number) =>
    list.slice(1, 1 + n).map((s) => s.menu);

  const main = mains?.items.find((m) => m.menu === selected);
  const jevTraces = useMemo(
    () => [...mainsJev, ...sidesJev],
    [mainsJev, sidesJev],
  );

  const total: Stats | null = mains
    ? {
        requests: mains.stats.requests + (sides?.stats.requests ?? 0),
        questions: mains.stats.questions + (sides?.stats.questions ?? 0),
        input_tokens:
          mains.stats.input_tokens + (sides?.stats.input_tokens ?? 0),
        output_tokens:
          mains.stats.output_tokens + (sides?.stats.output_tokens ?? 0),
        ms: mains.stats.ms + (sides?.stats.ms ?? 0),
      }
    : null;

  return (
    <main>
      <JevDrawer traces={jevTraces} />
      <header>
        <h1>🍳 今夜なに作る？</h1>
        <p className="sub">
          冷蔵庫の中身、気分、昨日のごはん、一緒に食べる人、食べたくないもの…なんでも自由に書いてください。
        </p>
      </header>

      <form onSubmit={onSubmit}>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例：昨日はカレーだった。冷蔵庫に豚こまとキャベツ。疲れてるのでさっぱり簡単なのがいい"
          required
        />
        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="chip"
              disabled={loading}
              onClick={() => {
                setText(ex);
                void submit(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
        <button type="submit" id="submit" disabled={loading}>
          {loading ? "Jevが考え中…" : "考えてもらう"}
        </button>
      </form>

      {mains && total && (
        <section id="result" ref={resultRef}>
          <div className="card winner" ref={winnerRef}>
            {main ? (
              <>
                <Course label="主菜" text={main.menu} cls="dish" />
                {!sides ? (
                  <Course label="副菜" text="考え中…" cls="dish side pending" />
                ) : (
                  <>
                    {okSides[0] && (
                      <>
                        <Course
                          label="副菜"
                          text={okSides[0].menu}
                          cls="dish side"
                        />
                        <Alt list={others(okSides, 3)} />
                      </>
                    )}
                    {okSoups[0] && (
                      <>
                        <Course
                          label="汁物"
                          text={okSoups[0].menu}
                          cls="dish side"
                        />
                        <Alt list={others(okSoups, 2)} />
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              "候補が見つかりませんでした。"
            )}
          </div>

          <h2>
            主菜の候補 <small>タップで主菜を変更</small>
          </h2>
          <ol className="ranking">
            {mains.items.map((c) => (
              <li key={c.menu}>
                <button
                  type="button"
                  className={`rank-item${c.menu === selected ? " selected" : ""}`}
                  onClick={() => {
                    if (c.menu !== selected) void selectMain(c.menu, request);
                    winnerRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                >
                  <span className="name">{c.menu}</span>
                  <span className="bar">
                    <span style={{ width: `${Math.max(2, c.p * 100)}%` }} />
                  </span>
                  <span className="num">{pct(c.p)}</span>
                  {c.desc && <span className="nums">{c.desc}</span>}
                </button>
              </li>
            ))}
          </ol>

          {sides && (
            <details>
              <summary>副菜・汁物の候補と数値</summary>
              <SideTable title="副菜" list={okSides} />
              <SideTable title="汁物" list={okSoups} />
            </details>
          )}

          <p className="hint">
            主菜 {mains.total}品・副菜と汁物 {sides?.total ?? "…"}
            品のそれぞれに、Jev
            が「今夜にふさわしいか」を1問ずつ答えました（数値は「はい」の確率）。並べ替えはコードが行っています。
          </p>

          <p className="meta">
            {mains.model} ・ 主菜 {line(mains.stats)}
            {sides && <> / 副菜・汁物 {line(sides.stats)}</>} ・ 合計{" "}
            {total.requests}リクエスト・{total.questions}問・tokens 入力{" "}
            {total.input_tokens.toLocaleString()} / 出力{" "}
            {total.output_tokens.toLocaleString()}・{total.ms.toLocaleString()}
            ms
          </p>
        </section>
      )}

      {error && <p className="error">エラー: {error}</p>}
    </main>
  );
}

function line(s: Stats): string {
  return `${s.requests}リクエスト・${s.questions}問・${s.ms.toLocaleString()}ms`;
}

function SideTable({ title, list }: { title: string; list: DishResult[] }) {
  return (
    <>
      <h2>{title}</h2>
      <ul className="side-table">
        {list.map((s) => (
          <li key={s.menu}>
            <span className="name">{s.menu}</span>
            <span className="nums">
              ふさわしい確率 {pct(s.p)}
              {s.desc && ` ・ ${s.desc}`}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Course({
  label,
  text,
  cls,
}: {
  label: string;
  text: string;
  cls: string;
}) {
  return (
    <div className="course">
      <span className="label">{label}</span>
      <span className={cls}>{text}</span>
    </div>
  );
}

function Alt({ list }: { list: string[] }) {
  return <p className="alt">他にも：{list.join(" / ")}</p>;
}
