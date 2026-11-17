// The status pill in Chromium (skipped without it), in en, fr, de, hu, el and ru, from 190 to 500 px, on the full
// card, the mini card (compact and expanded) and the classic header: on the title row only with the whole title
// beside it; else on its own line under the title (or the subtitle), its label whole; or its dot alone (always at
// 190 px). Nothing below the top of the banner's road strip or out of the banner. The mini card's expand / collapse
// button is a 24 px round button 5 px from the top right corner of the banner.
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

test("status pill: whole title beside it, whole label or dot alone, inside the banner; zoom button at the top right", { skip: !browser && "no Chromium" }, async () => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  try {
    await page.clock.setFixedTime(new Date(NOW));
    await page.setContent('<!doctype html><body style="margin:0;font-family:Roboto,Arial,sans-serif"></body>');
    await page.addScriptTag({ content: HA_CARD });
    await page.addScriptTag({ content: source });
    const failures = await page.evaluate(
      async ({ states, entities }) => {
        const frames = (n) => new Promise((r) => {
          const step = () => (n-- > 0 ? requestAnimationFrame(step) : r());
          step();
        });
        const out = [];
        for (const language of ["en", "fr", "de", "hu", "el", "ru"]) {
          const hass = { states, entities, language, locale: { language }, themes: {}, callApi: async () => [] };
          for (const width of [190, 245, 300, 400, 460, 500]) {
            for (const [type, zoom, ill] of [["waste-card", false, true], ["waste-mini-card", false, true], ["waste-mini-card", true, true], ["waste-card", false, false], ["waste-mini-card", false, false]]) {
              for (const title of [undefined, "A very long title for the waste collection of the street"]) {
                document.body.innerHTML = "";
                const box = document.body.appendChild(document.createElement("div"));
                box.style.width = `${width}px`;
                const card = box.appendChild(document.createElement(type));
                card.setConfig({ type: `custom:${type}`, entities: ["sensor.waste_collection", "sensor.bulky_waste"], ...(ill ? {} : { illustration: false }), ...(title ? { title } : {}) });
                card.hass = hass;
                await frames(2);
                const r = card.shadowRoot;
                if (zoom) r.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
                await frames(4);
                const tag = `${language} ${type}${zoom ? " zoomed" : ""}${ill ? "" : " classic"} ${width}px${title ? " long title" : ""}`;
                const head = r.querySelector(ill ? ".banner" : ".header");
                const chip = head?.querySelector(".chip");
                if (!chip) {
                  out.push(`${tag}: no pill`);
                  continue;
                }
                const name = head.querySelector(".name");
                const text = chip.querySelector(".chip-text");
                const dotOnly = getComputedStyle(text).display === "none";
                if (width <= 200 && !dotOnly) out.push(`${tag}: label shown at ${width}px`);
                if (!dotOnly && (text.scrollWidth > text.clientWidth + 0.5 || text.clientWidth === 0)) out.push(`${tag}: label cut`);
                const nb = name.getBoundingClientRect();
                const cb = chip.getBoundingClientRect();
                const onRow = Math.abs(cb.top + cb.height / 2 - (nb.top + nb.height / 2)) < 3;
                if (onRow && !dotOnly && name.scrollWidth > name.clientWidth + 0.5) out.push(`${tag}: title cut beside the pill`);
                if (!onRow && cb.top < nb.bottom - 0.5) out.push(`${tag}: pill over the title`);
                if (!onRow && dotOnly) out.push(`${tag}: dot alone off the title row`);
                // Under the title only when the whole title and the whole label do not fit beside each other.
                const row = name.parentElement.getBoundingClientRect();
                if (!onRow && name.scrollWidth + 8 + cb.width <= row.right - nb.left - 1 && width > 200) out.push(`${tag}: pill under the title although it fits beside it`);
                const hb = head.getBoundingClientRect();
                if (cb.right > hb.right + 0.5 || cb.left < hb.left - 0.5) out.push(`${tag}: pill out of the header`);
                if (ill) {
                  const floor = head.querySelector(".road").getBoundingClientRect().top;
                  for (const [what, el] of [["title", name], ["pill", chip]]) {
                    const b = el.getBoundingClientRect();
                    if (b.bottom > floor + 0.5) out.push(`${tag}: ${what} over the road strip`);
                    if (b.top < hb.top - 0.5) out.push(`${tag}: ${what} above the banner`);
                  }
                  if (type === "waste-mini-card") {
                    const zb = head.querySelector(".zoom")?.getBoundingClientRect();
                    if (!zb) out.push(`${tag}: no zoom button`);
                    else if (Math.round(zb.width) !== 24 || Math.round(zb.height) !== 24 || Math.round(zb.top - hb.top) !== 5 || Math.round(hb.right - zb.right) !== 5)
                      out.push(`${tag}: zoom button ${Math.round(zb.width)}x${Math.round(zb.height)} at ${Math.round(zb.top - hb.top)}/${Math.round(hb.right - zb.right)}`);
                  }
                }
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
