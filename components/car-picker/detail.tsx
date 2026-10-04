import type { RankedGrade, RankedModel } from "@/lib/car-picker/rank";
import {
  COLOR_LABELS,
  type Color,
  type ColorFamily,
} from "@/lib/car-picker/types";
import { HighlightChips, JevChips } from "./chips";
import { CarIcon, swatchBg, yen } from "./shared";

const KIND_LABEL = {
  package: "パッケージ",
  option: "オプション",
  exclusive: "選択装備",
} as const;

export function Detail({
  ranked,
  gradeIndex,
  wantFamily,
  chosenColor,
  totalWith,
  onSelectGrade,
  onSelectColor,
}: {
  ranked: RankedModel;
  gradeIndex: number;
  wantFamily: ColorFamily | "unspecified";
  chosenColor: (rg: RankedGrade) => Color;
  totalWith: (rg: RankedGrade, color: Color) => number;
  onSelectGrade: (i: number) => void;
  onSelectColor: (gradeId: string, colorId: string) => void;
}) {
  const m = ranked;
  const rg = m.grades[gradeIndex];
  if (!rg) return null;
  const b = rg.build;
  const color = chosenColor(rg);
  const total = totalWith(rg, color);
  const grade = rg.grade;

  const picks = b.picks.filter(
    (p) => !(p.kind === "exclusive" && /なし/.test(p.name)),
  );
  const pkgExtra = b.picks
    .filter((p) => p.kind === "package")
    .reduce((s, p) => s + p.monthlyPrice, 0);
  const optExtra = b.picks
    .filter((p) => p.kind !== "package")
    .reduce((s, p) => s + p.monthlyPrice, 0);

  const active = rg.factors
    .filter((f) => f.active)
    .sort((x, y) => y.loss - x.loss);
  const quiet = rg.factors.filter((f) => !f.active);

  return (
    <section id="detail" className="detail">
      <h2>{m.model.name} のおすすめ構成</h2>
      <div className="panel">
        <div className="showcase">
          <CarIcon
            bodyType={m.model.bodyType}
            color={color}
            label={`${m.model.name} ${color.name}`}
            big
          />
          <div>
            <h3>{m.model.name}</h3>
            <div className="grade-name">
              {grade.name}・{color.name}
            </div>
            <div className="total">
              <div className="label">
                おすすめ構成の月額（7年・ボーナス払いなし）
              </div>
              <div className="yen">
                {yen(total)}
                <small>/月</small>
              </div>
            </div>
            <div className="facts">
              <span className="chip">
                納期 {grade.deliveryMonths.join("〜")}ヶ月
              </span>
              {grade.standard.safety.length > 0 && (
                <span className="chip">
                  先進安全 {grade.standard.safety.length}項目 標準
                </span>
              )}
            </div>
            <div className="facts">
              <HighlightChips rg={rg} max={6} />
            </div>
          </div>
        </div>
      </div>

      <div className="panel score-panel">
        <div className="score-head">
          <div className="score-big">
            {Math.round(rg.score)}
            <small>%</small>
          </div>
          <div>
            <div className="section-title" style={{ margin: 0 }}>
              このスコアになった理由
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Jev の答え（確率）を、この車の実際の仕様と照らし合わせて採点。
              {rg.factors.length}
              要素の重み付き幾何平均なので、1つでも大きく外れると全体が下がります。
            </div>
          </div>
        </div>
        <div className="f-head">
          <span>要素</span>
          <span>Jev の答え → この車</span>
          <span>一致度</span>
          <span />
          <span>減点</span>
        </div>
        {active.length === 0 ? (
          <div className="none">要望で触れた要素がありません</div>
        ) : (
          active.map((f) => (
            <div key={f.key} className={`f-row ${f.loss >= 3 ? "hit" : ""}`}>
              <div className="f-label">
                {f.label}
                <span className="f-w">重み {f.weight.toFixed(1)}</span>
              </div>
              <div className="f-flow">
                <span className="chip jev">Jev: {f.jev}</span>
                <span className="f-arrow">→</span>
                <span className="f-car">{f.car}</span>
              </div>
              <div className="f-bar">
                <i
                  className={f.fit < 0.85 ? "low" : ""}
                  style={{ width: `${Math.round(f.fit * 100)}%` }}
                />
              </div>
              <div className="f-fit">{f.fit.toFixed(2)}</div>
              <div className="f-loss">
                {f.loss >= 0.1 ? `−${f.loss.toFixed(1)}` : "±0"}
              </div>
            </div>
          ))
        )}
        {quiet.length > 0 && (
          <div className="f-quiet">
            <span className="muted">要望で触れていない（ほぼ影響なし）:</span>{" "}
            {quiet.map((f) => (
              <span
                key={f.key}
                className="chip"
                title={`Jev: ${f.jev} / この車: ${f.car} / ${f.fit.toFixed(2)}`}
              >
                {f.label}
                {f.loss >= 0.1 ? ` −${f.loss.toFixed(1)}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-title">
          グレード{" "}
          <span className="muted">スコア順・切り替えても Jev は呼びません</span>
        </div>
        <div className="grades">
          {m.grades.map((x, i) => (
            <button
              type="button"
              key={x.grade.id}
              className={`grade ${i === gradeIndex ? "sel" : ""}`}
              onClick={() => onSelectGrade(i)}
            >
              <div className="g-name">{x.grade.label}</div>
              <div className="g-spec">
                {x.grade.fuel === "hybrid" ? "ハイブリッド" : "ガソリン"}・
                {x.grade.drive}・{x.grade.seats}人
              </div>
              <div className="g-foot">
                <span className="g-score">{Math.round(x.score)}%</span>
                <span>{yen(totalWith(x, chosenColor(x)))}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          ボディカラー{" "}
          <span className="muted">
            {color.name}
            {color.monthlyPrice ? ` +${yen(color.monthlyPrice)}` : ""}
          </span>
        </div>
        <div className="swatches">
          {grade.colors.map((c) => {
            const want =
              wantFamily !== "unspecified" && c.families.includes(wantFamily);
            return (
              <button
                type="button"
                key={c.id}
                className={`swatch ${c.id === color.id ? "sel" : ""} ${want ? "want" : ""}`}
                style={{ background: swatchBg(c) }}
                title={`${c.name}${c.monthlyPrice ? ` +${yen(c.monthlyPrice)}` : ""}`}
                aria-label={c.name}
                onClick={() => onSelectColor(grade.id, c.id)}
              />
            );
          })}
        </div>
        <div className="color-note">
          {wantFamily !== "unspecified" &&
            !grade.colors.some((c) => c.families.includes(wantFamily)) && (
              <span className="chip warn">
                ! このグレードに{COLOR_LABELS[wantFamily]}はありません
              </span>
            )}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          付けるもの{" "}
          <span className="muted">Jev が要望ありと判定したものだけ</span>
        </div>
        {picks.length > 0 ? (
          <ul className="items">
            {picks.map((p) => (
              <li key={`${p.kind}:${p.id}`}>
                <div>
                  <span className="i-kind">{KIND_LABEL[p.kind]}</span>
                  <span className="i-name">{p.name}</span>
                </div>
                <div className="i-price">
                  {p.monthlyPrice ? `+${yen(p.monthlyPrice)}` : "¥0"}
                </div>
                {p.reasons.length > 0 && (
                  <div className="i-why">
                    <JevChips reasons={p.reasons} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="none">追加するものはありません</div>
        )}
        {b.skipped.length > 0 && (
          <details className="more">
            <summary>付けなかったもの（{b.skipped.length}件）</summary>
            <ul className="items skipped">
              {b.skipped.map((s) => (
                <li key={`${s.tag}:${s.name}`}>
                  <div className="i-name">{s.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {s.reason}
                  </div>
                  <div className="i-why">
                    <JevChips reasons={[{ tag: s.tag, p: s.p }]} />
                  </div>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="panel">
        <div className="section-title">月額の内訳</div>
        <div className="breakdown">
          <span>車両（{grade.label}）</span>
          <span>{yen(grade.monthlyPrice)}</span>
          <span>ボディカラー</span>
          <span>+{yen(color.monthlyPrice)}</span>
          <span>パッケージ（{b.package.name}）</span>
          <span>+{yen(pkgExtra)}</span>
          <span>オプション・選択装備</span>
          <span>+{yen(optExtra)}</span>
          <span className="sum">合計</span>
          <span className="sum">{yen(total)}</span>
        </div>
        {grade.standard.safety.length > 0 && (
          <details className="more">
            <summary>標準の先進安全装備</summary>
            <div className="facts">
              {grade.standard.safety.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
