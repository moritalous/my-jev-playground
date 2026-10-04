import { choice, noul, score } from "@typesafe-ai/sdk";
import type { Tag } from "./types";

const bodyTypeInstruction = "この人が希望している車のボディタイプ";
const bodyTypeOptions = {
  compact: "小さめで運転しやすいコンパクトカー・軽快な小型車",
  sedan: "セダン（トランクのある4ドアの乗用車）",
  wagon: "ステーションワゴン（乗用車の形のまま荷室が広い車）",
  suv: "SUV・クロスオーバー（車高が高くアウトドア向き）",
  minivan: "ミニバン（スライドドアや3列シートのある背の高い車）",
} as const;
const bodyTypeOptionsReversed = Object.fromEntries(
  Object.entries(bodyTypeOptions).reverse(),
) as typeof bodyTypeOptions;

const carQuestions = {
  bodyType_stated: noul(
    "この人は、車のボディタイプ（セダン・SUV・ミニバン・コンパクトなど）について希望を述べている",
  ),
  bodyType: choice(bodyTypeInstruction, bodyTypeOptions),
  bodyType_reversed: choice(bodyTypeInstruction, bodyTypeOptionsReversed),

  partySize_stated: noul(
    "この人は、車に乗る人数（家族構成を含む）に触れている",
  ),
  partySize: choice("この車に普段乗る人数", {
    one_two: "1〜2人（一人暮らし・夫婦など）",
    three_four: "3〜4人（小さな家族など）",
    five: "5人",
    six_plus: "6人以上（大家族・3列目が必要）",
  }),

  color_stated: noul("この人は、ボディカラーについて希望を述べている"),
  color: choice("この人が希望しているボディカラーの系統", {
    red: "赤・レッド系",
    white: "白・パール系",
    black: "黒系",
    gray: "グレー・シルバー系",
    blue: "青・ネイビー系",
    beige: "ベージュ・ブラウン系",
    green: "カーキ・グリーン系",
    yellow: "黄色・マスタード系",
  }),

  fuel_stated: noul(
    "この人は、燃料・パワートレイン（ハイブリッドかガソリンか）や燃費について希望を述べている",
  ),
  fuel: choice("燃料・パワートレインの希望", {
    hybrid: "ハイブリッドや燃費の良さを希望している",
    gasoline: "ガソリン車を希望している",
  }),

  gradePref_stated: noul(
    "この人は、グレード（装備の充実度・高級感か、必要十分で手頃か）について希望を述べている",
  ),
  gradePref: choice("グレード（装備の充実度）の希望", {
    top: "上位グレード・装備の充実・高級感を求めている",
    basic: "必要十分な装備で良い・手頃なグレードを求めている",
  }),

  budget: score("この人の、月額料金（価格）への敏感さ", [
    "価格や予算に触れていない、または価格より中身を重視している",
    "予算は気にしている（「手頃な」「予算内で」「コスパ」など）",
    "安さが最優先（「とにかく安く」「節約したい」「お金がない」など）",
  ]),
  safety: score("この人が安全装備・運転支援に求める水準", [
    "安全装備に触れていない",
    "自動ブレーキなど基本的な安全装備を求めている",
    "死角検知・駐車支援など上位の安全装備まで充実させたい、または安全を最重視している",
  ]),

  kidsOnBoard: noul("小さな子ども（乳幼児・未就学児・小学生）が乗る"),
  slideDoor: noul("スライドドアが欲しいと言っている"),
  awd: noul("4WD（四輪駆動）が必要、または雪道・雪国・悪路を走る"),
};

const OPTION_QUESTION_TEXT = {
  dashcam:
    "ドライブレコーダーが欲しい、または事故やあおり運転の記録を残したいと考えている",
  parking: "駐車や車庫入れが苦手、または死角・狭い道・周囲の確認に不安がある",
  navi: "カーナビや大きな画面、テレビ視聴を重視している",
  warm: "冬の寒さ対策（シートヒーター・ハンドルヒーターなど）を重視している",
  cargo:
    "荷物が多い、またはキャンプ・釣り・スポーツなどアウトドアやレジャーでよく使う",
  power:
    "車の電源（コンセント）を使いたい、またはキャンプや災害時の給電を考えている",
  air: "車内の空気・におい・花粉・ペットのにおいが気になる",
  phone: "スマホとの連携（置くだけ充電、スマホをカギとして使う）を重視している",
  openness: "開放感が欲しい、空が見えるガラスルーフに興味がある",
  theft: "車の盗難が心配",
  rain: "雨の日も窓を少し開けて換気したい、または車内で喫煙する",
  badWeather: "霧や吹雪など視界の悪い天候でよく走る",
  longDrive: "遠出・長距離ドライブや高速道路をよく使う",
  looks: "見た目・デザイン・ドレスアップにこだわりがある",
} as const;

export const DERIVED_TAGS = {
  safetyMax: "safety の level 2 の確率",
  snow: "awd の確率",
  kids: "kidsOnBoard の確率",
} as const;

const optionQuestions = Object.fromEntries(
  Object.entries(OPTION_QUESTION_TEXT).map(([tag, text]) => [
    `opt_${tag}`,
    noul(text),
  ]),
) as {
  [K in keyof typeof OPTION_QUESTION_TEXT as `opt_${K}`]: ReturnType<
    typeof noul
  >;
};

export const questions = { ...carQuestions, ...optionQuestions };
export type QuestionKey = keyof typeof questions;
export const QUESTION_COUNT = Object.keys(questions).length;
export const ASKED_TAG_KEYS = Object.keys(OPTION_QUESTION_TEXT) as Exclude<
  Tag,
  "basic" | keyof typeof DERIVED_TAGS
>[];
