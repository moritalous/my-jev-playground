import type { JevTrace } from "@/lib/common/jev-trace";

export type Stats = {
  requests: number;
  questions: number;
  input_tokens: number;
  output_tokens: number;
  ms: number;
};

export type DishResult = {
  menu: string;
  desc: string;
  p: number;
};

export type MainRecommendation = {
  request: string;
  items: DishResult[];
  total: number;
  model: string;
  stats: Stats;
  jev: JevTrace[];
};

export type SideRecommendation = {
  main: string;
  sides: DishResult[];
  soups: DishResult[];
  total: number;
  model: string;
  stats: Stats;
  jev: JevTrace[];
};
