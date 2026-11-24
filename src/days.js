// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------
import { cap } from "./core.js";

export const pad = (n) => String(n).padStart(2, "0");
// Parts of a Date in a time zone (Home Assistant's own, when the user chose "server time zone"), else the browser's.
export const ZONE_FMT = {};
export const zoned = (d, tz) => {
  if (tz) {
    try {
      ZONE_FMT[tz] ??= new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", hourCycle: "h23" });
      const p = Object.fromEntries(ZONE_FMT[tz].formatToParts(d).map((x) => [x.type, Number(x.value)]));
      return { y: p.year, m: p.month, d: p.day, h: p.hour % 24 };
    } catch {
      /* unknown time zone: the browser's */
    }
  }
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: d.getHours() };
};
// Calendar day of a Date, as "YYYY-MM-DD", in the time zone `tz` (the browser's when not given).
export const dayKey = (d, tz) => {
  const z = zoned(d, tz);
  return `${z.y}-${pad(z.m)}-${pad(z.d)}`;
};
// The time zone the dates are shown in: Home Assistant's when its profile says "server", else the browser's.
export const zoneOf = (hass) => (hass?.locale?.time_zone === "server" && hass?.config?.time_zone) || undefined;
export const keyDate = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (key, n) => {
  const d = keyDate(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
};
// Whole days from `from` to `to` (both "YYYY-MM-DD"), daylight saving time aside.
export const daysBetween = (from, to) => {
  const [a, b] = [from, to].map((k) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86400000);
};
export const validKey = (y, m, d) => {
  const key = `${y}-${pad(m)}-${pad(d)}`;
  const dt = keyDate(key);
  return dt.getFullYear() === Number(y) && dt.getMonth() === m - 1 && dt.getDate() === Number(d) ? key : null;
};

// A day from what the sources give: "2026-11-14", "2026-11-14 00:00:00", "2026-11-14T06:00:00+01:00" (converted to
// the day in `tz` when it carries a time zone), "14.11.2026" or "14/11/2026" (day first). null otherwise.
export const parseDay = (v, tz) => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : dayKey(v, tz);
  const s = String(v ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::[\d.]+)?\s*(Z|[+-]\d{2}:?\d{2})?)?$/);
  if (m) {
    if (m[6]) {
      const d = new Date(s.replace(" ", "T"));
      return Number.isNaN(d.getTime()) ? null : dayKey(d, tz);
    }
    return validKey(m[1], Number(m[2]), Number(m[3]));
  }
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  return m ? validKey(m[3], Number(m[2]), Number(m[1])) : null;
};

export const RTF = {};
export const DTF = {};
// "today", "tomorrow", "in 3 days" in the card's language (Intl handles the plural forms and "the day after tomorrow").
export const countdown = (days, locale) => cap((RTF[locale] ??= new Intl.RelativeTimeFormat(locale, { numeric: "auto" })).format(days, "day"));
export const fmtDay = (key, locale, long = false) =>
  (DTF[`${locale}|${long}`] ??= new Intl.DateTimeFormat(locale, long ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" })).format(
    keyDate(key),
  );

// Countdown → state class (header icon, chip, tiles): today blue, tomorrow orange, later green, nothing grey.
export const dayClass = (days) => (days === null || days === undefined ? "idle" : days <= 0 ? "active" : days === 1 ? "warn" : "ok");
