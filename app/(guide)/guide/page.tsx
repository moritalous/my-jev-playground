import { AppExample } from "@/components/guide/example";
import { SAMPLE_REQUEST, SAMPLE_RESPONSE } from "@/components/guide/sample";
import { TypeTabs } from "@/components/guide/type-tabs";

type AppGuide = {
  id: string;
  href: string;
  name: string;
  want: string;
  state: string;
  flow: [string, string, string, string];
  point: string;
  code: string[];
  patterns: { name: string; slug: string }[];
  caution?: string;
};

const APPS: AppGuide[] = [
  {
    id: "dinner",
    href: "/dinner",
    name: "今夜なに作る？",
    want: "「疲れた」「ご飯が進む和食がいい」といった一言から、今夜の献立を決めたい。",
    state:
      "ユーザーの状況（自由入力）と、あなたのタスク（今夜の主菜を決める）。副菜を選ぶときは、選んだ主菜も加える。料理名は、料理ごとの質問のほうに入れる。",
    patterns: [{ name: "Speculative Fan-Out", slug: "fan-out" }],
    flow: [
      "自由入力 1文",
      "料理ごとに1問（主菜196問）を、1リクエストに並べる",
      "「ふさわしい」の確率",
      "確率の高い順に並べる（副菜・汁物も同じ形で1リクエスト）",
    ],
    point:
      "「探してるものだけ表示」と同じ形です。196品に1問ずつ聞いても1リクエストで、約0.3秒・入力約9,300トークンでした。順位は「はい」の確率で付けます。確信度（迷いのなさ）で選ぶと、「ふさわしくない」と自信満々に答えた料理が上に来てしまったので、確信度は順位には使いません。",
    code: [
      "候補の料理の一覧を持つ（Jev に献立を考えさせない。決まった候補が、今夜にふさわしいかを聞く）",
      "確率の高い順に並べ、1位の主菜に合わせて副菜・汁物をもう1回聞く",
    ],
  },
  {
    id: "persona",
    href: "/persona",
    name: "新規事業ウケるかな？パネル",
    want: "新規事業のアイデアに、いろんな立場の人がどのくらい興味を持つかを眺めたい。",
    state:
      "新規事業のアイデア文。パネリスト（人物）の紹介は、質問のほうに入れる。",
    patterns: [{ name: "Speculative Fan-Out", slug: "fan-out" }],
    flow: [
      "アイデア 1文",
      "100人 × 2問 = 200問",
      "興味の度合いと確率",
      "陣地に並べる",
    ],
    point:
      "200問を、分けずに1回で投げます。Jev はまとめて並列に答えるので、1.5秒ほどで100人分が返ってきます。速さと並列性を見せるデモです。",
    code: [
      "パネリストの一覧を持つ",
      "結果に合わせて、アバターを陣地に並べて動かす",
    ],
    caution:
      "実在の人物がモデルでも、これは AI による推定です。本人の考えではありません。",
  },
  {
    id: "searchfilter",
    href: "/search-filter",
    name: "探してるものだけ表示",
    want: "Amazon の検索結果には、探していない商品が混ざる。検索したものだけが出てほしい。",
    state:
      "検索キーワードだけ。商品のタイトルは、商品ごとの質問のほうに入れる。",
    patterns: [
      { name: "Speculative Fan-Out", slug: "fan-out" },
      { name: "Confidence-Gated Routing", slug: "confidence-routing" },
    ],
    flow: [
      "検索キーワード 1つ",
      "商品ごとに1問（16〜27問）を、1リクエストに並べる",
      "確率と確信度",
      "探してるもの（緑）と、探してないもの（🚫）。迷いは点線で表示",
    ],
    point:
      "同じ検索キーワード（state）に対する質問を、商品ごとに1問ずつ、まとめて1回で聞きます。395商品でも24リクエストです（商品ごとに分けた場合は395回）。本命と判定された商品だけを「探してるもの」として残し、確信度が低い判定には「Jev が迷った」と印を付けます。",
    code: [
      "商品のタイトルを質問に入れる、質問の組み立てと、受け取った確率の集計",
      "「探してるもの」かどうかの判定と、確信度による「迷い」の印（しきい値はコード側の定数）",
      "検索結果の取得（このデモでは、あらかじめ用意したデータ）",
    ],
  },
  {
    id: "router",
    href: "/router",
    name: "問い合わせ振り分け",
    want: "お客さんの問い合わせを分類して、自動で対応するか、確認するか、人に回すかを決めたい。",
    state:
      "問い合わせの文、お客さんの注文と会員プラン、返金のルール。質問は、パス（`customer.orders[0]` など）で指す。",
    patterns: [
      { name: "Intent Routing", slug: "intent-routing" },
      { name: "Confidence-Gated Routing", slug: "confidence-routing" },
      { name: "Speculative Fan-Out", slug: "fan-out" },
    ],
    flow: [
      "問い合わせ 1通",
      "9問を一度に（意図、緊急度、不満、返金の期限内か、など）",
      "確率と確信度",
      "自動で実行 / 確認する / 人に回す",
    ],
    point:
      "処理の危険度で、必要な確信度を変えます。注文状況の自動返信は 0.6 以上、返金と解約は 0.85 以上で自動です。中間は確認、低ければ人に回します。不審なメッセージと法的な脅しは、意図に関係なく人に回します。選択肢を逆の並びにした同じ質問で、順番の偏りも確かめます。",
    code: [
      "意図に応じた処理先の選択と、危険度ごとのしきい値、確信度の「最も弱い環」の計算",
      "返金期限の計算はしない。日数は state に入れ、ルールの文と照らし合わせるだけにする",
      "実際の返金や解約は実行しない（このデモは、判定までを見せる）",
    ],
  },
  {
    id: "carpicker",
    href: "/car-picker",
    name: "ソラカー Car Picker",
    want: "「家族4人で乗れるセダン、赤、自動ブレーキ」のようなふわっとした希望から、車を選びたい。",
    state:
      "ユーザーの要望文だけ。車の情報はカタログ側にあり、Jev には渡さない。",
    patterns: [
      { name: "Speculative Fan-Out", slug: "fan-out" },
      { name: "Confidence-Gated Routing", slug: "confidence-routing" },
      { name: "Composite Scoring", slug: "composite-scoring" },
    ],
    flow: [
      "要望 1文",
      "30問を一度に",
      "確率と確信度",
      "おすすめ順 + 迷った項目の聞き返し",
    ],
    point:
      "「言及があるか」と「どの値か」を別の質問にします。書かれていない項目を、Jev が無理に埋めません。あとで使うかもしれない質問も最初にまとめて聞くので（投機的ファンアウト）、往復は1回です。確信度の低い項目は聞き返し、答えが決まったら Jev を呼び直さずに並べ直します。",
    code: [
      "価格や装備などの事実は、カタログから取る（Jev に数字を作らせない）",
      "言及の確率に応じて、項目の影響を弱める。決め手になった答えのうち、一番確信度が低いものを全体の確信度にする",
      "車種が決まったら、聞いておいた答えのうち必要なものだけを使ってオプションを選ぶ。重みを変えるスライダーも、コードだけで並べ直す",
    ],
  },
];

export default function Page() {
  return (
    <main className="guide">
      <header className="hero">
        <p className="eyebrow">やさしい解説</p>
        <h1>
          Jev って、
          <wbr />
          なに？
        </h1>
        <p className="lead">
          文章を書かない、<strong>おそろしく速い「判定係」</strong>
          です。
          <br />
          「当てはまる？」「どのくらい？」にだけ、数字で答えてくれます。
        </p>
        <nav className="toc" aria-label="目次">
          <a href="#what">たとえ話</a>
          <a href="#state">状況（state）</a>
          <a href="#types">質問の3種類</a>
          <a href="#json">実物のJSON</a>
          <a href="#traits">とくちょう</a>
          <a href="#shapes">候補が多いとき</a>
          <a href="#apps">5つのアプリ</a>
          <a href="#care">気をつけること</a>
        </nav>
      </header>

      <section id="what" className="block">
        <h2>1. たとえ話：先生と採点係</h2>
        <p>
          プログラム（コード）が<strong>先生</strong>、Jev が
          <strong>採点係</strong>だと思ってください。
        </p>
        <div className="roles">
          <div className="role code">
            <h3>先生（コード）</h3>
            <ul>
              <li>段取りを決める</li>
              <li>データを用意する</li>
              <li>最後に集計して、順位をつける</li>
              <li>実際に何かを実行する</li>
            </ul>
          </div>
          <div className="roles-mid" aria-hidden="true">
            <span>状況 + 質問 →</span>
            <span>← 確率</span>
          </div>
          <div className="role jev">
            <h3>採点係（Jev）</h3>
            <ul>
              <li>1問ごとに「どのくらい？」だけ答える</li>
              <li>答えは「92%」のような数字</li>
              <li>作文はしない・説明もしない</li>
              <li>たくさんの問題を、いっせいに採点する</li>
            </ul>
          </div>
        </div>
        <p className="muted">
          だから、ふつうのコードが苦手な「言葉の意味を読み取る」部分だけを Jev
          に任せて、残りはこれまでどおりコードで書けます。
        </p>
      </section>

      <section id="state" className="block">
        <h2>2. 状況（state）：審査員に見せる資料</h2>
        <p>
          Jev に質問するときは、判断の<strong>材料</strong>
          もいっしょに渡します。これを<strong>状況（state）</strong>
          と呼びます。審査員の前に、判定に必要な資料を並べるイメージです。
        </p>
        <div className="statecols">
          <div>
            <h3>こんなふうに渡す</h3>
            <pre className="code">{`{
  "customer_message": "届いた冷蔵庫のドアが閉まりません",
  "order": { "item": "冷蔵庫", "days_since": 3 },
  "refund_policy": "到着後14日以内なら返品可"
}`}</pre>
            <p className="muted">
              文字列でも渡せますが、いくつかの情報があるときは、
              <strong>名前をつけた JSON</strong>
              が基本です。何がどの情報か、はっきりします。
            </p>
          </div>
          <div>
            <h3>質問は、名前で資料を指せる</h3>
            <pre className="code">{`質問: \`order.days_since\` と
\`refund_policy\` を見て、
この返品は認められる？`}</pre>
            <p className="muted">
              質問の中で、資料のどこを見るかを名前（パス）で示せるので、迷わず判断できます。
            </p>
          </div>
        </div>
        <ul className="statepoints">
          <li>
            <strong>質問ぜんぶが、同じ状況を見ます。</strong>
            各質問は互いの答えを見ずに、独立して判断します。だから 200
            問でも、いっせいに並列で答えられます。
          </li>
          <li>
            <strong>必要な情報は、状況に入れます。</strong>
            Jev
            は最新の事実を覚えていません。在庫・価格・規約などは、コードがデータベースから取って渡します。
          </li>
          <li>
            <strong>渡せるのはテキストだけです。</strong>
            文字列・JSON・配列。画像や音声は（今のところ）渡せません。
          </li>
        </ul>
        <p className="muted">
          どのアプリが、何を状況として渡しているかは、下の「5つのアプリ」で見られます。
        </p>
      </section>

      <section id="types" className="block">
        <h2>3. 質問は3種類だけ</h2>
        <p>
          聞きたいことの<strong>答えの形</strong>
          で、使い分けます。タブを切り替えて、
          どんな答えが返ってくるか見てみてください。
        </p>
        <TypeTabs />
      </section>

      <section id="json" className="block">
        <h2>4. 実物のリクエストとレスポンス</h2>
        <p>
          ここまでの話を、そのままの形で見てみましょう。
          <code>POST https://api.typesafe.ai/v1/systemone</code>
          に、<strong>状況（state）</strong>と<strong>質問（questions）</strong>
          を送ります（APIキーは <code>Authorization: Bearer …</code>{" "}
          ヘッダーで渡します）。
        </p>

        <h3 className="jsonh">送るもの（リクエスト）</h3>
        <pre className="code json">{SAMPLE_REQUEST}</pre>
        <ul className="jsonnotes">
          <li>
            <code>state</code>
            は材料です。名前をつけた JSON
            で、お客さんの文章・注文・返品ルールを渡しています。
          </li>
          <li>
            <code>questions</code>
            は質問の集まりです。<code>category</code>{" "}
            などの名前はコードが結果を受け取るための ID で、Jev
            には送られません。意味は <code>instructions</code>
            に全部書きます。
          </li>
          <li>
            <code>type</code> が質問の種類です。choice は選択肢を{" "}
            <code>criteria</code>
            に、score は段階の説明を配列で書きます。noul は{" "}
            <code>instructions</code>
            だけで足ります。
          </li>
          <li>
            質問の中の <code>`order.days_since_delivery`</code>
            のように、バッククォートで状況の場所を指しています。
          </li>
        </ul>

        <h3 className="jsonh">返ってくるもの（レスポンス）</h3>
        <pre className="code json">{SAMPLE_RESPONSE}</pre>
        <ul className="jsonnotes">
          <li>
            <code>answers</code> に、質問のID
            ごとの答えが入ります。3つの質問が、
            <strong>1回の呼び出し</strong>でまとめて返ってきました。
          </li>
          <li>
            choice は <code>choice</code>（選ばれたもの）と、選択肢ごとの
            <code>probabilities</code>。noul は <code>noul</code>
            （当てはまる確率）だけ。 score は <code>score</code>
            （期待値）と、段階ごとの確率です。
          </li>
          <li>
            <code>confidence</code>
            は、確率がどれだけ1つに集中しているかを表します。「迷っているか」の目安にして、
            自信が低いものだけ人に回す、といった使い方ができます。
          </li>
          <li>
            <code>usage</code> は使ったトークン数。料金の目安になります。
          </li>
        </ul>
        <p className="muted">
          これは実際に送って返ってきた結果です。わかりやすい例だったので、確率が
          0 か 1 に寄っています。迷う内容なら、確率がばらけます。
        </p>
      </section>

      <section id="traits" className="block">
        <h2>5. Jev のとくちょう</h2>
        <ul className="traits">
          <li>
            <span className="emoji" aria-hidden="true">
              ⚡
            </span>
            <h3>速い</h3>
            <p>
              1回の呼び出しは、ふつう 0.2〜0.5 秒。画面の操作に組み込めます。
            </p>
          </li>
          <li>
            <span className="emoji" aria-hidden="true">
              🧺
            </span>
            <h3>まとめて聞ける</h3>
            <p>
              同じ状況についての質問を、何十〜何百問でも1回でまとめて投げられます。いっせいに答えが返ります。
            </p>
          </li>
          <li>
            <span className="emoji" aria-hidden="true">
              📊
            </span>
            <h3>数字で返る</h3>
            <p>
              答えは確率。しきい値を決めて分岐したり、足し算で並べたりと、コードでそのまま使えます。
            </p>
          </li>
        </ul>
        <p className="muted">
          速さは、このサンプルでの実測です（探してるものだけ表示で約0.25秒、Car
          Picker で約0.24秒、200問のパネルで約1.5秒）。
        </p>
      </section>

      <section id="shapes" className="block">
        <h2>6. 候補がたくさんあるとき、どう聞く？</h2>
        <p>
          「商品が何十個」「料理が何百品」のように候補が多いときの聞き方は、おもに4つあります。
          どれにも共通するのは、
          <strong>同じ状況に対する質問は、まとめて1回で聞く</strong>
          ことです。質問が増えるのは、状況について知りたいことが増えたときで、候補の数に
          合わせて増やすわけではありません。
        </p>
        <ul className="shapes">
          <li>
            <h3>① 依頼文から条件を取り出す</h3>
            <p>
              質問は固定の数（車選びは30問）。候補との照合は、コードがデータに対して行います。
              <a href="#carpicker">ソラカー Car Picker</a>
            </p>
          </li>
          <li>
            <h3>② 候補ごとに同じ質問を並べて、1リクエスト</h3>
            <p>
              候補が短い文（商品のタイトル、料理名）のとき。共通の状況を state
              に入れ、候補は質問のほうに入れます。
              <a href="#searchfilter">探してるものだけ表示</a>
              <a href="#dinner">今夜なに作る？</a>
            </p>
          </li>
          <li>
            <h3>③ 全候補を1つの質問の選択肢にして絞る</h3>
            <p>
              1つの質問に、255択まで置けます。確率が候補ごとに返るので、1回で順位が付きます。
              選択肢の並びに偏ることがあるため、逆の並びでも聞いて平均します（公式のスキル提案の例）。
            </p>
          </li>
          <li>
            <h3>④ 絞ってから、候補ごとに詳しく聞く</h3>
            <p>
              ③で数品に絞ってから、残った候補に、程度（score）や当てはまるか（noul）を聞きます。広く浅く、狭く深く、の二段構えです。
            </p>
          </li>
        </ul>
        <p className="muted">
          候補が長い文書（記事、問い合わせの全文）で、1つの state
          に入れきれないときは、候補ごとに1リクエストにします（公式の再ランキングの例）。
        </p>
      </section>

      <section id="apps" className="block">
        <h2>7. 5つのアプリで、どう使っている？</h2>
        <p>
          公式ドキュメントには、
          <a href="https://docs.typesafe.ai/patterns">4つのパターン</a>
          があります。どのデモが、どのパターンを使っているかは、次のとおりです。
        </p>
        <table className="ptable">
          <thead>
            <tr>
              <th>パターン</th>
              <th>ひとことで</th>
              <th>使っているデモ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Speculative Fan-Out</td>
              <td>使うか分からない質問も、1回でまとめて聞く</td>
              <td>
                Car
                Picker（主）、問い合わせ振り分け、探してるものだけ表示、今夜なに作る？、ウケるかなパネル
              </td>
            </tr>
            <tr>
              <td>Confidence-Gated Routing</td>
              <td>確信度で、実行 / 確認 / 人に回す を決める</td>
              <td>
                問い合わせ振り分け（主）、Car
                Picker、探してるものだけ表示（迷いの印）
              </td>
            </tr>
            <tr>
              <td>Composite Scoring</td>
              <td>小さな判断を、コードの重みで合算する</td>
              <td>Car Picker（主）</td>
            </tr>
            <tr>
              <td>Intent Routing</td>
              <td>意図を分類して、処理先に振り分ける</td>
              <td>問い合わせ振り分け</td>
            </tr>
          </tbody>
        </table>
        <p>どのアプリも、同じ型で読めます。</p>
        <p className="legend">
          <span>やりたいこと</span> → <span>渡す状況</span> →{" "}
          <span>Jev に聞くこと</span> → <span>流れ</span> →{" "}
          <span>コードがやること</span>
        </p>

        {APPS.map((app) => (
          <article key={app.id} id={app.id} className="app">
            <header>
              <h3>{app.name}</h3>
              <a className="open" href={app.href}>
                アプリを開く →
              </a>
            </header>

            <p className="patterns">
              <span className="tag">使っているパターン</span>
              {app.patterns.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 ? "、" : ""}
                  <a
                    href={`https://docs.typesafe.ai/patterns/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {p.name}
                  </a>
                </span>
              ))}
            </p>

            <p className="want">
              <span className="tag">やりたいこと</span>
              {app.want}
            </p>

            <p className="statebox">
              <span className="tag">渡す状況（state）</span>
              {app.state}
            </p>

            <AppExample
              app={
                app.id as
                  | "searchfilter"
                  | "dinner"
                  | "carpicker"
                  | "router"
                  | "persona"
              }
            />

            <ol className="flow" aria-label="処理の流れ">
              {app.flow.map((step, i) => (
                <li key={step} className={i === 1 ? "jevstep" : undefined}>
                  {step}
                </li>
              ))}
            </ol>

            <p className="point">
              <span className="tag">ポイント</span>
              {app.point}
            </p>

            <div className="codes">
              <span className="tag">コードがやること</span>
              <ul>
                {app.code.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>

            {app.caution ? <p className="caution">⚠ {app.caution}</p> : null}
          </article>
        ))}
      </section>

      <section id="care" className="block">
        <h2>8. 気をつけること</h2>
        <ul className="care">
          <li>
            <strong>文章は作れません。</strong>
            返事・要約・説明は書けないので、それが必要なら別の LLM
            と組み合わせます。
          </li>
          <li>
            <strong>テキストだけです。</strong>
            画像や音声は（今のところ）渡せません。
          </li>
          <li>
            <strong>確率は「全体として」当たります。</strong>
            たとえば「80%」と答えたもの100件のうち約80件が当たる、という意味です。1件1件が必ず合っている保証ではありません。自分のデータで確かめてから使いましょう。
          </li>
          <li>
            <strong>APIキーはサーバー側に置きます。</strong>
            ブラウザに渡すと誰でも見えてしまうので、このアプリも Route Handler
            の中でだけ使っています。
          </li>
        </ul>
        <p className="back">
          <a href="/">← トップへ戻る</a>
        </p>
      </section>
    </main>
  );
}
