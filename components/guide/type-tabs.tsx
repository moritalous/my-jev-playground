"use client";

import { useState } from "react";

type Row = { label: string; p: number };
type Example = {
  key: string;
  tab: string;
  nickname: string;
  state: string;
  question: string;
  rows: Row[];
  headline: string;
  note: string;
};

const EXAMPLES: Example[] = [
  {
    key: "noul",
    tab: "noul（はい／いいえ）",
    nickname: "「当てはまる？」を確率で答える",
    state: "「今すぐ振り込まないと、口座が止まります！」",
    question: "この文は、お金を要求していますか？",
    rows: [
      { label: "はい", p: 0.97 },
      { label: "いいえ", p: 0.03 },
    ],
    headline: "97%",
    note: "0.5 付近は「中くらい」ではなく「どちらとも言えない」。程度を比べたいときは score を使います。",
  },
  {
    key: "choice",
    tab: "choice（どれ？）",
    nickname: "選択肢のどれかを、確率つきで選ぶ",
    state: "「届いた冷蔵庫、ドアが閉まらないんです」",
    question: "この問い合わせは、どの種類ですか？",
    rows: [
      { label: "修理", p: 0.71 },
      { label: "返品", p: 0.24 },
      { label: "その他", p: 0.05 },
    ],
    headline: "修理",
    note: "決められた選択肢の外の答えは作りません。「その他」「特に言及なし」の逃げ道を用意しておくのがコツ。",
  },
  {
    key: "score",
    tab: "score（どのくらい？）",
    nickname: "段階のどのあたりかを、数字で答える",
    state: "「まあまあでした。悪くはないけど、また買うかは微妙」",
    question: "この人は、どのくらい満足していますか？（0〜4の5段階）",
    rows: [
      { label: "0 とても不満", p: 0.03 },
      { label: "1 不満", p: 0.22 },
      { label: "2 ふつう", p: 0.55 },
      { label: "3 満足", p: 0.18 },
      { label: "4 とても満足", p: 0.02 },
    ],
    headline: "2.0 くらい",
    note: "各段階の確率から期待値を出します。商品どうしを「どっちがより〜か」で並べたいときに向いています。",
  },
];

export function TypeTabs() {
  const [key, setKey] = useState(EXAMPLES[0]?.key ?? "noul");
  const ex = EXAMPLES.find((e) => e.key === key) ?? EXAMPLES[0];
  if (!ex) return null;

  return (
    <div className="tabs">
      <div className="tablist" role="tablist">
        {EXAMPLES.map((e) => (
          <button
            key={e.key}
            type="button"
            role="tab"
            aria-selected={e.key === key}
            className={e.key === key ? "tab on" : "tab"}
            onClick={() => setKey(e.key)}
          >
            {e.tab}
          </button>
        ))}
      </div>
      <div className="tabpanel" role="tabpanel">
        <p className="nick">{ex.nickname}</p>
        <div className="qa">
          <div className="qa-box">
            <span className="qa-tag">状況（state）</span>
            <p>{ex.state}</p>
          </div>
          <div className="qa-box">
            <span className="qa-tag">質問</span>
            <p>{ex.question}</p>
          </div>
          <div className="qa-arrow" aria-hidden="true">
            ↓ Jev
          </div>
          <div className="qa-box answer">
            <span className="qa-tag">答え</span>
            <p className="big">{ex.headline}</p>
            <ul className="bars">
              {ex.rows.map((r) => (
                <li key={r.label}>
                  <span className="bar-label">{r.label}</span>
                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{ width: `${Math.round(r.p * 100)}%` }}
                    />
                  </span>
                  <span className="bar-num">{Math.round(r.p * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="tabnote">{ex.note}</p>
      </div>
    </div>
  );
}
