// Evaluates src/waste-card.js (a classic script, bundled as is by scripts/build.mjs) in a sandbox with minimal DOM
// stand-ins and a clock stopped at `now` (UTC), and returns the names the tests need. No dependency, no browser.
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { NOW } from "../scripts/mock-states.mjs";

process.env.TZ = "UTC";
const source = readFileSync(new URL("../src/waste-card.js", import.meta.url), "utf8");

// Shadow root stand-in: keeps the HTML it is given and the listeners it gets.
const fakeRoot = () => ({
  innerHTML: "",
  listeners: {},
  addEventListener(type, fn) {
    this.listeners[type] = fn;
  },
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
});

// A Date class whose current time is `now` (an ISO string, changeable with setNow).
const clock = (now) => {
  const Real = Date;
  const state = { now: Real.parse(now) };
  class FakeDate extends Real {
    constructor(...args) {
      super(...(args.length ? args : [state.now]));
    }
    static now() {
      return state.now;
    }
  }
  return { FakeDate, setNow: (iso) => (state.now = Real.parse(iso)) };
};

export const load = (now = NOW) => {
  const registry = new Map();
  class HTMLElement {
    attachShadow() {
      this.shadowRoot = fakeRoot();
      return this.shadowRoot;
    }
    dispatchEvent(ev) {
      (this.events ||= []).push(ev);
    }
    appendChild(child) {
      (this.children ||= []).push(child);
    }
    toggleAttribute(name, on) {
      (this.attrs ||= {})[name] = !!on;
    }
  }
  class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }
  const { FakeDate, setNow } = clock(now);
  const docListeners = {};
  const sandbox = {
    HTMLElement,
    CustomEvent,
    Intl,
    Date: FakeDate,
    console: { info() {}, warn() {} },
    customElements: { get: (t) => registry.get(t), define: (t, c) => registry.set(t, c) },
    document: {
      createElement: (t) => (registry.has(t) ? new (registry.get(t))() : { tagName: t.toUpperCase(), addEventListener() {} }),
      addEventListener: (type, fn) => (docListeners[type] ||= new Set()).add(fn),
      removeEventListener: (type, fn) => docListeners[type]?.delete(fn),
    },
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    clearInterval() {},
  };
  sandbox.window = sandbox;
  sandbox.fireDocument = (type, ev) => {
    for (const fn of [...(docListeners[type] || [])]) fn(ev);
  };
  sandbox.setNow = setNow;
  vm.createContext(sandbox);
  return vm.runInContext(
    `${source}
    ({ parseDay, dayKey, zoneOf, daysBetween, addDays, countdown, fmtDay, sensorCollections, calendarCollections, calendarStateCollections,
       categoryOf, typeOf, entityConfs, autoEntities, safeColor, svgIcon, sceneSvg, STRINGS, ICONS, LANGUAGES,
       WasteCard: customElements.get("waste-card"), WasteMiniCard: customElements.get("waste-mini-card"),
       WasteCardEditor: customElements.get("waste-card-editor"), WasteMiniCardEditor: customElements.get("waste-mini-card-editor"),
       window, document, setNow, fireDocument })`,
    sandbox,
  );
};
