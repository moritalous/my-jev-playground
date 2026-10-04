import type { CSSProperties } from "react";
import type { Color } from "@/lib/car-picker/types";

export const yen = (n: number) => `¥${n.toLocaleString()}`;
export const pct = (p: number) => `${Math.round(p * 100)}%`;

function luminance(hex: string | null): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m?.[1]) return 0.5;
  const hexDigits = m[1];
  const [r, g, b] = [0, 2, 4]
    .map((i) => Number.parseInt(hexDigits.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

const CAR_GLYPH: Record<string, string> = { suv: "🚙", minivan: "🚐" };

export const swatchBg = (c: Color) =>
  c.hex2
    ? `linear-gradient(135deg, ${c.hex} 0 50%, ${c.hex2} 50% 100%)`
    : (c.hex ?? "#ccc");

export function CarIcon({
  bodyType,
  color,
  label,
  big = false,
}: {
  bodyType: string;
  color: Color;
  label: string;
  big?: boolean;
}) {
  const paint = color.hex2
    ? `linear-gradient(135deg, ${color.hex} 0 50%, ${color.hex2} 50% 100%)`
    : (color.hex ?? "#999");
  const lum = color.hex2
    ? (luminance(color.hex) + luminance(color.hex2)) / 2
    : luminance(color.hex);
  const ink = lum > 0.35 ? "#16202a" : "#ffffff";
  return (
    <span
      className={`car-tile ${big ? "big" : ""}`}
      role="img"
      aria-label={label}
      style={{ "--paint": paint, "--ink": ink } as CSSProperties}
    >
      {CAR_GLYPH[bodyType] ?? "🚗"}
      {"︎"}
    </span>
  );
}
