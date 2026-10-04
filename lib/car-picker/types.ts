export const BODY_TYPES = [
  "compact",
  "sedan",
  "wagon",
  "suv",
  "minivan",
] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const COLOR_FAMILIES = [
  "red",
  "white",
  "black",
  "gray",
  "blue",
  "beige",
  "green",
  "yellow",
] as const;
export type ColorFamily = (typeof COLOR_FAMILIES)[number];

export const OPTION_TAGS = [
  "dashcam",
  "parking",
  "safetyMax",
  "navi",
  "snow",
  "warm",
  "kids",
  "cargo",
  "power",
  "air",
  "phone",
  "openness",
  "theft",
  "rain",
  "badWeather",
  "longDrive",
  "looks",
] as const;
export const TAG_LABELS: Record<string, string> = {
  dashcam: "ドラレコ",
  parking: "駐車支援",
  safetyMax: "安全装備の充実",
  navi: "ナビ・画面",
  snow: "雪道・寒冷地",
  warm: "寒さ対策",
  kids: "子ども向け装備",
  cargo: "荷物・レジャー",
  power: "電源",
  air: "空気・におい",
  phone: "スマホ連携",
  openness: "開放感",
  theft: "盗難対策",
  rain: "雨の日の換気",
  badWeather: "悪天候",
  longDrive: "長距離",
  looks: "見た目",
  basic: "定番",
};

export const BODY_LABELS: Record<BodyType, string> = {
  compact: "コンパクト",
  sedan: "セダン",
  wagon: "ワゴン",
  suv: "SUV",
  minivan: "ミニバン",
};
export const COLOR_LABELS: Record<ColorFamily, string> = {
  red: "赤",
  white: "白",
  black: "黒",
  gray: "グレー・シルバー",
  blue: "青",
  beige: "ベージュ・ブラウン",
  green: "カーキ・グリーン",
  yellow: "イエロー",
};

export type Tag = (typeof OPTION_TAGS)[number] | "basic";

export type Color = {
  id: string;
  name: string;
  monthlyPrice: number;
  families: ColorFamily[];
  hex: string | null;
  hex2: string | null;
  image: string | null;
};

export type Option = {
  id: string;
  name: string;
  monthlyPrice: number;
  group: string;
  tags: Tag[];
  rules: string[];
  glossary: string[];
};

export type ExclusiveChoice = {
  id: string;
  name: string;
  monthlyPrice: number;
};
export type ExclusiveGroup = {
  group: string;
  tags: Tag[];
  choices: ExclusiveChoice[];
};

export type Package = {
  id: string;
  name: string;
  monthlyPrice: number;
  equipment: string[];
  tags: Tag[];
  rules: string[];
  glossary: string[];
  exclusive: ExclusiveGroup[];
};

export type Grade = {
  id: string;
  name: string;
  label: string;
  pdfKey: string | null;
  seats: number;
  fuel: "hybrid" | "gasoline";
  drive: "2WD" | "4WD";
  monthlyPrice: number;
  deliveryMonths: [number, number];
  colors: Color[];
  packages: Package[];
  options: Option[];
  standard: {
    names: string[];
    tags: Tag[];
    rules: string[];
    byTag: Partial<Record<Tag, string[]>>;
    safety: string[];
  };
  features: { slideDoor: boolean; thirdRow: boolean; roofRail: boolean };
};

export type Model = {
  key: string;
  name: string;
  bodyType: BodyType;
  bodyTypeLabel: string;
  grades: Grade[];
};

export type GlossaryEntry = {
  id: string;
  caption: string;
  description: string;
};

export type Catalog = {
  builtAt: string;
  tags: Record<Tag, string>;
  glossary: Record<string, GlossaryEntry>;
  models: Model[];
};
