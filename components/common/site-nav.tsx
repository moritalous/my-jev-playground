export type NavKey =
  | "searchfilter"
  | "dinner"
  | "carpicker"
  | "persona"
  | "router"
  | "guide";

export const NAV_APPS = [
  { key: "dinner", href: "/dinner", name: "今夜なに作る？" },
  { key: "persona", href: "/persona", name: "ウケるかなパネル" },
  { key: "searchfilter", href: "/search-filter", name: "探してるものだけ" },
  { key: "router", href: "/router", name: "振り分け" },
  { key: "carpicker", href: "/car-picker", name: "Car Picker" },
] as const;

const TITLES: Record<NavKey, string> = {
  searchfilter: "探してるものだけ表示",
  dinner: "今夜なに作る？",
  carpicker: "ソラカー Car Picker",
  persona: "新規事業ウケるかな？パネル",
  router: "問い合わせ振り分け",
  guide: "Jev の使い方",
};

export function SiteNav({ current }: { current: NavKey }) {
  return (
    <>
      <style>{CSS}</style>
      <nav className="jevnav" aria-label="サイト内ナビゲーション">
        <ol className="jevnav-crumbs">
          <li>
            <a href="/">my-jev-playground</a>
          </li>
          <li aria-current="page">{TITLES[current]}</li>
        </ol>
        <div className="jevnav-links">
          {NAV_APPS.map((a) => (
            <a
              key={a.key}
              href={a.href}
              aria-current={a.key === current ? "page" : undefined}
            >
              {a.name}
            </a>
          ))}
          <a
            className="jevnav-guide"
            href={current === "guide" ? "/guide" : `/guide#${current}`}
            aria-current={current === "guide" ? "page" : undefined}
          >
            Jev の使い方
          </a>
        </div>
      </nav>
    </>
  );
}

const CSS = `
:root { --jevnav-h: 40px; }
.jevnav {
  position: relative; z-index: 10; box-sizing: border-box; height: var(--jevnav-h);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 0 14px; overflow: hidden; white-space: nowrap;
  background: #f4f4f2; color: #444; border-bottom: 1px solid rgba(128,128,128,.28);
  font: 13px/1 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif;
  letter-spacing: normal; text-transform: none; text-align: left;
}
.jevnav a { color: inherit; text-decoration: none; }
.jevnav-crumbs { display: flex; align-items: center; min-width: 0; margin: 0; padding: 0; list-style: none; }
.jevnav-crumbs li { overflow: hidden; text-overflow: ellipsis; }
.jevnav-crumbs li + li::before { content: "›"; margin: 0 8px; opacity: .5; }
.jevnav-crumbs li:first-child a { opacity: .75; }
.jevnav-crumbs li:first-child a:hover { opacity: 1; text-decoration: underline; }
.jevnav-crumbs li[aria-current] { font-weight: 600; color: #111; }
.jevnav-links { display: flex; align-items: center; gap: 2px; overflow-x: auto; scrollbar-width: none; }
.jevnav-links::-webkit-scrollbar { display: none; }
.jevnav-links a { padding: 6px 9px; border-radius: 6px; opacity: .8; }
.jevnav-links a:hover { background: rgba(128,128,128,.18); opacity: 1; }
.jevnav-links a[aria-current] { background: rgba(128,128,128,.22); opacity: 1; font-weight: 600; }
.jevnav-guide { margin-left: 6px; border: 1px solid rgba(128,128,128,.45); }
@media (max-width: 760px) { .jevnav-crumbs li:first-child { display: none; } .jevnav-crumbs li + li::before { display: none; } }

`;
