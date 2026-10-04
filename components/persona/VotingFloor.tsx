"use client";

import { useMemo } from "react";
import Avatar from "@/components/persona/Avatar";
import { jitter } from "@/lib/persona/avatar";
import {
  type Judgement,
  panelists,
  ZONES,
  type ZoneKey,
} from "@/lib/persona/panel";
import {
  BACK_Y,
  DEPTH_RULES,
  depthToY,
  FRONT_Y,
  rowDepth,
  scaleAt,
} from "@/lib/persona/stage";

type Props = {
  results: Judgement[] | null;
  placed: boolean;
  loading: boolean;
  intro: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  activeCategory: string | null;
};

type Placement = {
  x: number;
  y: number;
  width: number;
  z: number;
  order: number;
};

const LANE = 100 / ZONES.length;

const PER_ROW = 7;

export default function VotingFloor({
  results,
  placed,
  loading,
  intro,
  selectedId,
  onSelect,
  activeCategory,
}: Props) {
  const byId = useMemo(
    () => new Map((results ?? []).map((r) => [r.id, r])),
    [results],
  );

  const placements = useMemo(
    () => (placed && results ? placedLayout(results) : waitingLayout()),
    [placed, results],
  );

  const counts = useMemo(() => {
    const c: Record<ZoneKey, number> = { interested: 0, neutral: 0, not: 0 };
    for (const r of results ?? []) c[r.zone] += 1;
    return c;
  }, [results]);

  const settled = placed && results !== null;
  const idle = !settled && !loading;

  return (
    <div
      className={[
        "stage",
        loading ? "stage--loading" : "",
        idle ? "stage--idle" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="laneHeads">
        {ZONES.map((zone) => (
          <div className={`laneHead laneHead--${zone.key}`} key={zone.key}>
            <span className="laneMark" aria-hidden="true" />
            <span className="laneLabel">{zone.label}</span>
            <span className="laneCount">
              {settled ? (
                <>
                  <strong>{counts[zone.key]}</strong>
                  <small>人</small>
                </>
              ) : (
                <em>––</em>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: avatars are buttons and Escape clears the selection */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled on window */}
      <div className="floor" onClick={() => onSelect(null)}>
        {(idle && !intro) || loading ? (
          <div className="floorNote">
            {loading ? (
              <p className="floorNoteTitle">100人に聞いています…</p>
            ) : (
              <>
                <p className="floorNoteTitle">まだ誰も並んでいません</p>
                <p className="floorNoteText">
                  <b>①</b>にアイデアを書いて<b>［100人に聞く］</b>を押すと、
                  <br />
                  100人がこの3つの列に分かれて並びます。
                </p>
              </>
            )}
          </div>
        ) : null}

        {ZONES.map((zone, i) => (
          <span
            key={zone.key}
            className={`lane lane--${zone.key}`}
            style={{ left: `${i * LANE}%`, width: `${LANE}%` }}
            aria-hidden="true"
          />
        ))}

        {DEPTH_RULES.map((y) => (
          <span
            key={y}
            className="depthRule"
            style={{ top: `${y}%` }}
            aria-hidden="true"
          />
        ))}

        {panelists.map((p) => {
          const place = placements.get(p.id);
          if (!place) return null;

          const judgement = byId.get(p.id);
          const dimmed =
            activeCategory !== null && p.category !== activeCategory;
          const selected = selectedId === p.id;

          return (
            <button
              type="button"
              key={p.id}
              className={[
                "panelist",
                dimmed ? "panelist--dimmed" : "",
                selected ? "panelist--selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                left: `${place.x}%`,
                top: `${place.y}%`,
                width: `${place.width}%`,
                zIndex: selected ? 999 : place.z,
                transitionDelay: `${place.order * 12}ms`,
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(selected ? null : p.id);
              }}
              aria-label={`${p.name}（${p.category}）`}
            >
              <span className="panelistFigure">
                <span
                  className="panelistSway"
                  style={{ animationDelay: `${(place.order % 17) * -0.41}s` }}
                >
                  <Avatar
                    id={p.id}
                    title={p.name}
                    invest={
                      judgement?.invest !== null &&
                      (judgement?.invest ?? 0) > 0.6
                    }
                  />
                </span>
              </span>
              <span className="panelistTag">{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function waitingLayout(): Map<string, Placement> {
  const perRow = 20;
  const rows = Math.ceil(panelists.length / perRow);
  const map = new Map<string, Placement>();

  panelists.forEach((p, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const t = rows <= 1 ? 1 : 1 - row / (rows - 1);
    const y = BACK_Y + 10 + (FRONT_Y - 4 - (BACK_Y + 10)) * t ** 1.3;

    map.set(p.id, {
      x: 12 + (76 / (perRow - 1)) * col + jitter(p.id, "wx") * 0.6,
      y,
      width: ((LANE * 0.88) / PER_ROW) * 1.05 * scaleAt(t),
      z: Math.round(y * 10),
      order: i,
    });
  });

  return map;
}

function placedLayout(results: Judgement[]): Map<string, Placement> {
  const map = new Map<string, Placement>();
  const ordered = [...results].sort((a, b) => b.score - a.score);
  const orderOf = new Map(ordered.map((r, i) => [r.id, i]));

  ZONES.forEach((zone, zoneIndex) => {
    const members = ordered.filter((r) => r.zone === zone.key);
    if (members.length === 0) return;

    const rows = Math.ceil(members.length / PER_ROW);
    const laneStart = zoneIndex * LANE;
    const gap = (LANE * 0.88) / PER_ROW;

    const base = Math.floor(members.length / rows);
    const extra = members.length % rows;

    let i = 0;
    for (let row = 0; row < rows; row += 1) {
      const inThisRow = base + (row < extra ? 1 : 0);
      const t = rowDepth(row, rows);
      const scale = scaleAt(t);
      const y = depthToY(t);

      for (let col = 0; col < inThisRow; col += 1) {
        const member = members[i];
        i += 1;

        map.set(member.id, {
          x:
            laneStart +
            LANE / 2 +
            (col - (inThisRow - 1) / 2) * gap +
            jitter(member.id, "x") * 0.5,
          y: y + jitter(member.id, "y") * 0.6,
          width: gap * 1.05 * scale,
          z: Math.round(y * 10),
          order: orderOf.get(member.id) ?? 0,
        });
      }
    }
  });

  return map;
}
