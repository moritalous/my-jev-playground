const SKINS = ["#f7d9c0", "#efc4a2", "#d9a074", "#b47a4f", "#8a5636"];

const HAIRS = [
  "#23222a",
  "#3f2c20",
  "#5d4632",
  "#8a7b6b",
  "#b9b2a8",
  "#e3ded6",
  "#6e3a24",
];

const SHIRTS = [
  "#3f6fa8",
  "#c2573f",
  "#3f8f77",
  "#c99141",
  "#6b5f9c",
  "#4d8ba3",
  "#a8504f",
  "#6f7f45",
  "#8a5f7a",
  "#4a5566",
];

export type AvatarParts = {
  skin: string;
  hair: string;
  shirt: string;
  hairStyle: number;
  eyeStyle: number;
  mouthStyle: number;
  glasses: boolean;
  beard: number;
};

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function avatarParts(id: string): AvatarParts {
  const h = hash(id);
  return {
    skin: SKINS[h % SKINS.length],
    hair: HAIRS[(h >>> 3) % HAIRS.length],
    shirt: SHIRTS[(h >>> 7) % SHIRTS.length],
    hairStyle: (h >>> 11) % 8,
    eyeStyle: (h >>> 15) % 4,
    mouthStyle: (h >>> 19) % 4,
    glasses: (h >>> 23) % 3 === 0,
    beard: (h >>> 26) % 5 === 0 ? ((h >>> 28) % 2) + 1 : 0,
  };
}

export function jitter(id: string, salt = ""): number {
  return ((hash(id + salt) % 1000) / 1000) * 2 - 1;
}
