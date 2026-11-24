// ---------------------------------------------------------------------------
// Styles (same language as the other juju35 cards)
// ---------------------------------------------------------------------------
import { SCENE_STYLE } from "./picture.js";

export const BASE_STYLE = `
  :host { --wc-accent: #43a047; --wc-ok: var(--success-color, #43a047); --wc-warn: var(--warning-color, #ffa600);
          --wc-crit: var(--error-color, #db4437); --wc-idle: var(--disabled-text-color, #9e9e9e); --wc-active: var(--info-color, #039be5); }
  /* Container queries follow the width the card is given (Sections view columns, mini card). */
  ha-card { overflow: hidden; container-type: inline-size; }
  /* A size container has no width of its own content: this empty, zero-height grid gives the card a natural width of
     --wc-natural-width without any minimum, so that it neither falls to its borders in a parent sized by its content
     nor refuses to shrink in a "1fr 1fr" grid. */
  :host { display: block; min-width: 0; --wc-natural-width: 360px; }
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, var(--wc-natural-width)); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; --mdc-icon-size: 18px; display: inline-flex; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, var(--wc-accent)); outline-offset: 2px; border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
  .ok { --c: var(--wc-ok); } .warn { --c: var(--wc-warn); } .crit { --c: var(--wc-crit); } .idle { --c: var(--wc-idle); } .active { --c: var(--wc-active); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--wc-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--wc-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--wc-ok)) 50%, var(--primary-text-color));
          flex: 0 1 auto; min-width: 0; max-width: 50%; overflow: hidden; box-sizing: border-box; }
  .chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  /* The status pill right after the title, on the title row (see placePill): there only when the whole title and the
     whole label fit; otherwise on its own line under the subtitle (one line then); when even that cuts the label, its
     dot alone, back on the title row. */
  .titles { display: flex; flex-direction: column; }
  .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .trow > .name { flex: 0 1 auto; min-width: 0; }
  .trow > .chip { flex: none; max-width: none; }
  [data-wrap] .trow { display: contents; }
  [data-wrap] .trow > .chip { order: 9; align-self: flex-start; max-width: 100%; margin-top: 2px; }
  [data-wrap] .sub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  [data-dot] .trow > .chip { padding: 4px; }
  [data-dot] .trow > .chip .chip-text { display: none; }
  .type-icon { position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; flex: none; align-items: center; justify-content: center;
               --wc-tint: var(--c, var(--wc-accent)); background: color-mix(in srgb, var(--wc-tint) 16%, transparent); transition: background-color .3s ease; }
  .type-icon .icon { width: 24px; height: 24px; --mdc-icon-size: 24px; fill: color-mix(in srgb, var(--wc-tint) 60%, var(--primary-text-color)); transition: fill .3s ease; }
  .titles { flex: 1 1 0; min-width: 5ch; }
  :host([hide-title]) .titles .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--wc-warn) 50%, var(--primary-text-color)); }
  .picture { flex: none; display: flex; align-items: center; justify-content: center; }
  .picture svg { width: 100%; height: 100%; }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  .line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .line .icon { width: 16px; height: 16px; --mdc-icon-size: 16px; }
  .alert-line { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; min-width: 0;
                color: color-mix(in srgb, var(--c, var(--wc-warn)) 50%, var(--primary-text-color)); }
  .alert-line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .alert-line .icon { width: 16px; height: 16px; --mdc-icon-size: 16px; color: var(--c, var(--wc-warn)); }
  .types { display: flex; flex-wrap: wrap; gap: 4px; min-width: 0; }
  .type { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; padding: 2px 8px 2px 4px; border-radius: 10px; max-width: 100%; box-sizing: border-box;
          background: color-mix(in srgb, var(--tc) 14%, transparent); color: var(--primary-text-color); white-space: nowrap; min-width: 0; }
  .type span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  /* The type's color, drawn toward the text color so that dark bins (grey, brown) stay readable in a dark theme. */
  .type .icon { width: 14px; height: 14px; --mdc-icon-size: 14px; color: color-mix(in srgb, var(--tc) 72%, var(--primary-text-color)); }
  /* The hero's big line: the bins to put out, as large chips. */
  .types.big { gap: 6px; }
  .types.big .type { font-size: 18px; line-height: 1.25; gap: 6px; padding: 4px 12px 4px 8px; border-radius: 16px; }
  .types.big .type .icon { width: 22px; height: 22px; --mdc-icon-size: 22px; }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--wc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, var(--wc-accent)); outline-offset: 1px; }
  .empty { font-size: 13px; color: var(--secondary-text-color); padding: 4px 0; }
  /* Narrow card: the status chip keeps only its colored dot (its text stays in title and aria-label). */
  @container (max-width: 200px) {
    .chip { padding: 4px; flex: none; }
    .chip-text { display: none; }
  }
  @container (max-width: 200px) { .header { gap: 6px; } }
  ${SCENE_STYLE}
`;

export const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .hero { display: flex; gap: 12px; align-items: center; }
  .picture { width: 104px; height: 96px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; --mdc-icon-size: 16px; }
  .section-title span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .section-title.toggle { cursor: pointer; user-select: none; }
  .section-title.toggle[aria-expanded="false"] { margin-bottom: 0; }
  .section-title .chevron { margin-left: auto; width: 16px; height: 16px; transition: transform .2s ease; }
  .section-title.toggle[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 6px; }
  .tile { display: flex; align-items: center; gap: 8px; padding: 6px 10px 6px 6px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .badge { width: 30px; height: 30px; border-radius: 50%; flex: none; display: grid; place-items: center;
                 background: color-mix(in srgb, var(--tc) 18%, transparent); }
  .tile .badge .icon { width: 18px; height: 18px; color: color-mix(in srgb, var(--tc) 72%, var(--primary-text-color)); }
  .tile .txt { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .tile .k { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile .v { font-size: 14px; font-weight: 500; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile.active .v, .tile.warn .v { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); }
  .tile.active, .tile.warn { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 45%, transparent); }
  .list { display: flex; flex-direction: column; gap: 6px; }
  .row { display: grid; grid-template-columns: 92px minmax(0, 1fr) auto; align-items: center; gap: 8px; font-size: 12px; }
  .row .d { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .in { color: var(--secondary-text-color); white-space: nowrap; text-align: right; }
  .row.active .in, .row.warn .in { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); font-weight: 500; }
  /* Narrow card (6 of 12 columns, ~240 px and below): the picture shrinks, the countdown moves under the date. */
  @container (max-width: 300px) {
    .picture { width: 72px; height: 66px; }
    .hero { gap: 10px; }
    .types.big .type { font-size: 16px; }
    .types.big .type .icon { width: 20px; height: 20px; --mdc-icon-size: 20px; }
    .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .tile { padding: 6px 8px; }
    .tile .badge { display: none; }
    .list { gap: 10px; }
    .row { grid-template-columns: minmax(0, 1fr) auto; row-gap: 4px; }
    .row .types { grid-column: 1 / -1; grid-row: 2; }
  }
  @container (max-width: 200px) {
    .picture { width: 56px; height: 52px; }
    .types.big .type { font-size: 14px; padding: 3px 10px 3px 6px; }
    .types.big .type .icon { width: 18px; height: 18px; --mdc-icon-size: 18px; }
  }
`;

export const MINI_STYLE = `
  :host { --wc-natural-width: 300px; }
  .content { padding: 8px 12px 12px; }
  .hero { display: flex; align-items: center; gap: 12px; }
  .picture { width: 72px; height: 66px; }
  .types.big .type { font-size: 16px; }
  .types.big .type .icon { width: 20px; height: 20px; --mdc-icon-size: 20px; }
  @container (max-width: 200px) { .picture { display: none; } }
`;

// Element names of Home Assistant dialogs (more-info opened from the card, among others).
export const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
// The status pill's place, decided by measurement after each render and each new width (the same rule on every
// card): on the title row, right after the title, only when the whole title and the pill's whole label fit there;
// otherwise on its own line under the subtitle (clamped to one line), the title whole on its row (cut only when it
// does not fit alone). When the label is still cut there, or the text block leaves the banner or runs over its ground
// strip, the pill keeps its dot alone, on the title row (its label stays in title and aria-label).
export const placePill = (head, ground) => {
  head.removeAttribute("data-wrap");
  head.removeAttribute("data-dot");
  const pill = head.querySelector(".trow > .chip");
  if (!pill?.getBoundingClientRect) return;
  const text = pill.querySelector(".chip-text");
  // A narrow card (200 px or less) keeps the dot alone, beside the title.
  if (!text || getComputedStyle(text).display === "none") return;
  const row = pill.parentElement;
  const name = row.querySelector(".name");
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const title = name && getComputedStyle(name).display !== "none" ? (name.scrollWidth > name.clientWidth ? name.scrollWidth : name.getBoundingClientRect().width) + gap : 0;
  if (title + pill.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5) return;
  head.setAttribute("data-wrap", "");
  const box = row.parentElement.getBoundingClientRect();
  const frame = head.getBoundingClientRect();
  const floor = ground ? ground.getBoundingClientRect().top : Infinity;
  if ((text.scrollWidth > text.clientWidth + 0.5) || (ground && (box.bottom > floor + 0.5 || box.top < frame.top - 0.5))) {
    head.removeAttribute("data-wrap");
    head.setAttribute("data-dot", "");
  }
};

export const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. It counts when the press and the release are both outside the card (a slider dragged out of the card
// does not fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through
// the click event.
export const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOutside(card, ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOutside(card, ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOutside(card, ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};

// Night picture: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the day
// picture after sunset).
export const isNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

export const sameDeps = (a, b) => !!a && a.length === b.length && a.every((d, i) => d === b[i]);
export const CAL_REFRESH_MS = 3600000;
export const DEFAULT_DAYS = 60;
export const DEFAULT_ITEMS = 6;
