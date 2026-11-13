// The cards: rendering, highlight, sections, mini card zoom, calendars and the editor.
import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarEvents, entities, states, today } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const SENSORS = ["sensor.waste_collection", "sensor.bulky_waste"];

const makeHass = (st = states, extra = {}) => ({ entities, states: st, language: "en", ...extra });

const newCard = (config = {}, { Card = "WasteCard", hass = makeHass(), wc = load() } = {}) => {
  const card = new wc[Card]();
  card.setConfig({ entities: SENSORS, ...config });
  card.hass = hass;
  return { card, wc, html: () => card.shadowRoot.innerHTML };
};

// A click on an element of the card, as composedPath() would report it.
const click = (card, dataset, detail = 1) => {
  const el = { dataset };
  card._onClick({ composedPath: () => [el], stopPropagation() {}, detail });
};


// A tap elsewhere on the page: the press and the release (iOS sends no click for a tap on something not clickable).
const tapDoc = (wc, ev) => {
  wc.fireDocument("pointerdown", ev);
  wc.fireDocument("pointerup", ev);
};

test("the next collection, with its bins to put out tonight", () => {
  const { html } = newCard();
  const h = html();
  assert.match(h, /<div class="when">Tomorrow<\/div>/);
  assert.match(h, /Put out tonight/);
  assert.match(h, /class="scene tonight"/);
  assert.match(h, /<span class="chip clickable warn"[^>]*data-entity="sensor\.waste_collection"/);
  assert.match(h, /Next collection · Sat, Nov 14/);
  // One tile per bin type, the date sensor included.
  assert.equal((h.match(/class="tile clickable/g) || []).length, 7);
  assert.match(h, /Bulky waste<\/div><div class="v">In 25 days/);
  // Six collection days by default.
  assert.equal((h.match(/class="row clickable/g) || []).length, 6);
});

test("tonight_from: the day before is highlighted only from that hour", () => {
  const wc = load("2026-11-13T09:00:00Z");
  const { card, html } = newCard({ tonight_from: 17 }, { wc });
  assert.doesNotMatch(html(), /Put out tonight/);
  assert.match(html(), /class="scene "/);
  wc.setNow("2026-11-13T17:00:00Z");
  card.hass = makeHass();
  assert.match(html(), /Put out tonight/);
});

test("a collection today", () => {
  const { html } = newCard({}, { hass: makeHass({ ...states, ...today }) });
  assert.match(html(), /Collection today/);
  assert.match(html(), /class="scene today"/);
  assert.match(html(), /<span class="chip clickable active"/);
});

test("past collections are left out, the same collection from two sources is shown once", () => {
  const st = { ...states, "sensor.waste_collection": { ...states["sensor.waste_collection"], attributes: { "2026-11-10": "Paper", "2026-11-14": "Glass" } }, "sensor.glass": { state: "2026-11-14", attributes: { friendly_name: "glass" } } };
  const { html } = newCard({ entities: ["sensor.waste_collection", "sensor.glass"], show_bins: false }, { hass: makeHass(st) });
  assert.doesNotMatch(html(), /Paper/);
  assert.equal((html().match(/<span>Glass<\/span>/g) || []).length, 2); // hero + one list row
});

test("options: max_items, sections hidden, own title and types", () => {
  const { html } = newCard({ max_items: 2, show_bins: false, title: "Bins", types: [{ match: "Glass", name: "Bottle bank", color: "#00ff00" }] });
  assert.equal((html().match(/class="row clickable/g) || []).length, 2);
  assert.doesNotMatch(html(), /class="tile/);
  assert.match(html(), /<div class="name">Bins<\/div>/);
  assert.match(html(), /style="--tc:#00ff00"[^<]*<svg[^>]*><path[^>]*><\/path><\/svg><span>Bottle bank|style="--tc:#00ff00">/);
});

test("collapsible sections: chevron state, folded by default, unfolded back by a click elsewhere", () => {
  const { card, html, wc } = newCard({ collapsed: ["upcoming"] });
  card.connectedCallback();
  assert.match(html(), /data-section="upcoming" aria-expanded="false"/);
  assert.match(html(), /data-section="bins" aria-expanded="true"/);
  assert.doesNotMatch(html(), /class="row/);
  click(card, { action: "toggle_section", section: "upcoming" });
  assert.match(html(), /data-section="upcoming" aria-expanded="true"/);
  // A click in a more-info dialog leaves it, a click elsewhere folds it back.
  tapDoc(wc, { composedPath: () => [{ tagName: "HA-MORE-INFO-DIALOG" }] });
  assert.match(html(), /data-section="upcoming" aria-expanded="true"/);
  tapDoc(wc, { composedPath: () => [{ tagName: "DIV" }] });
  assert.match(html(), /data-section="upcoming" aria-expanded="false"/);
});

test("folding: a press in the card released outside does not fold, a keyboard click does, leaving the page folds", () => {
  const { card, html, wc } = newCard({ collapsed: ["upcoming"] });
  card.connectedCallback();
  click(card, { action: "toggle_section", section: "upcoming" });
  // A slider pressed in the card and released outside of it: nothing folds.
  wc.fireDocument("pointerdown", { composedPath: () => [card] });
  wc.fireDocument("pointerup", { composedPath: () => [{ tagName: "DIV" }] });
  assert.match(html(), /data-section="upcoming" aria-expanded="true"/);
  // A mouse click (detail 1) is the pointer's job; a keyboard click (detail 0) folds.
  wc.fireDocument("click", { detail: 1, composedPath: () => [{ tagName: "DIV" }] });
  assert.match(html(), /data-section="upcoming" aria-expanded="true"/);
  wc.fireDocument("click", { detail: 0, composedPath: () => [{ tagName: "DIV" }] });
  assert.match(html(), /data-section="upcoming" aria-expanded="false"/);
  // Left with the section open and back: folded.
  click(card, { action: "toggle_section", section: "upcoming" });
  card.disconnectedCallback();
  card.connectedCallback();
  assert.match(html(), /data-section="upcoming" aria-expanded="false"/);
});

test("a click on a collection opens the more-info of its entity", () => {
  const { card } = newCard();
  click(card, { entity: "sensor.bulky_waste" });
  assert.equal(card.events.at(-1).type, "hass-more-info");
  assert.equal(card.events.at(-1).detail.entityId, "sensor.bulky_waste");
});

test("the mini card shows the next collection, its detail button switches to the full card and back", () => {
  const { card, html, wc } = newCard({}, { Card: "WasteMiniCard" });
  card.connectedCallback();
  assert.match(html(), /Put out tonight/);
  assert.doesNotMatch(html(), /class="tile/);
  assert.match(html(), /<button class="zoom" data-action="zoom" title="Show details"/);
  assert.deepEqual({ ...card.getGridOptions() }, { columns: 6, min_columns: 6, rows: "auto" });
  click(card, { action: "zoom" });
  assert.match(html(), /class="tile/);
  assert.match(html(), /title="Show less"/);
  tapDoc(wc, { composedPath: () => [{ tagName: "DIV" }] });
  assert.doesNotMatch(html(), /class="tile/);
  const { html: noZoom } = newCard({ zoom: false }, { Card: "WasteMiniCard" });
  assert.doesNotMatch(noZoom(), /class="zoom"/);
});

test("without entities: the Waste Collection Schedule ones, or a message", () => {
  const wc = load();
  const card = new wc.WasteCard();
  card.setConfig({});
  card.hass = makeHass();
  // Discovered sensor and calendar of Waste Collection Schedule, the template sensor left out.
  assert.deepEqual([...wc.autoEntities(makeHass())], ["calendar.waste_collection", "sensor.waste_collection"]);
  assert.match(card.shadowRoot.innerHTML, /Tomorrow/);
  const empty = new wc.WasteCard();
  empty.setConfig({});
  empty.hass = { states: {}, entities: {}, language: "en" };
  assert.match(empty.shadowRoot.innerHTML, /No waste collection entity found/);
  assert.deepEqual(JSON.parse(JSON.stringify(wc.WasteCard.getStubConfig(makeHass()))), { entities: ["calendar.waste_collection", "sensor.waste_collection"] });
});

test("an unrelated state change does not rebuild the card", () => {
  const { card } = newCard();
  let renders = 0;
  const render = card._render.bind(card);
  card._render = () => {
    renders++;
    return render();
  };
  card.hass = makeHass({ ...states, "light.elsewhere": { state: "on", attributes: {} } });
  assert.equal(renders, 0);
  card.hass = makeHass({ ...states, ...today });
  assert.equal(renders, 1);
});

const settle = () => new Promise((r) => setTimeout(r, 0));

test("calendars: events fetched through the REST API, once", async () => {
  const calls = [];
  const callApi = async (method, path) => {
    calls.push([method, path]);
    return calendarEvents["calendar.waste_collection"];
  };
  const { card, html } = newCard({ entities: ["calendar.waste_collection"], days: 90 }, { hass: makeHass(states, { callApi }) });
  // Until the events arrive, the calendar's own next event.
  assert.match(html(), /In 3 days/);
  assert.doesNotMatch(html(), /Packaging/);
  await settle();
  assert.match(html(), /Packaging/);
  assert.match(html(), /Christmas trees/);
  assert.equal(calls.length, 1);
  assert.match(calls[0][1], /^calendars\/calendar\.waste_collection\?start=2026-11-12T00%3A00%3A00\.000Z&end=2027-02-11T00%3A00%3A00\.000Z$/);
  card.hass = makeHass({ ...states }, { callApi });
  await settle();
  assert.equal(calls.length, 1);
});

test("calendars: read again after an hour, even when nothing else changed", async () => {
  const wc = load();
  let calls = 0;
  const callApi = async () => {
    calls++;
    return calendarEvents["calendar.waste_collection"];
  };
  const { card } = newCard({ entities: ["calendar.waste_collection"] }, { hass: makeHass(states, { callApi }), wc });
  await settle();
  assert.equal(calls, 1);
  wc.setNow("2026-11-13T18:59:00Z");
  const tick = () => {
    card.hass = makeHass(states, { callApi }); // the minute tick hands the same hass again
  };
  tick();
  await settle();
  assert.equal(calls, 1);
  wc.setNow("2026-11-13T19:31:00Z");
  tick();
  await settle();
  assert.equal(calls, 2);
});

test("editor: automatic mode stays automatic when another option changes", () => {
  const wc = load();
  const handlers = [];
  const realCreate = wc.document.createElement;
  wc.document.createElement = (t) => {
    const el = realCreate(t);
    if (t === "ha-form") el.addEventListener = (_type, fn) => handlers.push(fn);
    return el;
  };
  const ed = new wc.WasteCardEditor();
  ed.setConfig({ type: "custom:waste-card" });
  ed.hass = makeHass();
  wc.document.createElement = realCreate;
  const form = ed.children[0];
  assert.deepEqual([...form.data.entities], ["calendar.waste_collection", "sensor.waste_collection"]);
  let out;
  ed.dispatchEvent = (ev) => (out = ev.detail.config);
  handlers[0]({ stopPropagation() {}, detail: { value: { ...form.data, show_bins: false } } });
  assert.deepEqual(JSON.parse(JSON.stringify(out)), { type: "custom:waste-card", show_bins: false });
  handlers[0]({ stopPropagation() {}, detail: { value: { ...form.data, entities: ["sensor.waste_collection"] } } });
  assert.deepEqual(JSON.parse(JSON.stringify(out.entities)), ["sensor.waste_collection"]);
});

test("calendars: calendar.get_events over the WebSocket when the REST API is not there", async () => {
  const ws = [];
  const callWS = async (msg) => {
    ws.push(msg);
    return { response: { "calendar.waste_collection": { events: [{ summary: "Glass", start: "2026-11-14" }] } } };
  };
  const { html } = newCard({ entities: ["calendar.waste_collection"] }, { hass: makeHass(states, { callWS }) });
  await settle();
  assert.equal(ws[0].service, "get_events");
  assert.equal(ws[0].return_response, true);
  assert.match(html(), /<span>Glass<\/span>/);
  assert.match(html(), /Put out tonight/);
});

test("the full card is translated, dates and countdown included", () => {
  const { html } = newCard({ language: "fr" });
  assert.match(html(), /Collecte des déchets/);
  assert.match(html(), /À sortir ce soir/);
  assert.match(html(), /<div class="when">Demain<\/div>/);
  assert.match(html(), /Samedi 14 novembre/);
});

test("editors: labels, schema, defaults left out of the YAML, entity settings kept", () => {
  const wc = load();
  // ha-form stand-in that keeps its value-changed listener.
  const handlers = [];
  const realCreate = wc.document.createElement;
  wc.document.createElement = (t) => {
    const el = realCreate(t);
    if (t === "ha-form") el.addEventListener = (_type, fn) => handlers.push(fn);
    return el;
  };
  const ed = new wc.WasteCardEditor();
  ed.setConfig({ entities: [{ entity: "sensor.waste_collection", name: "Bins" }, "sensor.bulky_waste"] });
  ed.hass = makeHass();
  const form = ed.children[0];
  assert.deepEqual([...form.data.entities], SENSORS);
  assert.equal(form.computeLabel({ name: "title" }), "Title (optional)");
  const names = JSON.stringify(form.schema);
  for (const n of ["entities", "type_names", "tonight_from", "max_items", "days", "collapsed", "show_bins", "show_upcoming", "language"]) assert.match(names, new RegExp(`"${n}"`));
  let out;
  ed.dispatchEvent = (ev) => (out = ev.detail.config);
  handlers[0]({ stopPropagation() {}, detail: { value: { ...form.data, entities: SENSORS, show_bins: true, tonight_from: 0, title: "" } } });
  assert.deepEqual(JSON.parse(JSON.stringify(out)), { entities: [{ entity: "sensor.waste_collection", name: "Bins" }, "sensor.bulky_waste"] });
  const mini = new wc.WasteMiniCardEditor();
  mini.setConfig({});
  mini.hass = makeHass();
  wc.document.createElement = realCreate;
  assert.match(JSON.stringify(mini.children[0].schema), /"zoom"/);
  assert.equal(mini.children[0].computeHelper({ name: "zoom" }), "Switches the mini card to the full card and back");
});

test("every clickable element can be reached and used from the keyboard", () => {
  const { html } = newCard();
  const tags = html().match(/<[a-z-]+\b[^>]*\bdata-(?:entity|action)="[^"]*"[^>]*>/g) || [];
  assert.ok(tags.length > 10);
  for (const tag of tags) {
    if (tag.startsWith("<button")) continue;
    assert.match(tag, /\brole="button"/, tag);
    assert.match(tag, /\btabindex="0"/, tag);
  }
});

test("animations honour prefers-reduced-motion", () => {
  const { html } = newCard();
  assert.match(html(), /@media \(prefers-reduced-motion: reduce\) \{ \.scene \* \{ animation: none !important; \} \}/);
  for (const k of ["wc-roll", "wc-spin", "wc-twinkle", "wc-lid", "wc-ring"]) assert.match(html(), new RegExp(`@keyframes ${k} `));
});
