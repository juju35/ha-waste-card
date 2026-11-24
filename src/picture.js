// ---------------------------------------------------------------------------
// Picture: the wheelie bins of the next collection, animated by what is due
// ---------------------------------------------------------------------------
import { ICONS, categoryByKey } from "./core.js";
import { iconName } from "./sources.js";

// tonight: the bins roll to the kerb, wheels turning, under the moon; today: their lids lift (being emptied) and
// rings pulse around them. Every animation honours prefers-reduced-motion.
export const SCENE_STYLE = `
  .scene { overflow: visible; }
  .scene .wheel, .scene .lid, .scene .roll, .scene .ring, .scene .star { transform-box: fill-box; }
  .scene .lid { transform-origin: 0% 100%; }
  .scene .wheel { transform-origin: center; }
  .scene .ring { transform-origin: center; opacity: 0; }
  .scene .moon, .scene .star { opacity: 0; }
  .scene.tonight .roll { animation: wc-roll 3s ease-in-out infinite; }
  .scene.tonight .wheel { animation: wc-spin 3s ease-in-out infinite; }
  .scene.tonight .moon { opacity: 1; }
  .scene.tonight .star { transform-origin: center; animation: wc-twinkle 1.5s ease-in-out infinite; }
  .scene.tonight .star.s2 { animation-delay: -.75s; }
  .scene.today .lid { animation: wc-lid 3s ease-in-out infinite; }
  .scene.today .b1 .lid { animation-delay: -.25s; } .scene.today .b2 .lid { animation-delay: -.5s; }
  .scene.today .ring { animation: wc-ring 1.5s ease-out infinite; }
  .scene.today .ring.r2 { animation-delay: -.75s; }
  @keyframes wc-roll { 0%, 100% { transform: translateX(-7px); } 50% { transform: translateX(7px); } }
  @keyframes wc-spin { 0%, 100% { transform: rotate(-160deg); } 50% { transform: rotate(160deg); } }
  @keyframes wc-twinkle { 0%, 100% { opacity: .2; transform: scale(.6); } 50% { opacity: 1; transform: scale(1); } }
  @keyframes wc-lid { 0%, 25%, 75%, 100% { transform: rotate(0); } 40%, 60% { transform: rotate(-40deg); } }
  @keyframes wc-ring { from { transform: scale(.55); opacity: .7; } to { transform: scale(1.15); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .scene * { animation: none !important; } }
`;

// The drawn bin (44 × 66 at x, y) in the color of its type, with the type's icon on its front. Four silhouettes,
// chosen with `bin_shape`: the default rolled-out wheelie bin, a flat-lid two-wheel bin, a cylindrical can and a
// North-American roll-out cart. Each keeps a `.lid` and, where it has one, a `.wheel` group for the animations.
export const BIN_SHAPES = {
  wheelie: (c, dark, g) => `
    <path d="M5 14h34l-3.6 46a3 3 0 0 1-3 2.8H11.6a3 3 0 0 1-3-2.8z" style="fill:${c}"/>
    <path d="M5 14h34l-.5 6H5.5z" fill="#000" opacity=".16"/>
    <path d="M10 22h3l-1.6 36h-2z" fill="#fff" opacity=".18"/>
    <path transform="translate(14 28) scale(.67)" d="${g}" fill="#fff" opacity=".92"/>
    <g class="lid"><path d="M2 8.5h40a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H2A1.5 1.5 0 0 1 .5 13v-3A1.5 1.5 0 0 1 2 8.5z" style="fill:${dark}"/>
      <rect x="34" y="5" width="9" height="4.5" rx="1.5" style="fill:${dark}"/></g>
    <g class="wheel"><circle cx="12" cy="61" r="5.5" fill="#2b2b2b"/><circle cx="12" cy="61" r="2" fill="#9e9e9e"/><rect x="11.4" y="56" width="1.2" height="10" fill="#9e9e9e"/></g>`,
  flat: (c, dark, g) => `
    <g class="wheel"><circle cx="11" cy="61" r="3.2" fill="#2b2b2b"/><circle cx="11" cy="61" r="1.3" fill="#9e9e9e"/></g>
    <g class="wheel"><circle cx="33" cy="61" r="3.2" fill="#2b2b2b"/><circle cx="33" cy="61" r="1.3" fill="#9e9e9e"/></g>
    <path d="M5 14h34l-2 47a3 3 0 0 1-3 2.8H10a3 3 0 0 1-3-2.8z" style="fill:${c}"/>
    <path d="M5 14h34l-.3 5H5.3z" fill="#000" opacity=".16"/>
    <path d="M10 21h3l-1.4 37h-2z" fill="#fff" opacity=".18"/>
    <path transform="translate(13.5 28) scale(.66)" d="${g}" fill="#fff" opacity=".92"/>
    <g class="lid"><path d="M2 7.5h40a1.8 1.8 0 0 1 1.8 1.8v2.6a1.8 1.8 0 0 1-1.8 1.8H2a1.8 1.8 0 0 1-1.8-1.8V9.3A1.8 1.8 0 0 1 2 7.5z" style="fill:${dark}"/>
      <rect x="18" y="4" width="8" height="4" rx="1.6" style="fill:${dark}"/></g>`,
  can: (c, dark, g) => `
    <path d="M7 16v43a15 4.5 0 0 0 30 0V16z" style="fill:${c}"/>
    <path d="M11 20C9.8 33 9.8 46 11.4 58" stroke="#fff" stroke-opacity=".22" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M33 21C34 33 34 45 32.6 56" stroke="#000" stroke-opacity=".13" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path transform="translate(13 28) scale(.6)" d="${g}" fill="#fff" opacity=".92"/>
    <g class="lid"><path d="M7 15a15 5 0 0 1 30 0a15 4 0 0 1-30 0z" style="fill:${dark}"/>
      <path d="M9 13a13 6 0 0 1 26 0z" style="fill:${dark}"/>
      <rect x="18.5" y="6" width="7" height="3.4" rx="1.6" style="fill:${dark}"/><rect x="20.5" y="8.5" width="3" height="4" style="fill:${dark}"/></g>`,
  cart: (c, dark, g) => `
    <g class="wheel"><circle cx="13" cy="60" r="6" fill="#2b2b2b"/><circle cx="13" cy="60" r="2.2" fill="#9e9e9e"/><rect x="12.4" y="54" width="1.2" height="12" fill="#9e9e9e"/></g>
    <path d="M8 20C8 15 11 14 15 14h14c4 0 7 1 7 6l-2.4 40a3.2 3.2 0 0 1-3.2 3H13.6a3.2 3.2 0 0 1-3.2-3z" style="fill:${c}"/>
    <path d="M8.3 20C8.3 15.4 11 14.3 15 14.3h14c4 0 6.7 1.2 6.7 5.7l-.3 5H8.6z" fill="#000" opacity=".15"/>
    <path d="M12 23h3l-1.3 34h-2z" fill="#fff" opacity=".18"/>
    <path transform="translate(14 29) scale(.62)" d="${g}" fill="#fff" opacity=".92"/>
    <g class="lid"><path d="M6 12h27l5 5v2.2a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6V13.6A1.6 1.6 0 0 1 6 12z" style="fill:${dark}"/></g>`,
};

export const binSvg = (type, x, y, i, shape) => {
  const c = type.color;
  const dark = `color-mix(in srgb, ${c} 68%, #000)`;
  const glyph = ICONS[iconName(type.icon)] || ICONS[categoryByKey(type.category)?.icon] || ICONS["trash-can"];
  return `<g class="bin b${i}" transform="translate(${x} ${y})">${(BIN_SHAPES[shape] || BIN_SHAPES.wheelie)(c, dark, glyph)}</g>`;
};

// The bins of the next collection (three at most), side by side; `shape` (bin_shape) sets their silhouette, the
// state (tonight / today / '') the animation. In the banner (`banner`), the hedge scene brings its own sky: no
// rings, moon or stars, but a glow under the bins in the colour of the state.
export const binsSvg = (types, shape, banner) => {
  const list = types.slice(0, 3);
  const n = Math.max(1, list.length);
  const w = 120;
  const gap = n === 1 ? 0 : n === 2 ? 46 : 36;
  const start = (w - 44 - gap * (n - 1)) / 2;
  const scale = n === 3 ? 0.86 : 1;
  const bins = list.map((ty, i) => binSvg(ty, start + gap * i, 38, i, shape)).join("");
  const rx = 26 + 16 * (n - 1);
  const roll = `<g class="roll"><g transform="translate(${(60 * (1 - scale)).toFixed(1)} ${(104 * (1 - scale)).toFixed(1)}) scale(${scale})">${bins}</g></g>`;
  if (banner) return `<ellipse class="glow" cx="60" cy="104" rx="${rx + 10}" ry="7"/><ellipse cx="60" cy="104" rx="${rx}" ry="4" fill="#000" opacity=".18"/>${roll}`;
  return `<ellipse cx="60" cy="104" rx="${rx}" ry="4" fill="#000" opacity=".12"/>
    <circle class="ring" cx="60" cy="70" r="50" fill="none" stroke="var(--wc-active)" stroke-width="2"/>
    <circle class="ring r2" cx="60" cy="70" r="50" fill="none" stroke="var(--wc-active)" stroke-width="2"/>
    <path class="moon" d="M102 6a11 11 0 1 0 10 15 9 9 0 0 1-10-15z" fill="#ffca28"/>
    <path class="star" d="M84 10l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#ffe082"/>
    <path class="star s2" d="M92 30l.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z" fill="#ffe082"/>
    ${roll}`;
};

export const sceneSvg = (types, state, shape) =>
  `<svg class="scene ${state}" viewBox="0 0 120 112" role="img" aria-hidden="true">
    ${binsSvg(types, shape, false)}
  </svg>`;

// ---------------------------------------------------------------------------
// Illustrated header: the bins of the next collection stand on the pavement in front of a hedge, under the sky
// (sun by day, moon and stars by night), above a 10 px road strip running under the whole banner. The picture is
// 200 × 80 at the right of the banner, faded in from its left edge where the title sits on the sky.
// ---------------------------------------------------------------------------

export const HEDGE_STARS = [
  [40, 8, 0.6],
  [120, 6, 0.6],
  [170, 12, 0.6],
  [72, 16, 0.5],
  [186, 4, 0.5],
];

// The bins' frame in the 200 × 80 picture: one bin is drawn a little larger than two or three.
export const BIN_FRAMES = {
  1: { x: 80, y: 15.7, w: 110, h: 62.3, vb: "0 44 120 68" },
  n: { x: 90.5, y: 10, w: 99.5, h: 68, vb: "0 30 120 82" },
};

// `uid` keeps the ids of each card's mask apart on a page with several cards.
export const hedgeSvg = (types, state, shape, uid) => {
  const fr = types.length > 1 ? BIN_FRAMES.n : BIN_FRAMES[1];
  const puffs = Array.from({ length: 22 }, (_, i) => `<circle class="h2" cx="${(i * 9.5).toFixed(1)}" cy="${30 + (i % 3) * 2}" r="${7 + (i % 2)}"/>`).join("");
  const leaves = Array.from(
    { length: 60 },
    (_, i) => `<circle class="${i % 2 ? "h3" : "h1"}" cx="${((i * 13.7) % 200).toFixed(1)}" cy="${(38 + ((i * 7.3) % 36)).toFixed(1)}" r="${(1.4 + (i % 3) * 0.5).toFixed(1)}"/>`,
  ).join("");
  const stars = HEDGE_STARS.map(([x, y, r], i) => `<circle class="hd-star${i % 2 ? " tw" : ""}" cx="${x}" cy="${y}" r="${r}"/>`).join("");
  return `<svg class="hedge" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="wc-fade-${uid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="34" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <mask id="wc-mask-${uid}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="100"><rect x="-10" y="-10" width="220" height="100" fill="url(#wc-fade-${uid})"/></mask>
    </defs>
    <g mask="url(#wc-mask-${uid})">
      <g class="hd-day"><circle class="hd-sun" cx="150" cy="12" r="6"/></g>
      <g class="hd-night">${stars}<circle class="hd-moon" cx="150" cy="12" r="4.5"/></g>
      <rect class="h1" x="0" y="30" width="200" height="50" rx="10"/>${puffs}<g class="hd-leaves">${leaves}</g>
      <rect class="hd-walk" x="0" y="72" width="200" height="8"/>
      <svg class="scene ${state}" x="${fr.x}" y="${fr.y}" width="${fr.w}" height="${fr.h}" viewBox="${fr.vb}">${binsSvg(types, shape, true)}</svg>
    </g>
  </svg>`;
};

// The banner's colours and animations, day and night.
export const BANNER_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; --wc-sky-text: #0d2a45; --wc-sky-muted: #3b5b78; color: var(--wc-sky-text);
            background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%); }
  .banner.night { --wc-sky-text: #fff; --wc-sky-muted: rgba(255,255,255,.78);
                  background: linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%); }
  /* The picture's width: up to 265 px, but from 200 px on it leaves the title row 260 px, so that the title keeps a
     few words beside its status pill. */
  .banner { --wc-art-w: min(54%, clamp(200px, 100cqw - 260px, 265px)); }
  .banner .hedge { position: absolute; right: 0; bottom: 10px; height: 80px; width: var(--wc-art-w); overflow: hidden; }
  .banner .road { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: #858c94; box-shadow: inset 0 1px 0 #6f767d; }
  .banner .road::after { content: ""; position: absolute; left: 0; right: 0; top: calc(50% - .8px); height: 1.6px;
                         background: repeating-linear-gradient(90deg, rgba(255,255,255,.85) 0 9px, transparent 9px 18px); }
  .banner.night .road { background: #2c323b; box-shadow: inset 0 1px 0 #3a414b; }
  .hedge .h1 { fill: #4f9a3a; } .hedge .h2 { fill: #5fae45; } .hedge .h3 { fill: #74c25a; } .hd-leaves circle { opacity: .85; }
  .night .hedge .h1 { fill: #1e3d2a; } .night .hedge .h2 { fill: #24482f; } .night .hedge .h3 { fill: #2b5537; }
  .hd-walk { fill: #c9c4ba; } .night .hd-walk { fill: #3a3f48; }
  .hd-sun { fill: #ffd65a; } .hd-moon { fill: #f3eed2; } .hd-star { fill: #fff; opacity: .8; }
  .hd-star.tw { animation: wc-twinkle 3.2s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
  .hd-night, .night .hd-day { display: none; }
  .night .hd-night { display: inline; }
  /* The state of the next collection: a glow under the bins (today: pulsing), in the state's colour. */
  .hedge .glow { fill: var(--c, transparent); opacity: 0; transform-box: fill-box; transform-origin: center; }
  .banner.active .hedge .glow, .banner.warn .hedge .glow { opacity: .32; }
  .banner.active .hedge .glow { animation: wc-glow 1.8s ease-in-out infinite; }
  .night .hedge .scene .bin { filter: brightness(.88); }
  @keyframes wc-glow { 0%, 100% { opacity: .15; transform: scaleX(.85); } 50% { opacity: .45; transform: scaleX(1.05); } }
  /* The text on the sky, left of the picture: the round icon (its colour is the state's), the title, the state. */
  .htext { position: absolute; left: 12px; top: 6px; bottom: 16px; right: calc(var(--wc-art-w) + 4px); display: flex; align-items: center; gap: 10px; min-width: 0; }
  .htext .titles { display: flex; flex-direction: column; gap: 2px; }
  .banner .type-icon { background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 22%, transparent); }
  .banner .type-icon .icon { fill: var(--c); }
  .banner.night .type-icon { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner.night .type-icon .icon { fill: color-mix(in srgb, var(--c) 72%, #fff); }
  .banner .name { font-weight: 500; }
  .banner .sub { font-size: 13px; color: var(--wc-sky-muted); }
  :host([hide-subtitle]) .banner .sub, :host([hide-title]) .trow .name { display: none; }
  /* Status pill right after the title, on a frosted tint of the icon's colour, with its whole label, only when the
     whole title fits beside it (measured by the card, see placePill); otherwise on its own line under the title, the
     title whole on its row; when that still cuts the label or leaves the banner, the pill keeps its dot alone. */
  .htext .titles { min-width: 0; }
  .banner .chip { line-height: 16px; background: color-mix(in srgb, var(--c, var(--wc-ok)) 18%, rgba(255,255,255,.78));
                  color: color-mix(in srgb, var(--c, var(--wc-ok)) 45%, #0d2a45); }
  .banner.night .chip { background: color-mix(in srgb, var(--c, var(--wc-ok)) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c, var(--wc-ok)) 35%, #ffffff); }
  .banner .chip .dot { width: 7px; height: 7px; }
  .banner[data-wrap] .titles { gap: 1px; }
  /* On its own line the pill may run over the left of the scene. */
  .banner[data-wrap] .trow > .chip { max-width: calc(100cqw - 76px); }
  /* The mini card's expand / collapse button: 24 px, frosted, 5 px from the banner's top right corner. */
  .banner .zoom { position: absolute; top: 5px; right: 5px; z-index: 2; margin: 0; color: #33506b; background: rgba(255,255,255,.55);
                  box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
  .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
  .banner .hedge.clickable:focus-visible { outline: 2px solid var(--primary-color, var(--wc-accent)); outline-offset: -2px; }
  /* The bins are in the banner: the picture beside the countdown gives way. */
  .illustrated .hero .picture { display: none; }
  .illustrated .alert-line.pill-echo { display: none; }
  @container (max-width: 200px) { .illustrated .alert-line.pill-echo { display: flex; } }
  /* Narrower cards: the picture is drawn smaller (80 %, then 70 %), its left part (hedge only) faded out, so that the
     title stays whole and the status pill keeps its label; narrower still, the road strip alone (the bins are the
     hero's big line). */
  @container (max-width: 380px) {
    .banner { --wc-art-w: 115px; }
    .banner .hedge { width: 160px; height: 64px; -webkit-mask-image: linear-gradient(90deg, transparent 45px, #000 57px); mask-image: linear-gradient(90deg, transparent 45px, #000 57px); }
  }
  @container (max-width: 320px) {
    .banner { --wc-art-w: 95px; }
    .banner .hedge { width: 140px; height: 56px; -webkit-mask-image: linear-gradient(90deg, transparent 45px, #000 55px); mask-image: linear-gradient(90deg, transparent 45px, #000 55px); }
  }
  @container (max-width: 270px) { .banner .hedge { display: none; } .htext { right: 36px; } }
`;
