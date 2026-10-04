import { EXAMPLES, type ExampleQuestion } from "./examples";

type AppKey = keyof typeof EXAMPLES;

function QuestionCard({ q }: { q: ExampleQuestion }) {
  return (
    <div className="qcard">
      <div className="qhead">
        <span className={`type type-${q.type}`}>{q.type}</span>
        <code className="qid">{q.id}</code>
      </div>
      <p className="qask">{q.ask}</p>
      {q.extra ? (
        <div className="qextra">
          <span className="qlabel">この質問に入れているデータ</span>
          <pre className="code">{q.extra}</pre>
        </div>
      ) : null}
      <ul className="qopts">
        {q.options.map((o) => (
          <li key={`${o.label}-${o.desc}`} className={o.picked ? "pick" : ""}>
            <span className="qopt-name">
              {q.type === "noul" ? "" : <b>{o.label}</b>}
              {o.desc ? <span className="qopt-desc"> {o.desc}</span> : null}
            </span>
            <span className="bar-track">
              <span
                className="bar-fill"
                style={{ width: `${Math.round(o.p * 100)}%` }}
              />
            </span>
            <span className="bar-num">{Math.round(o.p * 100)}%</span>
          </li>
        ))}
      </ul>
      <p className="qresult">→ {q.result}</p>
    </div>
  );
}

export function AppExample({ app }: { app: AppKey }) {
  const ex = EXAMPLES[app];
  return (
    <div className="example">
      <p className="exnote">
        実際に Jev に送って、返ってきた答えの例です。1回のリクエストで、次の
        <strong>状況（state）</strong>に対して、
        <strong>{ex.questions.length}問</strong>
        をまとめて聞いています。
      </p>

      <span className="qlabel">状況（state）</span>
      <pre className="code">{ex.state}</pre>

      <span className="qlabel">聞いたことと、返ってきた答え</span>
      {ex.questions.map((q) => (
        <QuestionCard key={q.id} q={q} />
      ))}

      <p className="exmulti">
        <strong>アプリ全体では：</strong>
        {ex.multiplier}
      </p>
      <p className="muted">{ex.note}</p>
    </div>
  );
}
