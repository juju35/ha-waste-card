/*
 * Waste Card for Home Assistant
 * https://github.com/juju35/ha-waste-card
 *
 * Lovelace cards showing the next waste collections per bin: from the sensors of Waste Collection Schedule
 * (https://github.com/mampfes/hacs_waste_collection_schedule), from calendar entities (their events, read through
 * the calendar REST API or the calendar.get_events action) and from any sensor whose state is a date.
 * Each collection type is matched to a waste category (household, recycling, paper, glass, organic…) in many
 * languages, which gives its color and icon; both can be set per type.
 */
import { STRINGS } from "./i18n/strings.js";

export const VERSION = "__VERSION__";

// Material Design Icons (https://pictogrammers.com, Apache 2.0) used by the cards, drawn inline: `icon: mdi:<name>`
// with one of these names needs no icon font, any other mdi icon is drawn by Home Assistant's <ha-icon>.
export const ICONS = {
  "trash-can": "M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M9,8H11V17H9V8M13,8H15V17H13V8Z",
  "trash-can-outline": "M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z",
  "recycle": "M21.82,15.42L19.32,19.75C18.83,20.61 17.92,21.06 17,21H15V23L12.5,18.5L15,14V16H17.82L15.6,12.15L19.93,9.65L21.73,12.77C22.25,13.54 22.32,14.57 21.82,15.42M9.21,3.06H14.21C15.19,3.06 16.04,3.63 16.45,4.45L17.45,6.19L19.18,5.19L16.54,9.6L11.39,9.69L13.12,8.69L11.71,6.24L9.5,10.09L5.16,7.59L6.96,4.47C7.37,3.64 8.22,3.06 9.21,3.06M5.05,19.76L2.55,15.43C2.06,14.58 2.13,13.56 2.64,12.79L3.64,11.06L1.91,10.06L7.05,10.14L9.7,14.56L7.97,13.56L6.56,16H11V21H7.4C6.47,21.07 5.55,20.61 5.05,19.76Z",
  "newspaper-variant-outline": "M20 5L20 19L4 19L4 5H20M20 3H4C2.89 3 2 3.89 2 5V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V5C22 3.89 21.11 3 20 3M18 15H6V17H18V15M10 7H6V13H10V7M12 9H18V7H12V9M18 11H12V13H18V11Z",
  "bottle-wine": "M10,22A1,1 0 0,1 9,21V11C9,9 10,7.25 11,7V2.5A0.5,0.5 0 0,1 11.5,2H12.5A0.5,0.5 0 0,1 13,2.5V7C14,7.25 15,9 15,11V21A1,1 0 0,1 14,22H10Z",
  "food-apple": "M20,10C22,13 17,22 15,22C13,22 13,21 12,21C11,21 11,22 9,22C7,22 2,13 4,10C6,7 9,7 11,8V5C5.38,8.07 4.11,3.78 4.11,3.78C4.11,3.78 6.77,0.19 11,5V3H13V8C15,7 18,7 20,10Z",
  "leaf": "M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z",
  "tree": "M11,21V16.74C10.53,16.91 10.03,17 9.5,17C7,17 5,15 5,12.5C5,11.23 5.5,10.09 6.36,9.27C6.13,8.73 6,8.13 6,7.5C6,5 8,3 10.5,3C12.06,3 13.44,3.8 14.25,5C14.33,5 14.41,5 14.5,5A5.5,5.5 0 0,1 20,10.5A5.5,5.5 0 0,1 14.5,16C14,16 13.5,15.93 13,15.79V21H11Z",
  "sofa": "M12.5 7C12.5 5.89 13.39 5 14.5 5H18C19.1 5 20 5.9 20 7V9.16C18.84 9.57 18 10.67 18 11.97V14H12.5V7M6 11.96V14H11.5V7C11.5 5.89 10.61 5 9.5 5H6C4.9 5 4 5.9 4 7V9.15C5.16 9.56 6 10.67 6 11.96M20.66 10.03C19.68 10.19 19 11.12 19 12.12V15H5V12C5 10.9 4.11 10 3 10S1 10.9 1 12V17C1 18.1 1.9 19 3 19V21H5V19H19V21H21V19C22.1 19 23 18.1 23 17V12C23 10.79 21.91 9.82 20.66 10.03Z",
  "biohazard": "M23,16.06C23,16.29 23,16.5 22.96,16.7C22.78,14.14 20.64,12.11 18,12.11C17.63,12.11 17.27,12.16 16.92,12.23C16.96,12.5 17,12.73 17,13C17,15.35 15.31,17.32 13.07,17.81C13.42,20.05 15.31,21.79 17.65,21.96C17.43,22 17.22,22 17,22C14.92,22 13.07,20.94 12,19.34C10.93,20.94 9.09,22 7,22C6.78,22 6.57,22 6.35,21.96C8.69,21.79 10.57,20.06 10.93,17.81C8.68,17.32 7,15.35 7,13C7,12.73 7.04,12.5 7.07,12.23C6.73,12.16 6.37,12.11 6,12.11C3.36,12.11 1.22,14.14 1.03,16.7C1,16.5 1,16.29 1,16.06C1,12.85 3.59,10.24 6.81,10.14C6.3,9.27 6,8.25 6,7.17C6,4.94 7.23,3 9.06,2C7.81,2.9 7,4.34 7,6C7,7.35 7.56,8.59 8.47,9.5C9.38,8.59 10.62,8.04 12,8.04C13.37,8.04 14.62,8.59 15.5,9.5C16.43,8.59 17,7.35 17,6C17,4.34 16.18,2.9 14.94,2C16.77,3 18,4.94 18,7.17C18,8.25 17.7,9.27 17.19,10.14C20.42,10.24 23,12.85 23,16.06M9.27,10.11C10.05,10.62 11,10.92 12,10.92C13,10.92 13.95,10.62 14.73,10.11C14,9.45 13.06,9.03 12,9.03C10.94,9.03 10,9.45 9.27,10.11M12,14.47C12.82,14.47 13.5,13.8 13.5,13A1.5,1.5 0 0,0 12,11.5A1.5,1.5 0 0,0 10.5,13C10.5,13.8 11.17,14.47 12,14.47M10.97,16.79C10.87,14.9 9.71,13.29 8.05,12.55C8.03,12.7 8,12.84 8,13C8,14.82 9.27,16.34 10.97,16.79M15.96,12.55C14.29,13.29 13.12,14.9 13,16.79C14.73,16.34 16,14.82 16,13C16,12.84 15.97,12.7 15.96,12.55Z",
  "tshirt-crew": "M16,21H8A1,1 0 0,1 7,20V12.07L5.7,13.07C5.31,13.46 4.68,13.46 4.29,13.07L1.46,10.29C1.07,9.9 1.07,9.27 1.46,8.88L7.34,3H9C9,4.1 10.34,5 12,5C13.66,5 15,4.1 15,3H16.66L22.54,8.88C22.93,9.27 22.93,9.9 22.54,10.29L19.71,13.12C19.32,13.5 18.69,13.5 18.3,13.12L17,12.12V20A1,1 0 0,1 16,21",
  "television-classic": "M8.16,3L6.75,4.41L9.34,7H4C2.89,7 2,7.89 2,9V19C2,20.11 2.89,21 4,21H20C21.11,21 22,20.11 22,19V9C22,7.89 21.11,7 20,7H14.66L17.25,4.41L15.84,3L12,6.84L8.16,3M4,9H17V19H4V9M19.5,9A1,1 0 0,1 20.5,10A1,1 0 0,1 19.5,11A1,1 0 0,1 18.5,10A1,1 0 0,1 19.5,9M19.5,12A1,1 0 0,1 20.5,13A1,1 0 0,1 19.5,14A1,1 0 0,1 18.5,13A1,1 0 0,1 19.5,12Z",
  "calendar": "M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z",
  "calendar-clock": "M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z",
  "chevron-down": "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  "arrow-expand": "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  "arrow-collapse": "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
  "weather-night": "M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z",
  "truck": "M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L21.46,12H17V9.5M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M20,8H17V4H3C1.89,4 1,4.89 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8Z",
  "alert-circle-outline": "M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z",
  "package-variant": "M2,10.96C1.5,10.68 1.35,10.07 1.63,9.59L3.13,7C3.24,6.8 3.41,6.66 3.6,6.58L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.66,6.72 20.82,6.88 20.91,7.08L22.36,9.6C22.64,10.08 22.47,10.69 22,10.96L21,11.54V16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V10.96C2.7,11.13 2.32,11.14 2,10.96M12,4.15V4.15L12,10.85V10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V12.69L14,15.59C13.67,15.77 13.3,15.76 13,15.6V19.29L19,15.91M13.85,13.36L20.13,9.73L19.55,8.72L13.27,12.35L13.85,13.36Z",
  "flower": "M3,13A9,9 0 0,0 12,22C12,17 7.97,13 3,13M12,5.5A2.5,2.5 0 0,1 14.5,8A2.5,2.5 0 0,1 12,10.5A2.5,2.5 0 0,1 9.5,8A2.5,2.5 0 0,1 12,5.5M5.6,10.25A2.5,2.5 0 0,0 8.1,12.75C8.63,12.75 9.12,12.58 9.5,12.31C9.5,12.37 9.5,12.43 9.5,12.5A2.5,2.5 0 0,0 12,15A2.5,2.5 0 0,0 14.5,12.5C14.5,12.43 14.5,12.37 14.5,12.31C14.88,12.58 15.37,12.75 15.9,12.75C17.28,12.75 18.4,11.63 18.4,10.25C18.4,9.25 17.81,8.4 16.97,8C17.81,7.6 18.4,6.74 18.4,5.75C18.4,4.37 17.28,3.25 15.9,3.25C15.37,3.25 14.88,3.41 14.5,3.69C14.5,3.63 14.5,3.56 14.5,3.5A2.5,2.5 0 0,0 12,1A2.5,2.5 0 0,0 9.5,3.5C9.5,3.56 9.5,3.63 9.5,3.69C9.12,3.41 8.63,3.25 8.1,3.25A2.5,2.5 0 0,0 5.6,5.75C5.6,6.74 6.19,7.6 7.03,8C6.19,8.4 5.6,9.25 5.6,10.25M12,22A9,9 0 0,0 21,13C16,13 12,17 12,22Z",
  "delete-empty": "M20.37,8.91L19.37,10.64L7.24,3.64L8.24,1.91L11.28,3.66L12.64,3.29L16.97,5.79L17.34,7.16L20.37,8.91M6,19V7H11.07L18,11V19A2,2 0 0,1 16,21H8A2,2 0 0,1 6,19Z",
};

// Waste categories, in matching order: the first whose pattern matches the collection type (lower case, accents
// removed) gives its default color, icon and translated name. "non recyclable" is household waste, not recycling;
// a packaging collection that also takes paper or cartons ("Emballages et papiers", "Plastic, metaal en
// drankkartons") is recycling, unless it is glass packaging. Patterns cover the Latin, Cyrillic and Greek scripts.
export const CATEGORIES = [
  { key: "garbage", icon: "trash-can", color: "#616161", re: /non.?recycl|not recycl|unsortiert|nerecikl/ },
  {
    key: "hazardous",
    icon: "biohazard",
    color: "#e53935",
    re: /hazard|toxic|chemi|schadstoff|sondermul|dangereu|peligros|perigos|pericolos|pericul|gevaarl|problemstoff|niebezpiec|nebezpec|opas|veszelyes|bistam|nevarn|epikind|farlig|опас|небезпеч|επικινδ/,
  },
  { key: "electronics", icon: "television-classic", color: "#00897b", re: /electr|elektr|eletr|e-waste|weee|deee|d3e|raee|appliance|электрон|електрон|ηλεκτρ/ },
  { key: "textile", icon: "tshirt-crew", color: "#ec407a", re: /textil|textiel|textei|tessil|tekstil|tekstyl|cloth|vetement|kleider|ropa|indumenti|текстил|одежд|одяг|ρουχ/ },
  {
    key: "bulky",
    icon: "sofa",
    color: "#8e24aa",
    re: /bulk|encombrant|sperr|grofvuil|volumin|ingombrant|gabaryt|objemn|kabast|lomtalan|storskrald|grovavfall|kosovn|lielgabar|monstro|large item|furniture|габарит|кабаст|ογκωδ/,
  },
  { key: "recycling", icon: "recycle", color: "#f9a825", re: /^(?!.*(?:glas|verre|vidr|vetro|sticl|стекл|скло|стакл|стъкл|γυαλ)).*(?:emballage|drankkarton|leichtverpack|pmd|gelb|yellow|jaune)/ },
  { key: "glass", icon: "bottle-wine", color: "#2e7d32", re: /glas|verre|vidrio|vetro|szklo|sklo|staklo|stikl|sticl|vidro|steklo|uveg|стекл|скло|стакл|стъкл|γυαλ/ },
  {
    key: "paper",
    icon: "newspaper-variant-outline",
    color: "#1e88e5",
    re: /paper|papier|carton|cardboard|karton|papel|carta|papir|papper|papp|hartie|tidning|бумаг|папир|папір|хартия|макулат|χαρτ/,
  },
  {
    key: "organic",
    icon: "food-apple",
    color: "#795548",
    re: /bio|organ|food|compost|gft|kitchen|alimentaire|umido|kuchen|matavfall|madaffald|keuken|био|біо|органи|органі|пищев|харчов|компост|βιο|οργανικ|κομποστ/,
  },
  {
    key: "garden",
    icon: "leaf",
    color: "#7cb342",
    re: /garden|garten|green waste|yard|vegeta|dechets verts|grun|\blaub|tuin|baum|\btree|sapin|christmas|weihnacht|kerstbo|snoei|sfalci|poda|ogrod|zielone|haveaffald|tradgard|zahrad|vrtn|basten|verzi|zold|darza|verde|садов|растител|рослин|градин|баштен|зелен|κλαδ|πρασιν/,
  },
  {
    key: "recycling",
    icon: "recycle",
    color: "#f9a825",
    re: /recycl|recicl|recikl|emballage|packag|plast|verpackung|wertstoff|lvp|envase|multimateriale|metal|selecti|szelektiv|muanyag|genbrug|forpackning|embala|skirot|iepakojum|втор|рецикл|переработ|упаков|пластик|пластмас|ανακυκλ|συσκευασ|πλαστικ/,
  },
  {
    key: "garbage",
    icon: "trash-can",
    color: "#616161",
    re: /rest|residu|rezidu|household|general|black|grey|gray|ordure|menag|menaj|omr|hausmul|grijs|indiferenc|indifferenz|secco|zmieszan|zmesov|smesan|smesn|mesan|landfill|refuse|rubbish|garbage|trash|komunal|kommunal|sadzive|domestic|schwarz|grau|noir|gris|тко|комунал|коммунал|смешан|змішан|битов|мусор|сміття|συμμεικτ|οικιακ/,
  },
];
export const OTHER = { key: "other", icon: "trash-can-outline", color: "#78909c" };

export const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[łđø]/g, (c) => ({ ł: "l", đ: "d", ø: "o" })[c]);

export const categoryOf = (raw) => {
  const s = fold(raw);
  return CATEGORIES.find((c) => c.re.test(s)) || OTHER;
};
export const categoryByKey = (key) => CATEGORIES.find((c) => c.key === key) || (key === "other" ? OTHER : null);


export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: the card's language option, else HA's full locale (keeps its region) when its base matches the
// card language, else that language. A bare "pt" (HA's European Portuguese) becomes "pt-PT".
export const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

export const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

export const cap = (s) => {
  const v = String(s ?? "").trim();
  return v.charAt(0).toLocaleUpperCase() + v.slice(1);
};
