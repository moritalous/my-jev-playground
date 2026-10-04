export type ExampleOption = {
  label: string;
  desc: string;
  p: number;
  picked: boolean;
};

export type ExampleQuestion = {
  id: string;
  type: "choice" | "noul" | "score";
  ask: string;
  extra: string | null;
  options: ExampleOption[];
  result: string;
};

export type AppExample = {
  state: string;
  multiplier: string;
  questions: ExampleQuestion[];
  note: string;
};

export const EXAMPLES: Record<
  "searchfilter" | "dinner" | "carpicker" | "router" | "persona",
  AppExample
> = {
  searchfilter: {
    state: '{\n  "search_query": "ipad pro スマートキーボード"\n}',
    multiplier:
      "16商品 × 1問 = 16問を、1リクエスト（約251ms）。全24キーワードでも24リクエスト",
    questions: [
      {
        id: "p0",
        type: "choice",
        ask: "この商品は、検索した人が探しているものと、どういう関係にある？",
        extra:
          '{\n  "candidate": {\n    "title": "Apple Smart Keyboard(10.2インチiPad、10.5インチiPad Air、10.5インチiPad…"\n  }\n}',
        options: [
          {
            label: "本命",
            desc: "探しているものそのもの。全条件を満たす",
            p: 0.44,
            picked: false,
          },
          {
            label: "代わり",
            desc: "同じ種類だが、条件のどれかが違う",
            p: 0.56,
            picked: true,
          },
          {
            label: "おまけ",
            desc: "アクセサリなど、一緒に使うもの",
            p: 0,
            picked: false,
          },
          {
            label: "無関係",
            desc: "探しているものと関係がない",
            p: 0,
            picked: false,
          },
        ],
        result: "選ばれたのは「代わり」（確信度 0.40、正解ラベルは「本命」）",
      },
      {
        id: "p1",
        type: "choice",
        ask: "この商品は、検索した人が探しているものと、どういう関係にある？",
        extra:
          '{\n  "candidate": {\n    "title": "ロジクール iPad Pro 12.9インチ対応 キーボード iK1272BKA ブラック バックライトキーボード付ケー…"\n  }\n}',
        options: [
          {
            label: "本命",
            desc: "探しているものそのもの。全条件を満たす",
            p: 0.28,
            picked: false,
          },
          {
            label: "代わり",
            desc: "同じ種類だが、条件のどれかが違う",
            p: 0.71,
            picked: true,
          },
          {
            label: "おまけ",
            desc: "アクセサリなど、一緒に使うもの",
            p: 0.01,
            picked: false,
          },
          {
            label: "無関係",
            desc: "探しているものと関係がない",
            p: 0,
            picked: false,
          },
        ],
        result: "選ばれたのは「代わり」（確信度 0.61、正解ラベルは「代わり」）",
      },
      {
        id: "p5",
        type: "choice",
        ask: "この商品は、検索した人が探しているものと、どういう関係にある？",
        extra:
          '{\n  "candidate": {\n    "title": "Apple Smart Keyboard Folio (11インチ iPad Pro 第1世代用) - 日本語"\n  }\n}',
        options: [
          {
            label: "本命",
            desc: "探しているものそのもの。全条件を満たす",
            p: 0.71,
            picked: true,
          },
          {
            label: "代わり",
            desc: "同じ種類だが、条件のどれかが違う",
            p: 0.28,
            picked: false,
          },
          {
            label: "おまけ",
            desc: "アクセサリなど、一緒に使うもの",
            p: 0.01,
            picked: false,
          },
          {
            label: "無関係",
            desc: "探しているものと関係がない",
            p: 0,
            picked: false,
          },
        ],
        result: "選ばれたのは「本命」（確信度 0.62、正解ラベルは「本命」）",
      },
    ],
    note: "コードの仕事：本命と判定された商品を「探してるもの」として残し、それ以外には 🚫 を付けます。確信度が 0.6 未満の判定（上の例では p0 の 0.40）には「Jev が迷った」と印を付けます。0.6 未満の判定は正解率が約5割、それ以上は約8割でした。",
  },
  dinner: {
    state:
      '{\n  "ユーザーの状況": "疲れているので、ご飯が進む和食がいい",\n  "あなたのタスク": "今夜の夜ご飯の献立（主菜）を決める"\n}',
    multiplier:
      "主菜196品 × 1問 = 196問を、1リクエスト（約278ms、入力9,323トークン）。副菜・汁物も同じ形で、112問を1リクエスト",
    questions: [
      {
        id: "d…（サバの味噌煮）",
        type: "noul",
        ask: "今日の夜ご飯に、この料理はふさわしいか？",
        extra: '{\n  "candidate": "サバの味噌煮"\n}',
        options: [
          {
            label: "「はい」の確率",
            desc: "",
            p: 0.85,
            picked: true,
          },
        ],
        result: "ふさわしい確率は 85%（1位）",
      },
      {
        id: "d…（親子丼）",
        type: "noul",
        ask: "今日の夜ご飯に、この料理はふさわしいか？",
        extra: '{\n  "candidate": "親子丼"\n}',
        options: [
          {
            label: "「はい」の確率",
            desc: "",
            p: 0.85,
            picked: true,
          },
        ],
        result: "ふさわしい確率は 85%（2位）",
      },
      {
        id: "d…（ぶり大根）",
        type: "noul",
        ask: "今日の夜ご飯に、この料理はふさわしいか？",
        extra: '{\n  "candidate": "ぶり大根"\n}',
        options: [
          {
            label: "「はい」の確率",
            desc: "",
            p: 0.8,
            picked: true,
          },
        ],
        result: "ふさわしい確率は 80%（12位）",
      },
    ],
    note: "コードの仕事：「はい」の確率が高い順に並べるだけです。確信度（迷いのなさ）で選ぶと、「ふさわしくない」と自信満々に答えた料理が上に来てしまうので、順位には確率を使います。",
  },
  carpicker: {
    state:
      '{\n  "request": "家族四人（小学生2人）で乗れるセダン、ボディカラーは赤で、自動ブレーキで止まるやつ"\n}',
    multiplier: "全30問を1リクエスト（下はその一部）",
    questions: [
      {
        id: "bodyType_stated",
        type: "noul",
        ask: "この人は、車のボディタイプについて希望を述べている？（「言及があるか」を別の質問にしています）",
        extra: null,
        options: [
          {
            label: "当てはまる確率",
            desc: "",
            p: 0.98,
            picked: true,
          },
        ],
        result: "言及している確率は 98%",
      },
      {
        id: "bodyType",
        type: "choice",
        ask: "この人が希望しているのは、どのボディタイプ？（「言及なし」の選択肢はありません）",
        extra: null,
        options: [
          {
            label: "コンパクト",
            desc: "小さめで運転しやすいコンパクトカー・軽快な小型車",
            p: 0,
            picked: false,
          },
          {
            label: "セダン",
            desc: "セダン（トランクのある4ドアの乗用車）",
            p: 1,
            picked: true,
          },
          {
            label: "ワゴン",
            desc: "ステーションワゴン（乗用車の形のまま荷室が広い車）",
            p: 0,
            picked: false,
          },
          {
            label: "SUV",
            desc: "SUV・クロスオーバー（車高が高くアウトドア向き）",
            p: 0,
            picked: false,
          },
          {
            label: "ミニバン",
            desc: "ミニバン（スライドドアや3列シートのある背の高い車）",
            p: 0,
            picked: false,
          },
        ],
        result: "選ばれたのは「セダン」",
      },
      {
        id: "bodyType_reversed",
        type: "choice",
        ask: "同じ質問を、選択肢を逆の並びにして、もう一度聞く（順番の偏りの確認）",
        extra: null,
        options: [
          {
            label: "ミニバン",
            desc: "ミニバン（スライドドアや3列シートのある背の高い車）",
            p: 0,
            picked: false,
          },
          {
            label: "SUV",
            desc: "SUV・クロスオーバー（車高が高くアウトドア向き）",
            p: 0,
            picked: false,
          },
          {
            label: "ワゴン",
            desc: "ステーションワゴン（乗用車の形のまま荷室が広い車）",
            p: 0,
            picked: false,
          },
          {
            label: "セダン",
            desc: "セダン（トランクのある4ドアの乗用車）",
            p: 1,
            picked: true,
          },
          {
            label: "コンパクト",
            desc: "小さめで運転しやすいコンパクトカー・軽快な小型車",
            p: 0,
            picked: false,
          },
        ],
        result: "選ばれたのは「セダン」",
      },
      {
        id: "budget",
        type: "score",
        ask: "月額の安さを、どのくらい重視している？（3段階）",
        extra: null,
        options: [
          {
            label: "0",
            desc: "価格や予算に触れていない、または価格より中身を重視している",
            p: 1,
            picked: false,
          },
          {
            label: "1",
            desc: "予算は気にしている（「手頃な」「予算内で」「コスパ」など）",
            p: 0,
            picked: false,
          },
          {
            label: "2",
            desc: "安さが最優先（「とにかく安く」「節約したい」「お金がない」など）",
            p: 0,
            picked: false,
          },
        ],
        result: "期待値は 0（0〜2）",
      },
      {
        id: "kidsOnBoard",
        type: "noul",
        ask: "小さな子ども（乳幼児・未就学児・小学生）が乗る？",
        extra: null,
        options: [
          {
            label: "当てはまる確率",
            desc: "",
            p: 0.95,
            picked: true,
          },
        ],
        result: "当てはまる確率は 95%",
      },
    ],
    note: "「言及があるか」（_stated）と「どの値か」を別の質問にしているので、要望に書かれていない項目を、Jev が無理に埋めません。コードは、言及の確率に応じてその項目の影響を弱めます。確信度が低い項目があれば、「ミニバン？ SUV？」と聞き返し、Jev を呼び直さずに並べ直します。",
  },
  router: {
    state:
      '{\n  "message": "イヤホンを返金してほしいです。あと、プレミアム会員も今月で解約したいです。",\n  "customer": {\n    "plan": "プレミアム会員（月額）",\n    "orders": [\n      {\n        "id": "A-1001",\n        "item": "ワイヤレスイヤホン",\n        "status": "配達済み",\n        "days_since_delivery": 6\n      },\n      {\n        "id": "A-1002",\n        "item": "モバイルバッテリー",\n        "status": "発送済み（まだ届いていない）",\n        "days_since_delivery": null\n      }\n    ]\n  },\n  "refund_policy": "到着後14日以内なら返品・返金できます"\n}',
    multiplier: "全9問を1リクエスト（下はその一部。約206ms、入力2129トークン）",
    questions: [
      {
        id: "intent",
        type: "choice",
        ask: "この顧客が、このメッセージで一番求めていること（主な用件）はどれか？（「その他」の逃げ道あり。選択肢を逆の並びにした intent_rev も同時に聞く）",
        extra: null,
        options: [
          {
            label: "注文状況",
            desc: "注文・配送・到着について具体的に尋ねている",
            p: 0,
            picked: false,
          },
          {
            label: "返金",
            desc: "返品・返金・交換を具体的に求めている",
            p: 1,
            picked: true,
          },
          {
            label: "解約",
            desc: "会員プランや定期サービスをやめたい",
            p: 0,
            picked: false,
          },
          {
            label: "商品の質問",
            desc: "仕様・使い方などを質問している",
            p: 0,
            picked: false,
          },
          {
            label: "クレーム",
            desc: "不満を伝えているが、手続きは求めていない",
            p: 0,
            picked: false,
          },
          {
            label: "アカウント",
            desc: "ログインできない・ロックされた",
            p: 0,
            picked: false,
          },
          {
            label: "その他",
            desc: "上のどれでもない・用件が読み取れない",
            p: 0,
            picked: false,
          },
        ],
        result: "選ばれたのは「返金」（確信度 1.00。逆の並びも同じ答え）",
      },
      {
        id: "frustration",
        type: "score",
        ask: "顧客の、サービスに対する不満・怒りの強さは？（3段階）",
        extra: null,
        options: [
          {
            label: "0",
            desc: "不満はない（普通の問い合わせ・依頼）",
            p: 0.94,
            picked: false,
          },
          {
            label: "1",
            desc: "不満や困惑がある（丁寧な言葉づかいのまま）",
            p: 0.06,
            picked: false,
          },
          {
            label: "2",
            desc: "強い怒り・非難（強い言葉、責める口調）",
            p: 0,
            picked: false,
          },
        ],
        result: "期待値は 0.06（0〜2）、確信度 0.91",
      },
      {
        id: "multiple_requests",
        type: "noul",
        ask: "互いに異なる2つ以上の依頼（例: 返金と解約）を同時に求めている？",
        extra: null,
        options: [
          {
            label: "当てはまる確率",
            desc: "",
            p: 0.98,
            picked: true,
          },
        ],
        result: "当てはまる確率は 98%",
      },
      {
        id: "refund_in_policy",
        type: "noul",
        ask: "返金を求めている注文は、配達済みで、`customer.orders` の日数が `refund_policy` の期間内に収まっている？（返金の依頼のときだけ使う、先回りの質問）",
        extra: null,
        options: [
          {
            label: "当てはまる確率",
            desc: "",
            p: 0.96,
            picked: true,
          },
        ],
        result: "当てはまる確率は 96%",
      },
    ],
    note: "コードの仕事：返金は危険度が高いので、自動で実行するには、意図の確信度 0.85 以上、かつ「期限内」の確率 0.85 以上が必要です。ここでは両方を満たしましたが、「複数の依頼」の確率が高い（98%）ので、自動実行はせず「確認する」に格下げします。注文状況の自動返信のような低リスクの処理は、0.6 以上で自動です。しきい値は画面で変えられて、変えても Jev は呼び直しません。",
  },
  persona: {
    state:
      '{\n  "新規事業のアイデア": "使わなくなった楽器を、近所の子どもに月額で貸し出すサービス"\n}',
    multiplier: "パネリスト 100人 × 2問 = 200問",
    questions: [
      {
        id: "p001（1人目）",
        type: "score",
        ask: "この人物は、このアイデアにどのくらい興味を持つ？",
        extra:
          '{\n  "人物": {\n    "名前": "ステーブン・ジョーブズ",\n    "紹介": "パーソナルコンピュータとスマートフォンを世に広めた起業家。製品の美しさと、ハードとソフトを統合した体験を何よりも重視する…",\n    "関心領域": [\n      "プロダクトデザイン",\n      "消費者向け製品",\n      "垂直統合",\n      "ブランド体験"\n    ]\n  }\n}',
        options: [
          {
            label: "0",
            desc: "全く興味を示さず、自分には関係のないことだと考える",
            p: 0.03,
            picked: false,
          },
          {
            label: "1",
            desc: "懐疑的で、うまくいかないだろうと考える",
            p: 0.57,
            picked: false,
          },
          {
            label: "2",
            desc: "悪くはないと思うが、自分から積極的に関わろうとは思わない",
            p: 0.3,
            picked: false,
          },
          {
            label: "3",
            desc: "関心を持ち、もっと詳しく知りたいと考える",
            p: 0.1,
            picked: false,
          },
          {
            label: "4",
            desc: "強い興味を示し、自ら関わりたいと考える",
            p: 0,
            picked: false,
          },
        ],
        result: "期待値は 1.47（0〜4）",
      },
      {
        id: "p001__invest",
        type: "noul",
        ask: "この人物は、このアイデアに自分のお金を出す？",
        extra:
          '{\n  "人物": {\n    "名前": "ステーブン・ジョーブズ",\n    "紹介": "パーソナルコンピュータとスマートフォンを世に広めた起業家。製品の美しさと、ハードとソフトを統合した体験を何よりも重視する…"\n  }\n}',
        options: [
          {
            label: "当てはまる確率",
            desc: "",
            p: 0.21,
            picked: true,
          },
        ],
        result: "当てはまる確率は 21%",
      },
    ],
    note: "質問に、人物の名前・紹介・関心領域を入れています。同じ形の質問を100人分作って、200問をまとめて聞きます。",
  },
};
