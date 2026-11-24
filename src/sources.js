// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------
import { ICONS, cap, categoryByKey, categoryOf, esc, fold } from "./core.js";
import { addDays, parseDay } from "./days.js";

// Attributes that are never a collection (Home Assistant's own and Waste Collection Schedule's generic ones).
export const SKIP_ATTRS = new Set([
  "friendly_name",
  "icon",
  "entity_picture",
  "attribution",
  "unit_of_measurement",
  "device_class",
  "state_class",
  "daysTo",
  "types",
  "upcoming",
  "last_update",
  "last_reset",
  "restored",
  "supported_features",
]);
// Waste Collection Schedule joins the types of one day with its separator (", " by default).
export const splitTypes = (s) =>
  String(s ?? "")
    .split(/\s*[,;|]\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
export const DAY_UNITS = /^(d|day|days|jour|jours|tag|tage|dia|dias|giorni|dagen|dage|dagar|dni|dní|dana|zile|nap|dienas|ημέρες|дн|дни|дней|днів|дана)$/i;

/**
 * Collections of a sensor, as [{ day, raw }]:
 * - Waste Collection Schedule, details_format `upcoming` ({ "2026-11-14": "Recycling, Glass" }), `appointment_types`
 *   ({ "Recycling": "2026-11-14" }) or `generic` ({ upcoming: [{ date, type }] });
 * - otherwise (details_format `hidden`, a template or another integration) its state: Waste Collection Schedule's
 *   "Recycling, Glass in 1 days", a number of days (`daysTo`, or a unit of days), or a date / timestamp.
 * A number of days counts from the day the state was written (`last_updated`), not from today: between midnight and
 * the sensor's next update, "in 1 days" still means the day it meant when it was written.
 * Attributes whose value is a date (`appointment_types`) are read only from Waste Collection Schedule (`wcs`) or when
 * the state is not a date, so that a date sensor of another integration is not read from its other attributes.
 */
export const sensorCollections = (s, today, { tz, wcs = false } = {}) => {
  if (!s || ["unknown", "unavailable", ""].includes(s.state)) return [];
  const a = s.attributes || {};
  const out = [];
  if (Array.isArray(a.upcoming)) {
    for (const c of a.upcoming) {
      const day = parseDay(c?.date, tz);
      if (day) for (const raw of c.types || [c.type]) if (raw) out.push({ day, raw: String(raw) });
    }
    if (out.length) return out;
  }
  const stateDay = parseDay(s.state, tz);
  const byValue = wcs || !stateDay;
  for (const [k, v] of Object.entries(a)) {
    if (SKIP_ATTRS.has(k) || typeof v !== "string") continue;
    const day = parseDay(k);
    if (day) for (const raw of splitTypes(v)) out.push({ day, raw });
    else if (byValue && parseDay(v, tz)) out.push({ day: parseDay(v, tz), raw: k });
  }
  if (out.length) return out;
  const name = a.friendly_name || s.entity_id;
  const written = s.last_updated ? parseDay(new Date(s.last_updated), tz) : null;
  const from = written && written < today ? written : today;
  const text = String(s.state).match(/^(.*\S)\s+in\s+(\d+)\s+days?$/i);
  if (text) return splitTypes(text[1]).map((raw) => ({ day: addDays(from, Number(text[2])), raw }));
  const n = Number(s.state);
  if (Number.isFinite(a.daysTo) && !stateDay) {
    const types = Number.isFinite(n) ? [name] : splitTypes(s.state);
    return types.map((raw) => ({ day: addDays(from, a.daysTo), raw }));
  }
  if (s.state !== "" && Number.isInteger(n) && n >= 0 && DAY_UNITS.test(String(a.unit_of_measurement || "").trim())) return [{ day: addDays(from, n), raw: name }];
  return stateDay ? [{ day: stateDay, raw: name }] : [];
};

// The day an event starts: { date } or { dateTime } (REST API), or a string (calendar.get_events).
export const eventDay = (start, tz) => parseDay(start?.date ?? start?.dateTime ?? start, tz);
// The summary of an event is split into several types ("Paper, Glass"), except for the calendars of Waste Collection
// Schedule (`split` false), whose events carry one type each, and whose names may hold a comma ("Papier, Pappe").
export const calendarCollections = (events, { tz, split = true } = {}) =>
  (Array.isArray(events) ? events : []).flatMap((ev) => {
    const day = eventDay(ev?.start, tz);
    if (!day || !ev.summary) return [];
    return (split ? splitTypes(ev.summary) : [String(ev.summary).trim()]).map((raw) => ({ day, raw }));
  });

// A calendar's next event from its state, until its events have been fetched.
export const calendarStateCollections = (s, { split = true } = {}) => {
  const a = s?.attributes || {};
  const day = parseDay(a.start_time);
  if (!day || !a.message || s.state === "unavailable") return [];
  return (split ? splitTypes(a.message) : [String(a.message).trim()]).map((raw) => ({ day, raw }));
};

// Entities of the card: the `entities` option ("sensor.x" or { entity, name, type, icon, color }), else every
// sensor and calendar of Waste Collection Schedule.
export const entityConfs = (hass, config) => {
  const list = Array.isArray(config.entities) ? config.entities : config.entity ? [config.entity] : null;
  if (list) return list.map((e) => (typeof e === "string" ? { entity: e } : { ...e })).filter((e) => typeof e.entity === "string" && e.entity);
  return autoEntities(hass).map((entity) => ({ entity }));
};
// Read on every state change: computed once per entity registry (Home Assistant replaces the object when it changes).
export const AUTO = new WeakMap();
export const autoEntities = (hass) => {
  const reg = hass?.entities;
  if (!reg) return [];
  if (!AUTO.has(reg))
    AUTO.set(
      reg,
      Object.values(reg)
        .filter((e) => e.platform === "waste_collection_schedule" && !e.hidden && /^(sensor|calendar)\./.test(e.entity_id))
        .map((e) => e.entity_id)
        .sort(),
    );
  // Shared, read-only: callers map it or copy it, so no copy at each state change.
  return AUTO.get(reg);
};
// Names of a waste collection entity in the card's languages (entity id or friendly name).
export const WASTE_WORDS =
  /waste|trash|garbage|rubbish|refuse|recycl|\bbins?\b|poubelle|d[ée]chet|ordure|collecte|m[üu]ll|abfall|afval|vuilnis|basura|residuo|rifiut|spazzatur|odpad|smieci|śmieci|gunoi|affald|skrald|sopor|avfall|hullad|kuka|atkritum|отпад|отпадък|мусор|отход|сміт|відход|σκουπ|απορ/i;
export const stubFallback = (hass) => {
  const states = Object.values(hass?.states || {});
  const looks = (s) => WASTE_WORDS.test(`${s.entity_id} ${s.attributes?.friendly_name || ""}`);
  const calendars = states.filter((s) => s.entity_id.startsWith("calendar."));
  const dates = states.filter((s) => s.entity_id.startsWith("sensor.") && ["date", "timestamp"].includes(s.attributes?.device_class));
  const pick = calendars.find(looks) || dates.find(looks) || calendars[0];
  return pick ? pick.entity_id : null;
};
export const isWcs = (hass, id) => hass?.entities?.[id]?.platform === "waste_collection_schedule";

// A CSS color given in the configuration, kept only when it cannot break out of the style attribute.
export const safeColor = (c) => (typeof c === "string" && /^[#\w\s(),.%-]+$/.test(c) ? c : null);

// Icon: one of ICONS (inline SVG), else Home Assistant's <ha-icon>.
export const iconName = (icon) => String(icon || "").replace(/^mdi:/, "");
export const svgIcon = (icon, cls = "") => {
  const name = iconName(icon);
  if (ICONS[name]) return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
  return `<ha-icon class="icon ${cls}" icon="${esc(String(icon).includes(":") ? icon : `mdi:${icon}`)}"></ha-icon>`;
};

// Type of a collection: { id, name, icon, color, category }. A `types` entry whose `match` (text or /regex/,
// case and accents ignored) fits the raw name wins, then the entity's own settings, then the category.
export const matches = (raw, match) =>
  (Array.isArray(match) ? match : [match]).some((m) => {
    if (typeof m !== "string" || !m) return false;
    const re = m.match(/^\/(.+)\/([a-z]*)$/);
    if (re) {
      // Case ignored; the accents too, by testing the folded name as well (the pattern itself is left as written:
      // lower-casing it would turn \D into \d). A g or y flag would make test() stateful: dropped.
      try {
        const rx = new RegExp(re[1], re[2].includes("i") ? re[2].replace(/[gy]/g, "") : `${re[2].replace(/[gy]/g, "")}i`);
        return rx.test(raw) || rx.test(fold(raw));
      } catch {
        return false;
      }
    }
    return fold(raw).includes(fold(m));
  });

export const typeOf = (raw, conf, config, tr) => {
  const rule = (Array.isArray(config.types) ? config.types : []).find((r) => r && matches(raw, r.match ?? r.name));
  const cat = categoryByKey(rule?.category) || categoryByKey(conf.type) || categoryOf(raw);
  const name = rule?.name || conf.name || (config.type_names === "category" ? tr(`cat_${cat.key}`) : cap(raw) || tr(`cat_${cat.key}`));
  return {
    id: fold(name),
    name,
    category: cat.key,
    icon: rule?.icon || conf.icon || cat.icon,
    color: safeColor(rule?.color) || safeColor(conf.color) || safeColor(config.colors?.[cat.key]) || cat.color,
  };
};
