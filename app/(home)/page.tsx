const apps = [
  {
    href: "/dinner",
    name: "今夜なに作る？",
    description: "自由入力から、今夜の献立（主菜・副菜・汁物）を選びます。",
  },
  {
    href: "/persona",
    name: "新規事業ウケるかな？パネル",
    description:
      "新規事業のアイデアに対する100人のパネリストの反応を判定します。",
  },
  {
    href: "/search-filter",
    name: "探してるものだけ表示",
    description:
      "Amazon の検索結果に混ざる、探していない商品を見分けて、探しているものだけを残します。",
  },
  {
    href: "/router",
    name: "問い合わせ振り分け",
    description:
      "お客様の問い合わせを1回で分類し、確信度としきい値で自動対応・確認・人間に振り分けます。",
  },
  {
    href: "/car-picker",
    name: "ソラカー Car Picker",
    description:
      "自然文の要望から、ソラカーの車種・グレード・色をおすすめ順に出します。",
  },
];

export default function Home() {
  return (
    <main className="wrap">
      <h1>my-jev-playground</h1>
      <p className="lead">
        TypeSafe AI の System One モデル Jev を使ったサンプルアプリ集です。
      </p>
      <p className="lead">
        <a href="/guide">Jev ってなに？ どう使っているの？（やさしい解説）→</a>
      </p>
      <ul className="grid">
        {apps.map((app) => (
          <li key={app.href}>
            <a className="card" href={app.href}>
              <h2>{app.name}</h2>
              <p>{app.description}</p>
              <span className="route">{app.href}</span>
            </a>
          </li>
        ))}
      </ul>
      <footer>
        各アプリは独立したスタイルを持つため、移動時はページ全体が読み込まれます。
      </footer>
    </main>
  );
}
