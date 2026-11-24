// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
import { OTHER, cap, esc, intlLocale, t } from "./core.js";
import { addDays, countdown, dayClass, dayKey, daysBetween, fmtDay, keyDate, zoneOf, zoned } from "./days.js";
import { autoEntities, calendarCollections, calendarStateCollections, entityConfs, isWcs, sensorCollections, stubFallback, svgIcon, typeOf } from "./sources.js";
import { BANNER_STYLE, hedgeSvg, sceneSvg } from "./picture.js";
import { BASE_STYLE, CAL_REFRESH_MS, DEFAULT_DAYS, DEFAULT_ITEMS, FULL_STYLE, MINI_STYLE, isNight, isOutside, placePill, sameDeps, watchOutside } from "./styles.js";

export let _wcUid = 0;

export class WasteBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._cal = {};
    this._calVersion = 0;
    this._uid = ++_wcUid;
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // No rewrite of the card between the press and the release: Home Assistant updates the card several times a
    // second, and a rewrite under the pointer replaces the element pressed, so that the click lands on the card itself
    // and does nothing. The pending render is done once released (after the click). The focus is only kept across
    // rewrites for the keyboard: put back after a mouse click or a tap, it would draw the focus ring.
    this.shadowRoot.addEventListener("pointerdown", () => {
      this._byPointer = true;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    // Enter / Space on an element with the button role acts as a click, as on a <button>.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      this._byPointer = false;
      if ((ev.key !== "Enter" && ev.key !== " ") || ev.target?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      ev.target.click();
    });
  }

  set hass(hass) {
    this._hass = hass;
    const deps = this._deps();
    if (deps && sameDeps(this._lastDeps, deps)) return;
    this._lastDeps = deps;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  // What a render reads: the language, the state objects of the entities, the calendar events, the day and whether
  // the evening highlight has started (both move on their own), and the hour (calendars are read again hourly).
  _deps() {
    const h = this._hass;
    if (!h || !this._config) return null;
    const ids = entityConfs(h, this._config).map((e) => e.entity);
    const now = zoned(new Date(), zoneOf(h));
    return [
      h.entities,
      h.language,
      h.locale,
      h.config?.time_zone,
      this._calVersion,
      this._today(),
      now.h >= this._tonightFrom(),
      Math.floor(Date.now() / CAL_REFRESH_MS),
      h.themes?.darkMode,
      ...ids.map((id) => h.states[id]),
    ];
  }

  // Today, in the time zone the dates are shown in.
  _today() {
    return dayKey(new Date(), zoneOf(this._hass));
  }

  connectedCallback() {
    // A click elsewhere on the page folds the sections back to their defaults (clicks in a dialog opened from the card
    // leave them as they are).
    this._onOutside ??= (ev) => {
      if (!this._toggled?.size || !isOutside(this, ev)) return;
      this._toggled = new Map();
      this._update();
    };
    (this._outside ??= watchOutside(this, (ev) => this._onOutside(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    if (this._hass && this._config) this._update();
    // A new width: the status pill is fitted again (in the next frame, and only for a new width).
    if (typeof ResizeObserver === "function") {
      this._resize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._fitWidth) return;
        this._fitWidth = w;
        cancelAnimationFrame(this._fitFrame);
        this._fitFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._resize.observe(this);
    }
    // The countdown and the evening highlight move with the clock: re-checked every minute.
    clearInterval(this._tick);
    this._tick = setInterval(() => {
      if (this._hass) this.hass = this._hass;
    }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    this._tick = null;
    this._resize?.disconnect();
    this._fitWidth = undefined;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
    this._outside?.off();
    this._pressing = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded or with its popup open.
    this._toggled = new Map();
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._lastDeps = null;
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  // Hour from which a collection due tomorrow is shown as "put out tonight" (0: the whole day before).
  _tonightFrom() {
    const h = Number(this._config?.tonight_from ?? 0);
    return Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 0;
  }

  _update() {
    if (!this._hass || !this._config) return;
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    this._syncCalendars();
    const html = this._render();
    if (html !== this._html) {
      const focused = this._byPointer ? null : this._focusedSpot();
      this._html = html;
      this.shadowRoot.innerHTML = html;
      this._fitPill();
      if (focused) this._restoreFocus(focused);
    }
  }

  // The status pill's place, on the banner and on the classic header (see placePill).
  _fitPill() {
    for (const head of this.shadowRoot.querySelectorAll?.(".banner, .header") || []) placePill(head, head.matches(".banner") ? head.querySelector(".road") : null);
  }

  // The focused element (keyboard user), found again after a re-render by its data attributes.
  _focusedSpot() {
    const el = this.shadowRoot.activeElement;
    if (!el?.dataset) return null;
    const data = JSON.stringify({ ...el.dataset });
    return data === "{}" ? null : data;
  }

  _restoreFocus(data) {
    for (const n of this.shadowRoot.querySelectorAll("[data-action], [data-entity]"))
      if (JSON.stringify({ ...n.dataset }) === data) return n.focus({ preventScroll: true });
  }

  // Calendar events are fetched once, again when the calendar's state changes (its next event moved) or after an hour.
  _syncCalendars() {
    const h = this._hass;
    for (const { entity } of entityConfs(h, this._config)) {
      if (!entity.startsWith("calendar.")) continue;
      const s = h.states[entity];
      const key = `${s?.last_updated ?? s?.state}|${this._today()}|${this._days()}`;
      const c = this._cal[entity];
      if (c && (c.loading || (c.key === key && Date.now() - c.at < CAL_REFRESH_MS))) continue;
      this._cal[entity] = { ...c, key, at: Date.now(), loading: true };
      this._fetchCalendar(entity).then((events) => {
        this._cal[entity] = { key, at: Date.now(), loading: false, events: events ?? c?.events ?? null };
        this._calVersion++;
        if (this._hass) this.hass = this._hass;
      });
    }
  }

  _days() {
    const d = Number(this._config.days ?? DEFAULT_DAYS);
    return Number.isFinite(d) && d > 0 ? Math.min(d, 400) : DEFAULT_DAYS;
  }

  // The REST API (GET /api/calendars/<entity>) first, then the calendar.get_events action over the WebSocket.
  // null when neither answers (the calendar's state still gives its next event).
  async _fetchCalendar(entity) {
    const h = this._hass;
    // From the day before (the browser's midnight may come before Home Assistant's): past days are left out later.
    const start = keyDate(addDays(this._today(), -1));
    const end = new Date(start);
    end.setDate(end.getDate() + this._days() + 1);
    try {
      if (typeof h.callApi === "function") {
        const events = await h.callApi("GET", `calendars/${entity}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`);
        if (Array.isArray(events)) return events;
      }
    } catch (_err) {
      /* try the WebSocket */
    }
    try {
      if (typeof h.callWS === "function") {
        const r = await h.callWS({
          type: "call_service",
          domain: "calendar",
          service: "get_events",
          target: { entity_id: entity },
          service_data: { start_date_time: start.toISOString(), end_date_time: end.toISOString() },
          return_response: true,
        });
        const events = r?.response?.[entity]?.events;
        if (Array.isArray(events)) return events;
      }
    } catch (_err) {
      /* the state's next event stays */
    }
    return null;
  }

  // Every collection from today on, sorted: [{ day, days, type, entity }], one per day and type.
  _collections() {
    const h = this._hass;
    const today = this._today();
    const tz = zoneOf(h);
    const tr = (k) => this._t(k);
    const seen = new Map();
    for (const conf of entityConfs(h, this._config)) {
      const s = h.states[conf.entity];
      const wcs = isWcs(h, conf.entity);
      let items;
      if (conf.entity.startsWith("calendar.")) {
        const ev = this._cal[conf.entity]?.events;
        items = ev ? calendarCollections(ev, { tz, split: !wcs }) : calendarStateCollections(s, { split: !wcs });
      } else items = sensorCollections(s, today, { tz, wcs });
      for (const { day, raw } of items) {
        const days = daysBetween(today, day);
        if (days < 0) continue;
        const type = typeOf(raw, conf, this._config, tr);
        const key = `${day}|${type.id}`;
        if (!seen.has(key)) seen.set(key, { day, days, type, entity: conf.entity });
      }
    }
    return [...seen.values()].sort((a, b) => a.day.localeCompare(b.day) || a.type.name.localeCompare(b.type.name));
  }

  _loading() {
    return Object.values(this._cal).some((c) => c.loading && !c.events);
  }

  // The collections of the next collection day.
  _next(list) {
    return list.length ? list.filter((c) => c.day === list[0].day) : [];
  }

  // tonight: due tomorrow and the evening highlight has started; today: due today.
  _due(next) {
    const d = next[0]?.days;
    if (d === 0) return "today";
    if (d === 1 && zoned(new Date(), zoneOf(this._hass)).h >= this._tonightFrom()) return "tonight";
    return "";
  }

  _onClick(ev) {
    this._pressing = false;
    if (ev.detail === 0) this._byPointer = false;
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!el) return;
    ev.stopPropagation();
    const { action, entity } = el.dataset;
    if (action === "zoom") return this._toggleZoom(ev);
    if (action === "toggle_section") {
      const key = el.dataset.section;
      this._toggled = new Map(this._toggled).set(key, !this._isCollapsed(key));
      return this._update();
    }
    if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
  }

  _isCollapsed(key) {
    if (this._toggled?.has(key)) return this._toggled.get(key);
    const c = this._config.collapsed ?? [];
    return (Array.isArray(c) ? c : [c]).includes(key);
  }

  _zoomButton() {
    return "";
  }

  _illustrated() {
    return this._config.illustration !== false;
  }

  // The illustrated header (the classic one with `illustration: false`): the bins of the next collection in front
  // of a hedge, the title and the state of the collection on the sky (the bins' names are the hero's big line).
  _banner(next) {
    const c = this._config;
    const days = next[0]?.days ?? null;
    const cls = dayClass(days);
    const due = this._due(next);
    const loc = this._locale();
    // The status pill right after the title (on its own line under the subtitle when it does not fit there): the
    // countdown ("Tomorrow", "Put out tonight"), in the colour of the header icon.
    const text = !next.length ? this._t(this._loading() ? "loading" : "no_collection") : due === "tonight" ? this._t("put_out_tonight") : countdown(days, loc);
    const chip = `<span class="chip${next.length ? ` clickable" role="button" tabindex="0" data-entity="${esc(next[0].entity)}"` : '"'} title="${esc(text)}" aria-label="${esc(
      text,
    )}"><span class="dot"></span><span class="chip-text">${esc(text)}</span></span>`;
    const bins = next.length ? next.map((x) => x.type) : [{ ...OTHER, name: "" }];
    const hedge = hedgeSvg(bins, due, c.bin_shape, this._uid);
    const scene = next.length
      ? hedge.replace(
          '<svg class="hedge"',
          `<svg class="hedge clickable" role="button" tabindex="0" aria-label="${esc(next.map((x) => x.type.name).join(", "))}" data-entity="${esc(next[0].entity)}"`,
        ).replace(' aria-hidden="true" focusable="false"', "")
      : hedge;
    return `
      <div class="banner ${cls}${isNight(this._hass, c) ? " night" : ""}">
        ${scene}<div class="road" aria-hidden="true"></div>
        <div class="htext">
          <div class="type-icon">${svgIcon("trash-can")}</div>
          <div class="titles">
            <div class="trow"><div class="name">${esc(c.title || this._t("title"))}</div>${chip}</div>
          </div>
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  _header(next, sub) {
    const c = this._config;
    const days = next[0]?.days ?? null;
    const cls = dayClass(days);
    const text = days === null ? this._t("no_collection") : countdown(days, this._locale());
    const chip = next.length
      ? `<span class="chip clickable ${cls}" role="button" tabindex="0" data-entity="${esc(next[0].entity)}" title="${esc(text)}" aria-label="${esc(text)}"><span class="dot"></span><span class="chip-text">${esc(text)}</span></span>`
      : "";
    const two = sub && c.show_subtitle !== false && c.show_title !== false;
    return `
      <div class="header${two ? " two-lines" : ""}">
        <div class="type-icon ${cls}">${svgIcon("trash-can")}</div>
        <div class="titles">
          <div class="trow"><div class="name">${esc(c.title || this._t("title"))}</div>${chip}</div>
          ${sub ? `<div class="sub" title="${esc(sub)}">${esc(sub)}</div>` : ""}
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  _errorCard(key) {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(this._t(key))}</div></ha-card>`;
  }

  _typeChip(type) {
    return `<span class="type" style="--tc:${type.color}">${svgIcon(type.icon)}<span>${esc(type.name)}</span></span>`;
  }

  // Picture, countdown, highlight and the types of the next collection.
  _hero(next) {
    const loc = this._locale();
    if (!next.length) {
      return `<div class="hero"><div class="picture">${sceneSvg([{ ...OTHER, name: "" }], "", this._config.bin_shape)}</div><div class="info"><div class="empty">${esc(this._t(this._loading() ? "loading" : "no_collection"))}</div></div></div>`;
    }
    const due = this._due(next);
    const cls = dayClass(next[0].days);
    // The countdown ("Tomorrow", "Put out tonight", "Today") is the header's status pill: the hero does not repeat
    // it. Its big line is the bins to put out, then the date. The classic header's chip only counts the days, so
    // there the evening / collection-day highlight stays as a line.
    // On a card so narrow that the pill keeps only its dot (≤ 230 px), its text comes back here (.pill-echo).
    const icon = due === "today" ? "truck" : due === "tonight" ? "weather-night" : "calendar-clock";
    const alert = !this._illustrated()
      ? due
        ? `<div class="alert-line ${cls}">${svgIcon(icon)}<span>${esc(this._t(due === "today" ? "collection_today" : "put_out_tonight"))}</span></div>`
        : ""
      : `<div class="alert-line pill-echo ${cls}">${svgIcon(icon)}<span>${esc(due === "tonight" ? this._t("put_out_tonight") : countdown(next[0].days, loc))}</span></div>`;
    return `<div class="hero">
        <div class="picture clickable" role="button" tabindex="0" aria-label="${esc(next.map((c) => c.type.name).join(", "))}" data-entity="${esc(next[0].entity)}">${sceneSvg(
          next.map((c) => c.type),
          due,
          this._config.bin_shape,
        )}</div>
        <div class="info">
          <div class="types big clickable" role="button" tabindex="0" data-entity="${esc(next[0].entity)}">${next.map((c) => this._typeChip(c.type)).join("")}</div>
          ${alert}
          <div class="line">${svgIcon("calendar")}<span>${esc(cap(fmtDay(next[0].day, loc, true)))}</span></div>
        </div>
      </div>`;
  }
}

export class WasteCard extends WasteBase {
  static getConfigElement() {
    return document.createElement("waste-card-editor");
  }

  static getStubConfig(hass) {
    const ids = autoEntities(hass);
    if (ids.length) return { entities: [...ids] };
    // Without Waste Collection Schedule: a calendar or a date sensor that looks like waste collection, else the first
    // calendar, so that the card picker shows a working card rather than "no entities".
    const fallback = stubFallback(hass);
    return fallback ? { entities: [fallback] } : {};
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _sectionTitle(key, icon, label) {
    const closed = this._isCollapsed(key);
    return `<div class="section-title toggle" role="button" tabindex="0" data-action="toggle_section" data-section="${key}" aria-expanded="${!closed}">${svgIcon(icon)}<span>${esc(
      label,
    )}</span>${svgIcon("chevron-down", "chevron")}</div>`;
  }

  // Next collection of every bin type.
  _bins(list) {
    const loc = this._locale();
    const byType = new Map();
    for (const c of list) if (!byType.has(c.type.id)) byType.set(c.type.id, c);
    if (!byType.size) return "";
    const closed = this._isCollapsed("bins");
    const tiles = [...byType.values()]
      .map((c) => {
        const label = `${c.type.name}: ${countdown(c.days, loc)}`;
        return `<div class="tile clickable ${dayClass(c.days)}" role="button" tabindex="0" aria-label="${esc(label)}" data-entity="${esc(c.entity)}" style="--tc:${c.type.color}">
          <span class="badge">${svgIcon(c.type.icon)}</span>
          <div class="txt"><div class="k">${esc(c.type.name)}</div><div class="v">${esc(countdown(c.days, loc))}</div><div class="k">${esc(fmtDay(c.day, loc))}</div></div>
        </div>`;
      })
      .join("");
    return `<div>${this._sectionTitle("bins", "delete-empty", this._t("bins"))}${closed ? "" : `<div class="tiles">${tiles}</div>`}</div>`;
  }

  // The next collection days and their types.
  _upcoming(list) {
    const loc = this._locale();
    const max = Number(this._config.max_items ?? DEFAULT_ITEMS);
    const days = [...new Set(list.map((c) => c.day))].slice(0, Number.isFinite(max) && max > 0 ? max : DEFAULT_ITEMS);
    if (!days.length) return "";
    const closed = this._isCollapsed("upcoming");
    const rows = days
      .map((day) => {
        const items = list.filter((c) => c.day === day);
        return `<div class="row clickable ${dayClass(items[0].days)}" role="button" tabindex="0" data-entity="${esc(items[0].entity)}">
          <span class="d">${esc(fmtDay(day, loc))}</span>
          <div class="types">${items.map((c) => this._typeChip(c.type)).join("")}</div>
          <span class="in">${esc(countdown(items[0].days, loc))}</span>
        </div>`;
      })
      .join("");
    return `<div>${this._sectionTitle("upcoming", "calendar-clock", this._t("upcoming"))}${closed ? "" : `<div class="list">${rows}</div>`}</div>`;
  }

  _render() {
    if (!entityConfs(this._hass, this._config).length) return this._errorCard("no_entities");
    const c = this._config;
    const list = this._collections();
    const next = this._next(list);
    const parts = [this._hero(next)];
    if (c.show_bins !== false) parts.push(this._bins(list));
    if (c.show_upcoming !== false) parts.push(this._upcoming(list));
    const sub = next.length ? `${this._t("next")} · ${cap(fmtDay(next[0].day, this._locale()))}` : "";
    const ill = this._illustrated();
    return `<style>${BASE_STYLE}${FULL_STYLE}${ill ? BANNER_STYLE : ""}</style>
      <ha-card${ill ? ' class="illustrated"' : ""}>
        ${ill ? this._banner(next) : this._header(next, sub)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }
}

// The mini card shows the next collection only; its detail button (top right, `zoom: false` removes it) switches it
// to the full card's content and back, and a click anywhere else on the page brings the compact view back.
export class WasteMiniCard extends WasteCard {
  constructor() {
    super();
    this._onUnzoom = (ev) => {
      if (this._zoomed && isOutside(this, ev)) this._setZoom(false);
    };
  }

  static getConfigElement() {
    return document.createElement("waste-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    (this._unzoom ??= watchOutside(this, (ev) => this._onUnzoom(ev))).on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom?.off();
    // Back to the compact view once off the screen (see the full card).
    this._zoomed = false;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 2;
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? "arrow-collapse" : "arrow-expand")}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
    this.dispatchEvent(new CustomEvent("iron-resize", { bubbles: true, composed: true }));
  }

  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _render() {
    if (this._zoomed) return super._render();
    if (!entityConfs(this._hass, this._config).length) return this._errorCard("no_entities");
    const next = this._next(this._collections());
    const ill = this._illustrated();
    return `<style>${BASE_STYLE}${MINI_STYLE}${ill ? BANNER_STYLE : ""}</style>
      <ha-card${ill ? ' class="illustrated"' : ""}>
        ${ill ? this._banner(next) : this._header(next, next.length ? this._t("next") : "")}
        <div class="content">${this._hero(next)}</div>
      </ha-card>`;
  }
}
