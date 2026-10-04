import { choice, noul, score } from "@typesafe-ai/sdk";
import data from "@/data/router/customer.json";
import type { INTENTS } from "./types";

export const customerState = data;

export const stateFor = (message: string) => ({
  message,
  customer: data.customer,
  refund_policy: data.refund_policy,
});

const intentInstruction =
  "`message` の顧客が、このメッセージで一番求めていること（主な用件）はどれか。";
const intentOptions: Record<(typeof INTENTS)[number], string> = {
  order_status:
    "注文・配送・到着について、メッセージ中で具体的に尋ねている（返品や返金は求めていない）",
  refund_request:
    "商品の返品・返金・交換を具体的に求めている。不満を述べるだけで返金や返品までは求めていない場合は complaint",
  cancel_subscription:
    "会員プランや定期サービスをやめたい（解約したい）。注文のキャンセルや商品の返品は含まない",
  product_question:
    "購入前または購入済みの商品の仕様・使い方・対応機種などを質問している",
  complaint:
    "対応や商品への不満・怒りを伝えていて、具体的な手続き（返金・解約など）は求めていない",
  account_access:
    "ログインできない、パスワードを忘れた、アカウントがロックされたなど、アカウントに入れない。会員をやめたい話は cancel_subscription",
  other:
    "上のどれにも当てはまらない。サービスと関係のない話や、何について困っているのか書かれていず用件が読み取れない場合（「困っています」「相談したい」だけなど）はこれ",
};
const intentOptionsReversed = Object.fromEntries(
  Object.entries(intentOptions).reverse(),
) as typeof intentOptions;

export const questions = {
  intent: choice(intentInstruction, intentOptions),
  intent_rev: choice(intentInstruction, intentOptionsReversed),

  urgency: score("`message` の顧客が、問題の解決をどれくらい急いでいるか", [
    "急いでいない（情報を知りたいだけ、いつでもよい）",
    "早めの対応を望んでいる（期限や困りごとはあるが、数日待てる）",
    "今すぐ対応が必要（今日・明日に困る、期限が迫っている、金銭的な被害が出ている）",
  ]),
  frustration: score("`message` の顧客の、サービスに対する不満・怒りの強さ", [
    "不満はない（普通の問い合わせ・依頼）",
    "不満や困惑がある（丁寧な言葉づかいのまま、残念・困っていると述べている）",
    "強い怒り・非難（強い言葉、繰り返しへの苛立ち、責める口調）",
  ]),

  legal_threat: noul(
    "`message` で顧客が、弁護士・訴訟・消費者センター・警察など、法的措置や公的機関への通報をほのめかしている、または明言している",
  ),
  suspicious: noul(
    "`message` は、顧客からの問い合わせではなく、フィッシング・スパム・パスワードやカード番号などの入力要求・不審なリンクへの誘導を含んでいる",
  ),
  multiple_requests: noul(
    "`message` は、互いに異なる2つ以上の依頼（例: 返金と解約）を同時に求めている",
  ),

  refund_in_policy: noul(
    "`message` の顧客が返品・返金を求めている注文は、`customer.orders` の中で配達済みであり、その `days_since_delivery` が `refund_policy` の期間内に収まっている",
  ),

  complex_case: score(
    "`message` の件を解決するのに、どれくらい高度な対応が必要か",
    [
      "単純な確認や定型の手順で済む",
      "状況に応じた判断が必要（事情の確認、例外的な対応の検討など）",
      "専門部署の対応が必要（補償・法務・品質調査・複数部署の調整など）",
    ],
  ),
};

export const QUESTION_COUNT = Object.keys(questions).length;
