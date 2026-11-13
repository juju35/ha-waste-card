// The README screenshots (PNG) and animations (GIF) rendered by scripts/screenshots.mjs.
// Every capture has a twin in the other theme ("-dark" for a light capture, "-light" for a dark one)
// that shows exactly the same state: only the theme differs (checked by test/screenshots.test.mjs).
import { today } from "./mock-states.mjs";

const SENSORS = { entities: ["sensor.waste_collection", "sensor.bulky_waste"] };
const CALENDAR = { entities: ["calendar.waste_collection"], type_names: "category" };
const CUSTOM = {
  entities: ["sensor.waste_collection"],
  title: "Bins",
  collapsed: ["upcoming"],
  types: [
    { match: "Recycling", name: "Yellow bin", color: "#fdd835" },
    { match: "General", name: "Grey bin", color: "#757575" },
    { match: "/organic|garden/", name: "Brown bin", color: "#8d6e63", icon: "mdi:leaf" },
    { match: "Glass", name: "Bottle bank", icon: "mdi:bottle-wine" },
  ],
};

const twins = (s) => [
  { ...s, theme: "light" },
  { ...s, file: `${s.file}-dark`, theme: "dark" },
];

export const shots = [
  // Waste Collection Schedule sensor and a date sensor, Friday evening: recycling and glass to put out tonight.
  ...twins({ file: "card", type: "waste-card", width: 460, config: SENSORS }),
  // A calendar, its events named by translated waste category.
  ...twins({ file: "card-calendar", type: "waste-card", width: 460, config: CALENDAR }),
  // Own names, colors and icons per bin, the upcoming list folded.
  ...twins({ file: "card-custom", type: "waste-card", width: 460, config: CUSTOM }),
  ...twins({ file: "mini-card", type: "waste-mini-card", width: 380, config: SENSORS }),
  ...twins({ file: "mini-card-zoom", type: "waste-mini-card", width: 460, config: SENSORS, clicks: [".zoom"] }),
  // Narrow cards: the full card at 6 of 12 columns of a Sections view on a phone, the mini card in a 1fr 1fr grid.
  ...twins({ file: "card-narrow", type: "waste-card", width: 238, config: SENSORS }),
  ...twins({ file: "mini-card-narrow", type: "waste-mini-card", width: 170, config: SENSORS }),
];

// One looping GIF per animated state:
//   tonight — collection tomorrow, from the evening highlight on: the bins roll to the kerb under the moon
//   today   — collection today: the lids lift and rings pulse around the bins
export const gifs = [
  ...twins({ file: "tonight", type: "waste-card", width: 460, config: SENSORS }),
  ...twins({ file: "today", type: "waste-card", width: 460, config: SENSORS, overrides: today }),
];
