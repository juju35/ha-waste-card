// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { WasteCard, WasteMiniCard } from "./cards.js";
import { WasteCardEditor, WasteMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("waste-card", WasteCard);
define("waste-mini-card", WasteMiniCard);
define("waste-card-editor", WasteCardEditor);
define("waste-mini-card-editor", WasteMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "waste-card",
    name: "Waste Card",
    description: "Next waste collections per bin (household, recycling, glass, organic, bulky…) from Waste Collection Schedule, a calendar or date sensors, with the bin to put out tonight.",
  },
  { type: "waste-mini-card", name: "Waste Mini Card", description: "Next waste collection only, with a countdown and the bin to put out tonight." },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-waste-card" });
}

console.info(`%c WASTE-CARD %c v${VERSION} `, "color: white; background: #43a047; font-weight: 700;", "color: #43a047; background: white; font-weight: 700;");
