// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { CATEGORIES, categoryByKey, lang, t } from "./core.js";
import { autoEntities, entityConfs, safeColor } from "./sources.js";
import { DEFAULT_DAYS, DEFAULT_ITEMS, sameDeps } from "./styles.js";

export const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["sr", "Српски"],
  ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["pt", "Português (Portugal)"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["bg", "Български"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["hu", "Magyar"],
  ["sk", "Slovenčina"],
  ["cs", "Čeština"],
  ["sl", "Slovenščina"],
  ["lv", "Latviešu"],
  ["el", "Ελληνικά"],
];

// Editor labels whose translation key differs from the option name (a waste category key → its `cat_…` label).
export const LABELS = { title: "title_opt", ...Object.fromEntries(CATEGORIES.map((c) => [c.key, `cat_${c.key}`])) };

// Categories offered in the editor's "Bin colors" section, and the conversions between a hex color (kept in the
// YAML) and the [r, g, b] the color picker uses.
export const COLOR_CATS = ["garbage", "recycling", "paper", "glass", "organic", "garden", "bulky", "hazardous", "textile", "electronics"];
export const hexToRgb = (v) => {
  const m = typeof v === "string" && v.match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgbToHex = (a) =>
  Array.isArray(a) && a.length === 3 ? `#${a.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("")}` : null;

export class WasteEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [
      ["show_title", true],
      ["show_subtitle", true],
      ["illustration", true],
    ];
  }

  static extraFields() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    return [
      { name: "entities", selector: { entity: { multiple: true, filter: [{ domain: "sensor" }, { domain: "calendar" }] } } },
      { name: "title", selector: { text: {} } },
      {
        name: "type_names",
        selector: { select: { mode: "dropdown", options: ["source", "category"].map((v) => ({ value: v, label: tr(`type_names_${v}`) })) } },
      },
      {
        name: "bin_shape",
        selector: { select: { mode: "dropdown", options: ["wheelie", "flat", "can", "cart"].map((v) => ({ value: v, label: tr(`bin_shape_${v}`) })) } },
      },
      { name: "tonight_from", selector: { number: { min: 0, max: 23, mode: "box", unit_of_measurement: "h" } } },
      {
        name: "illustration_theme",
        selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } },
      },
      ...this.constructor.extraFields(tr),
      { type: "expandable", name: "colors", title: tr("colors"), schema: COLOR_CATS.map((k) => ({ name: k, selector: { color_rgb: {} } })) },
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } } },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    const toggles = this.constructor.toggles;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, LABELS[s.name] || s.name);
      this._form.computeHelper = (s) => (s.name === "zoom" ? t(this._hass, this._config, "zoom_helper") : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        // An entity set in YAML with its own settings ({ entity, name, color… }) keeps them while it stays selected.
        if (Array.isArray(config.entities)) {
          const own = new Map((Array.isArray(this._config.entities) ? this._config.entities : []).filter((e) => e && typeof e === "object").map((e) => [e.entity, e]));
          config.entities = config.entities.map((id) => own.get(id) || id);
          // Automatic mode (no `entities`, the Waste Collection Schedule entities) stays automatic while the list
          // shown is left as it is.
          const auto = !this._config.entities && !this._config.entity;
          if (auto && JSON.stringify(config.entities) === JSON.stringify(autoEntities(this._hass))) delete config.entities;
        }
        // Bin colors: the picker gives [r, g, b]; keep them as hex, and only those that differ from the category default.
        if (config.colors && typeof config.colors === "object") {
          const colors = {};
          for (const [k, v] of Object.entries(config.colors)) {
            const hex = Array.isArray(v) ? rgbToHex(v) : safeColor(v);
            if (hex && hex.toLowerCase() !== String(categoryByKey(k)?.color || "").toLowerCase()) colors[k] = hex;
          }
          config.colors = colors;
        }
        const defaults = { ...Object.fromEntries(toggles), type_names: "source", bin_shape: "wheelie", illustration_theme: "auto", tonight_from: 0, days: DEFAULT_DAYS, max_items: DEFAULT_ITEMS, collapsed: [], colors: {} };
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          if (v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length && k === "entities") || (k in defaults && JSON.stringify(v) === JSON.stringify(defaults[k])))
            delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { type_names: "source", bin_shape: "wheelie", illustration_theme: "auto", tonight_from: 0, days: DEFAULT_DAYS, max_items: DEFAULT_ITEMS, collapsed: [], ...this._config };
    data.entities = entityConfs(this._hass, this._config).map((e) => e.entity);
    for (const [name, def] of toggles) if (data[name] === undefined) data[name] = def;
    // The color picker needs [r, g, b]; feed it the hex colors kept in the config (others stay unset = category default).
    data.colors = Object.fromEntries(Object.entries(this._config.colors || {}).map(([k, v]) => [k, hexToRgb(v) || v]));
    this._form.hass = this._hass;
    const h = this._hass;
    const dataDeps = [this._config, h.entities];
    if (!sameDeps(this._dataDeps, dataDeps)) {
      this._dataDeps = dataDeps;
      this._form.data = data;
    }
    const schemaDeps = [lang(h, this._config)];
    if (!sameDeps(this._schemaDeps, schemaDeps)) {
      this._schemaDeps = schemaDeps;
      this._form.schema = this._schema();
    }
  }
}

export class WasteCardEditor extends WasteEditorBase {
  static get toggles() {
    return [...WasteEditorBase.toggles, ["show_bins", true], ["show_upcoming", true]];
  }

  static extraFields(tr) {
    return [
      { name: "max_items", selector: { number: { min: 1, max: 30, mode: "box" } } },
      { name: "days", selector: { number: { min: 1, max: 400, mode: "box", unit_of_measurement: "d" } } },
      {
        name: "collapsed",
        selector: {
          select: {
            multiple: true,
            mode: "list",
            options: [
              ["bins", "bins"],
              ["upcoming", "upcoming"],
            ].map(([value, label]) => ({ value, label: tr(label) })),
          },
        },
      },
    ];
  }
}

// The detailed view of the mini card is the full card: its editor offers the full card's options too.
export class WasteMiniCardEditor extends WasteCardEditor {
  static get toggles() {
    return [...WasteCardEditor.toggles, ["zoom", true]];
  }
}
