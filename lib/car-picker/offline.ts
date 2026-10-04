import {
  type Answers,
  buildTags,
  type ClassifyResult,
  FIELD_VALUES,
  makeChoice,
  type ScoreAnswer,
} from "./answers";
import { ASKED_TAG_KEYS, QUESTION_COUNT } from "./questions";

const hit = (re: RegExp, t: string) => (re.test(t) ? 1 : 0);

function pick<T extends string>(
  text: string,
  values: readonly T[],
  table: [T, RegExp][],
) {
  const found = table.find(([, re]) => re.test(text))?.[0];
  return makeChoice(
    values,
    found ? 1 : 0,
    found ? ({ [found]: 1 } as Partial<Record<T, number>>) : {},
    null,
  ) as ReturnType<typeof makeChoice<T>>;
}
const lvl = (hi: RegExp, mid: RegExp, text: string): ScoreAnswer => {
  const s = hi.test(text) ? 2 : mid.test(text) ? 1 : 0;
  return {
    score: s,
    confidence: null,
    probabilities: { 0: +(s === 0), 1: +(s === 1), 2: +(s === 2) },
  };
};

const TAG_WORDS: Record<(typeof ASKED_TAG_KEYS)[number], RegExp> = {
  dashcam: /ドラレコ|ドライブレコーダー|あおり/,
  parking: /駐車|車庫|バック|死角|狭い/,
  navi: /ナビ|テレビ|画面/,
  warm: /寒がり|シートヒーター|冬/,
  cargo: /荷物|キャンプ|アウトドア|釣り|ゴルフ/,
  power: /電源|コンセント|給電|災害/,
  air: /花粉|におい|匂い|空気|ペット/,
  phone: /スマホ|充電/,
  openness: /開放感|サンルーフ|ガラスルーフ/,
  theft: /盗難/,
  rain: /雨|タバコ|喫煙/,
  badWeather: /霧|吹雪|悪天候/,
  longDrive: /遠出|長距離|高速|旅行/,
  looks: /かっこいい|デザイン|見た目|おしゃれ/,
};

export function classifyOffline(text: string): ClassifyResult {
  const safety = lvl(
    /安全.*(充実|最優先|重視)|とにかく安全/,
    /自動ブレーキ|安全/,
    text,
  );
  const kidsOnBoard = hit(/子ども|子供|小学生|赤ちゃん|幼児|キッズ/, text);
  const awd = hit(/4WD|４WD|四駆|雪/, text);
  const answers: Answers = {
    bodyType: pick(text, FIELD_VALUES.bodyType, [
      ["sedan", /セダン/],
      ["wagon", /ワゴン/],
      ["suv", /SUV|クロス/i],
      ["minivan", /ミニバン|スライド/],
      ["compact", /コンパクト|小さ/],
    ]),
    partySize: pick(text, FIELD_VALUES.partySize, [
      ["six_plus", /[6-9６-９六七八]人|大家族/],
      ["five", /[5５五]人/],
      ["three_four", /[3-4３-４三四]人|家族/],
      ["one_two", /[1-2１-２一二]人|夫婦|一人/],
    ]),
    color: pick(text, FIELD_VALUES.color, [
      ["red", /赤|レッド/],
      ["white", /白|ホワイト|パール/],
      ["black", /黒|ブラック/],
      ["gray", /グレー|シルバー|銀/],
      ["blue", /青|ブルー|紺/],
      ["beige", /ベージュ|茶|ブラウン/],
      ["green", /緑|カーキ|グリーン/],
      ["yellow", /黄|イエロー|マスタード/],
    ]),
    fuel: pick(text, FIELD_VALUES.fuel, [
      ["hybrid", /ハイブリッド|燃費/],
      ["gasoline", /ガソリン/],
    ]),
    gradePref: pick(text, FIELD_VALUES.gradePref, [
      ["top", /上位|高級|充実/],
      ["basic", /手頃|最低限|シンプル/],
    ]),
    budget: lvl(/とにかく安|最安|安さ優先/, /安い|安め|予算|節約/, text),
    safety,
    kidsOnBoard,
    slideDoor: hit(/スライド/, text),
    awd,
    tags: buildTags(
      Object.fromEntries(
        ASKED_TAG_KEYS.map((t) => [t, hit(TAG_WORDS[t], text)]),
      ) as Record<(typeof ASKED_TAG_KEYS)[number], number>,
      safety,
      kidsOnBoard,
      awd,
    ),
  };
  return {
    answers,
    source: "offline",
    model: "offline-keyword-rules",
    latencyMs: 0,
    questionCount: QUESTION_COUNT,
    jevCalls: 0,
  };
}
