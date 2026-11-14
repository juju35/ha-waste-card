// Reading the sources: days, Waste Collection Schedule sensors, calendars, date sensors and the waste categories.
import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarEvents, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const wc = load();
const plain = (v) => JSON.parse(JSON.stringify(v));
const TODAY = "2026-11-13";

test("days are read in every format the sources give", () => {
  assert.equal(wc.parseDay("2026-11-14"), "2026-11-14");
  assert.equal(wc.parseDay("2026-11-14 00:00:00"), "2026-11-14");
  assert.equal(wc.parseDay("2026-11-14T06:00:00"), "2026-11-14");
  // With a time zone: the local day (the tests run in UTC).
  assert.equal(wc.parseDay("2026-11-14T00:30:00+02:00"), "2026-11-13");
  assert.equal(wc.parseDay("2026-11-14T23:30:00Z"), "2026-11-14");
  assert.equal(wc.parseDay("14.11.2026"), "2026-11-14");
  assert.equal(wc.parseDay("4/1/2027"), "2027-01-04");
  for (const bad of ["", "tomorrow", "2026-02-30", "31.04.2026", null, undefined, "Recycling in 2 days"]) assert.equal(wc.parseDay(bad), null, String(bad));
  assert.equal(wc.daysBetween(TODAY, "2026-11-14"), 1);
  assert.equal(wc.daysBetween("2026-03-28", "2026-03-30"), 2);
  assert.equal(wc.addDays("2026-12-30", 3), "2027-01-02");
});

test("the countdown is worded by Intl in the card's language", () => {
  assert.equal(wc.countdown(0, "en"), "Today");
  assert.equal(wc.countdown(1, "en"), "Tomorrow");
  assert.equal(wc.countdown(5, "en"), "In 5 days");
  assert.equal(wc.countdown(1, "fr"), "Demain");
  assert.equal(wc.countdown(2, "de"), "Übermorgen");
  assert.equal(wc.fmtDay("2026-11-14", "en"), "Sat, Nov 14");
});

test("Waste Collection Schedule: details_format upcoming", () => {
  assert.deepEqual(plain(wc.sensorCollections(states["sensor.waste_collection"], TODAY)).slice(0, 3), [
    { day: "2026-11-14", raw: "Recycling" },
    { day: "2026-11-14", raw: "Glass" },
    { day: "2026-11-17", raw: "General waste" },
  ]);
});

test("Waste Collection Schedule: details_format appointment_types, with a type not scheduled", () => {
  const s = { state: "Paper in 3 days", attributes: { Paper: "2026-11-16", Glass: "", "Bio waste": "19.11.2026", friendly_name: "Bins" } };
  assert.deepEqual(plain(wc.sensorCollections(s, TODAY)), [
    { day: "2026-11-16", raw: "Paper" },
    { day: "2026-11-19", raw: "Bio waste" },
  ]);
});

test("Waste Collection Schedule: details_format generic", () => {
  const s = {
    state: "x",
    attributes: { types: ["Paper", "Glass"], upcoming: [{ date: "2026-11-15", type: "Paper" }, { date: "2026-11-20", types: ["Glass", "Paper"] }], last_update: "2026-11-13T06:00:00", daysTo: 2 },
  };
  assert.deepEqual(plain(wc.sensorCollections(s, TODAY)), [
    { day: "2026-11-15", raw: "Paper" },
    { day: "2026-11-20", raw: "Glass" },
    { day: "2026-11-20", raw: "Paper" },
  ]);
});

test("Waste Collection Schedule: details_format hidden reads the state (default text, types template with daysTo)", () => {
  assert.deepEqual(plain(wc.sensorCollections({ state: "Paper, Glass in 2 days", attributes: {} }, TODAY)), [
    { day: "2026-11-15", raw: "Paper" },
    { day: "2026-11-15", raw: "Glass" },
  ]);
  assert.deepEqual(plain(wc.sensorCollections({ state: "Organic", attributes: { daysTo: 0 } }, TODAY)), [{ day: TODAY, raw: "Organic" }]);
  assert.deepEqual(plain(wc.sensorCollections({ state: "4", attributes: { daysTo: 4, friendly_name: "Glass" } }, TODAY)), [{ day: "2026-11-17", raw: "Glass" }]);
});

test("date sensors: a date, a timestamp or a number of days", () => {
  assert.deepEqual(plain(wc.sensorCollections(states["sensor.bulky_waste"], TODAY)), [{ day: "2026-12-08", raw: "Bulky waste" }]);
  assert.deepEqual(plain(wc.sensorCollections({ state: "2026-11-15T05:00:00+00:00", attributes: { device_class: "timestamp", friendly_name: "Paper" } }, TODAY)), [
    { day: "2026-11-15", raw: "Paper" },
  ]);
  assert.deepEqual(plain(wc.sensorCollections({ state: "3", attributes: { unit_of_measurement: "days", friendly_name: "Glass" } }, TODAY)), [{ day: "2026-11-16", raw: "Glass" }]);
  // A number without a unit of days is not a countdown.
  assert.deepEqual(plain(wc.sensorCollections({ state: "3", attributes: { unit_of_measurement: "kg" } }, TODAY)), []);
  for (const state of ["unavailable", "unknown"]) assert.deepEqual(plain(wc.sensorCollections({ state, attributes: { "2026-11-14": "Paper" } }, TODAY)), []);
});

test("calendars: REST events, calendar.get_events events and the calendar state", () => {
  const rest = wc.calendarCollections(calendarEvents["calendar.waste_collection"]);
  assert.deepEqual(plain(rest[0]), { day: "2026-11-16", raw: "Household waste" });
  assert.equal(rest.filter((c) => c.day === "2026-12-04").length, 2);
  assert.deepEqual(plain(wc.calendarCollections([{ summary: "Paper", start: "2026-11-15T06:00:00+00:00" }, { summary: "Glass", start: "2026-11-16" }, { start: "2026-11-17" }])), [
    { day: "2026-11-15", raw: "Paper" },
    { day: "2026-11-16", raw: "Glass" },
  ]);
  assert.deepEqual(plain(wc.calendarStateCollections(states["calendar.waste_collection"])), [{ day: "2026-11-16", raw: "Household waste" }]);
});

test("collection types are matched to a waste category in many languages", () => {
  const cases = {
    garbage: ["General waste", "Restmüll", "Ordures ménagères", "Restafval", "Non-recyclable waste", "Black bin", "Indifferenziato"],
    recycling: ["Recycling", "Gelber Sack", "Emballages", "PMD", "Packaging", "Collecte sélective"],
    paper: ["Paper", "Papier", "Altpapier", "Cardboard", "Carta"],
    glass: ["Glass", "Verre", "Altglas", "Vidrio"],
    organic: ["Organic waste", "Biomüll", "Biodéchets", "GFT", "Food waste", "Umido"],
    garden: ["Garden waste", "Déchets verts", "Grünschnitt", "Christmas trees", "Tuinafval"],
    bulky: ["Bulky waste", "Encombrants", "Sperrmüll", "Grofvuil"],
    hazardous: ["Hazardous waste", "Schadstoffmobil", "Déchets dangereux"],
    textile: ["Textiles", "Altkleider"],
    electronics: ["Electronics", "Elektroschrott", "DEEE"],
    other: ["Something else", "Street sweeping"],
  };
  for (const [key, names] of Object.entries(cases)) for (const n of names) assert.equal(wc.categoryOf(n).key, key, n);
});

test("categories: packaging with paper or cartons, glass packaging, letters without decomposition, Cyrillic and Greek", () => {
  const cases = {
    recycling: ["Emballages et papiers", "Plastic, metaal en drankkartons", "Leichtverpackungen", "Szelektív", "Вторсырьё", "Ανακύκλωση"],
    glass: ["Emballages en verre", "Szkło", "Sticlă", "Стекло", "Скло", "Γυαλί"],
    paper: ["Hârtie", "Бумага", "Χαρτί", "Tidningar"],
    garbage: ["Deșeuri menajere", "Zmesový odpad", "Смешанные отходы", "Комунални отпад", "Σύμμεικτα"],
    organic: ["Биоотходы", "Βιοαπόβλητα"],
    garden: ["Gartenabfälle", "Zöldhulladék", "Садовые отходы", "Κλαδέματα"],
    bulky: ["Bulk pickup", "Крупногабаритные", "Ογκώδη"],
    hazardous: ["Farligt affald", "Resíduos perigosos", "Опасные отходы", "Επικίνδυνα"],
    textile: ["Textiel", "Tekstylia", "Ρούχα"],
    electronics: ["Электроника", "Ηλεκτρονικά"],
  };
  for (const [key, names] of Object.entries(cases)) for (const n of names) assert.equal(wc.categoryOf(n).key, key, n);
  // Every translated category name is recognized as its own category (type_names: category round trip).
  for (const [l, table] of Object.entries(wc.STRINGS))
    for (const key of ["garbage", "recycling", "paper", "glass", "organic", "garden", "bulky", "hazardous", "textile", "electronics"])
      assert.equal(wc.categoryOf(table[`cat_${key}`]).key, key, `${l} ${table[`cat_${key}`]}`);
});

test("a number of days counts from the day the state was written", () => {
  // Written yesterday evening: "in 1 days" is today, until the sensor's next update.
  const s = { state: "Paper in 1 days", last_updated: "2026-11-12T22:00:00Z", attributes: {} };
  assert.deepEqual(plain(wc.sensorCollections(s, TODAY)), [{ day: TODAY, raw: "Paper" }]);
  assert.deepEqual(plain(wc.sensorCollections({ ...s, last_updated: "2026-11-13T00:00:05Z" }, TODAY)), [{ day: "2026-11-14", raw: "Paper" }]);
  const days = { state: "2", last_updated: "2026-11-11T00:00:00Z", attributes: { unit_of_measurement: "d", friendly_name: "Glass" } };
  assert.deepEqual(plain(wc.sensorCollections(days, TODAY)), [{ day: TODAY, raw: "Glass" }]);
});

test("a date sensor of another integration is read from its state, not from its date attributes", () => {
  const s = { state: "2026-11-20", attributes: { friendly_name: "Paper", previous: "2026-11-06" } };
  assert.deepEqual(plain(wc.sensorCollections(s, TODAY)), [{ day: "2026-11-20", raw: "Paper" }]);
  // Waste Collection Schedule (appointment_types) with a value_template giving a date: its attributes.
  const w = { state: "2026-11-16", attributes: { Paper: "2026-11-16", Glass: "2026-11-20" } };
  assert.deepEqual(plain(wc.sensorCollections(w, TODAY, { wcs: true })), [
    { day: "2026-11-16", raw: "Paper" },
    { day: "2026-11-20", raw: "Glass" },
  ]);
});

test("Waste Collection Schedule calendars: one type per event, a comma kept in its name", () => {
  const ev = [{ summary: "Papier, Pappe, Kartonagen", start: { date: "2026-11-16" } }];
  assert.deepEqual(plain(wc.calendarCollections(ev, { split: false })), [{ day: "2026-11-16", raw: "Papier, Pappe, Kartonagen" }]);
  assert.equal(wc.calendarCollections(ev).length, 3);
});

test("days in Home Assistant's time zone when the profile asks for the server's", () => {
  assert.equal(wc.zoneOf({ locale: { time_zone: "server" }, config: { time_zone: "Pacific/Auckland" } }), "Pacific/Auckland");
  assert.equal(wc.zoneOf({ locale: { time_zone: "local" }, config: { time_zone: "Pacific/Auckland" } }), undefined);
  // 18:30 UTC is already the next morning in Auckland.
  assert.equal(wc.dayKey(new Date("2026-11-13T18:30:00Z"), "Pacific/Auckland"), "2026-11-14");
  assert.equal(wc.parseDay("2026-11-13T18:30:00+00:00", "Pacific/Auckland"), "2026-11-14");
  assert.equal(wc.dayKey(new Date("2026-11-13T18:30:00Z"), "Not/AZone"), "2026-11-13");
});

test("rule regexes keep their escapes and ignore accents", () => {
  const tr = (k) => k;
  const config = { types: [{ match: "/^\\D+ 2$/", name: "Second round" }, { match: "/dechets verts/g", name: "Green" }] };
  assert.equal(wc.typeOf("Paper 2", {}, config, tr).name, "Second round");
  assert.equal(wc.typeOf("Paper 22", {}, config, tr).name, "Paper 22");
  for (let i = 0; i < 2; i++) assert.equal(wc.typeOf("Déchets verts", {}, config, tr).name, "Green");
});

test("types: rules by text or regex, entity settings, category names, colors kept safe", () => {
  const tr = (k) => `T:${k}`;
  const config = { types: [{ match: "gelb", name: "Yellow bin", color: "#fdd835" }, { match: "/^bio/", icon: "mdi:leaf", color: "red;}" }] };
  const yellow = wc.typeOf("Gelber Sack", {}, config, tr);
  assert.deepEqual([yellow.name, yellow.category, yellow.color, yellow.icon], ["Yellow bin", "recycling", "#fdd835", "recycle"]);
  const bio = wc.typeOf("Biomüll", {}, config, tr);
  assert.deepEqual([bio.name, bio.icon, bio.color], ["Biomüll", "mdi:leaf", "#795548"]);
  assert.equal(wc.typeOf("Restmüll", {}, { type_names: "category" }, tr).name, "T:cat_garbage");
  const forced = wc.typeOf("Collection", { type: "glass", name: "Bottles" }, {}, tr);
  assert.deepEqual([forced.name, forced.category], ["Bottles", "glass"]);
  assert.equal(wc.safeColor("var(--my-color)"), "var(--my-color)");
  assert.equal(wc.safeColor('red" onload="x'), null);
});

test("icons: inline SVG when known, ha-icon otherwise", () => {
  assert.match(wc.svgIcon("mdi:recycle"), /^<svg class="icon "/);
  assert.match(wc.svgIcon("mdi:pine-tree"), /<ha-icon class="icon " icon="mdi:pine-tree">/);
  for (const c of ["garbage", "recycling", "paper", "glass", "organic", "garden", "bulky", "hazardous", "textile", "electronics", "other"]) assert.ok(wc.STRINGS.en[`cat_${c}`], c);
});

test("the picture draws up to three bins, animated by what is due", () => {
  const ty = (color) => ({ color, icon: "recycle", category: "recycling" });
  const svg = wc.sceneSvg([ty("#111"), ty("#222"), ty("#333"), ty("#444")], "tonight");
  assert.match(svg, /class="scene tonight"/);
  assert.equal((svg.match(/class="bin b/g) || []).length, 3);
  assert.doesNotMatch(svg, /#444/);
});

test("colors: a category color is overridden, but a type rule or an entity color still wins", () => {
  const tr = (k) => k;
  // The whole category is recoloured (the Québec case: different bin colors than the defaults).
  assert.equal(wc.typeOf("Restmüll", {}, { colors: { garbage: "#2e7d32" } }, tr).color, "#2e7d32");
  // A per-type rule and a per-entity color keep priority over the category override.
  assert.equal(wc.typeOf("Restmüll", {}, { colors: { garbage: "#2e7d32" }, types: [{ match: "Rest", color: "#111111" }] }, tr).color, "#111111");
  assert.equal(wc.typeOf("Restmüll", { color: "#222222" }, { colors: { garbage: "#2e7d32" } }, tr).color, "#222222");
  // An unsafe value is ignored and the default color stands.
  assert.equal(wc.typeOf("Restmüll", {}, { colors: { garbage: "red;}" } }, tr).color, "#616161");
});

test("bin_shape: each silhouette is drawn, unknown and default fall back to the wheelie", () => {
  const ty = { color: "#616161", icon: "trash-can", category: "garbage" };
  const cart = wc.sceneSvg([ty], "", "cart");
  assert.match(cart, /M6 12h27l5 5/); // the roll-out cart's hinged lid
  const can = wc.sceneSvg([ty], "", "can");
  assert.match(can, /M7 16v43/); // the cylindrical body
  assert.doesNotMatch(can, /class="wheel"/); // a can has no wheel
  assert.equal((wc.sceneSvg([ty], "", "flat").match(/class="wheel"/g) || []).length, 2); // the flat-lid bin has two
  for (const shape of [undefined, "bogus"]) assert.match(wc.sceneSvg([ty], "", shape), /M2 8\.5h40/); // the wheelie lid
});

test("every language has every text, and the editor lists them all", () => {
  const keys = Object.keys(wc.STRINGS.en).sort();
  for (const [l, table] of Object.entries(wc.STRINGS)) assert.deepEqual([...Object.keys(table)].sort(), [...keys], l);
  assert.deepEqual([...wc.LANGUAGES.map(([l]) => l)].sort(), [...Object.keys(wc.STRINGS)].sort());
  assert.equal(Object.keys(wc.STRINGS).length, 22);
});
