// The illustrated header in Chromium (skipped without it): the status pill shows its whole label from 245 to 500 px
// (right after the title, else on its own line under the subtitle), never more than about half of the title row,
// next to a readable title; the mini card's expand / collapse button is a 24 px round button 5 px from the top
// right corner of the banner.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { entities, NOW, states } from "../scripts/mock-states.mjs";

const source = readFileSync(new URL("../src/waste-card.js", import.meta.url), "utf8");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {}
const browser = await chromium?.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}).catch(() => null);

const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;border:1px solid #ddd;overflow:hidden}</style><slot></slot>"; } });`;

test("status pill shows its whole label next to a readable title; the zoom button sits at the top right", { skip: !browser && "no Chromium" }, async () => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  try {
    await page.clock.setFixedTime(new Date(NOW));
    await page.setContent('<!doctype html><body style="margin:0;font-family:Arial,sans-serif"></body>');
    await page.addScriptTag({ content: HA_CARD });
    await page.addScriptTag({ content: source });
    const failures = await page.evaluate(
      async ({ states, entities }) => {
        const frames = (n) => new Promise((r) => {
          const step = () => (n-- > 0 ? requestAnimationFrame(step) : r());
          step();
        });
        const hass = { states, entities, language: "en", locale: { language: "en" }, themes: {}, callApi: async () => [] };
        const out = [];
        for (const width of [245, 300, 400, 500]) {
          for (const [type, zoom] of [["waste-card", false], ["waste-mini-card", false], ["waste-mini-card", true]]) {
            for (const title of [undefined, "A very long title for the waste collection of the street"]) {
              document.body.innerHTML = "";
              const box = document.body.appendChild(document.createElement("div"));
              box.style.width = `${width}px`;
              const card = box.appendChild(document.createElement(type));
              card.setConfig({ type: `custom:${type}`, entities: ["sensor.waste_collection", "sensor.bulky_waste"], ...(title ? { title } : {}) });
              card.hass = hass;
              await frames(2);
              const r = card.shadowRoot;
              if (zoom) r.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
              await frames(4);
              const tag = `${type}${zoom ? " zoomed" : ""} ${width}px${title ? " long title" : ""}`;
              const chip = r.querySelector(".banner .chip");
              if (!chip) {
                out.push(`${tag}: no pill`);
                continue;
              }
              const text = chip.querySelector(".chip-text");
              if (text.scrollWidth > text.clientWidth + 0.5 || text.clientWidth === 0) out.push(`${tag}: label cut`);
              const nb = r.querySelector(".banner .name").getBoundingClientRect();
              if (nb.width < 24) out.push(`${tag}: title ${Math.round(nb.width)}px`);
              const cb = chip.getBoundingClientRect();
              const onRow = Math.abs(cb.top + cb.height / 2 - (nb.top + nb.height / 2)) < 3;
              const row = r.querySelector(".trow").getBoundingClientRect();
              if (onRow && cb.width > row.width * 0.51 + 0.5) out.push(`${tag}: pill ${Math.round(cb.width)} of ${Math.round(row.width)}px`);
              const banner = r.querySelector(".banner").getBoundingClientRect();
              if (cb.right > banner.right - 4 || cb.bottom > banner.bottom - 10) out.push(`${tag}: pill out of the banner`);
              if (type === "waste-mini-card") {
                const zb = r.querySelector(".banner .zoom")?.getBoundingClientRect();
                if (!zb) out.push(`${tag}: no zoom button`);
                else if (Math.round(zb.width) !== 24 || Math.round(zb.height) !== 24 || Math.round(zb.top - banner.top) !== 5 || Math.round(banner.right - zb.right) !== 5)
                  out.push(`${tag}: zoom button ${Math.round(zb.width)}x${Math.round(zb.height)} at ${Math.round(zb.top - banner.top)}/${Math.round(banner.right - zb.right)}`);
              }
            }
          }
        }
        return out;
      },
      { states, entities },
    );
    assert.deepEqual(failures, []);
  } finally {
    await page.close();
  }
});

test.after(() => browser?.close());
