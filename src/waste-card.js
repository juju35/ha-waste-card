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

const VERSION = "__VERSION__";

// Material Design Icons (https://pictogrammers.com, Apache 2.0) used by the cards, drawn inline: `icon: mdi:<name>`
// with one of these names needs no icon font, any other mdi icon is drawn by Home Assistant's <ha-icon>.
const ICONS = {
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
const CATEGORIES = [
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
const OTHER = { key: "other", icon: "trash-can-outline", color: "#78909c" };

const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[łđø]/g, (c) => ({ ł: "l", đ: "d", ø: "o" })[c]);

const categoryOf = (raw) => {
  const s = fold(raw);
  return CATEGORIES.find((c) => c.re.test(s)) || OTHER;
};
const categoryByKey = (key) => CATEGORIES.find((c) => c.key === key) || (key === "other" ? OTHER : null);

const STRINGS = {
  en: {
    title: "Waste collection",
    next: "Next collection",
    bins: "By bin",
    upcoming: "Upcoming collections",
    put_out_tonight: "Put out tonight",
    collection_today: "Collection today",
    no_collection: "No upcoming collection",
    no_entities: "No waste collection entity found. Add a Waste Collection Schedule sensor, a calendar or a date sensor.",
    loading: "Loading the calendar…",
    zoom_in: "Show details",
    zoom_out: "Show less",
    cat_garbage: "Household waste",
    cat_recycling: "Recycling",
    cat_paper: "Paper",
    cat_glass: "Glass",
    cat_organic: "Organic waste",
    cat_garden: "Garden waste",
    cat_bulky: "Bulky waste",
    cat_hazardous: "Hazardous waste",
    cat_textile: "Textiles",
    cat_electronics: "Electronics",
    cat_other: "Other",
    entities: "Entities (Waste Collection Schedule sensors, calendars, date sensors)",
    title_opt: "Title (optional)",
    show_title: "Show title",
    show_subtitle: "Show subtitle",
    show_bins: "Show the next collection per bin",
    show_upcoming: "Show upcoming collections",
    max_items: "Collections listed",
    days: "Days ahead (calendars)",
    tonight_from: "Highlight the day before from (hour)",
    type_names: "Bin names",
    type_names_source: "As given by the source",
    type_names_category: "Translated waste category",
    collapsed: "Folded sections",
    zoom: "Detail button",
    zoom_helper: "Switches the mini card to the full card and back",
    language: "Language",
    lang_auto: "Automatic",
  },
  fr: {
    title: "Collecte des déchets",
    next: "Prochaine collecte",
    bins: "Par bac",
    upcoming: "Prochaines collectes",
    put_out_tonight: "À sortir ce soir",
    collection_today: "Collecte aujourd'hui",
    no_collection: "Aucune collecte à venir",
    no_entities: "Aucune entité de collecte trouvée. Ajoutez un capteur Waste Collection Schedule, un calendrier ou un capteur de date.",
    loading: "Chargement du calendrier…",
    zoom_in: "Afficher le détail",
    zoom_out: "Réduire",
    cat_garbage: "Ordures ménagères",
    cat_recycling: "Recyclables",
    cat_paper: "Papier",
    cat_glass: "Verre",
    cat_organic: "Biodéchets",
    cat_garden: "Déchets verts",
    cat_bulky: "Encombrants",
    cat_hazardous: "Déchets dangereux",
    cat_textile: "Textiles",
    cat_electronics: "Électronique",
    cat_other: "Autre",
    entities: "Entités (capteurs Waste Collection Schedule, calendriers, capteurs de date)",
    title_opt: "Titre (facultatif)",
    show_title: "Afficher le titre",
    show_subtitle: "Afficher le sous-titre",
    show_bins: "Afficher la prochaine collecte par bac",
    show_upcoming: "Afficher les prochaines collectes",
    max_items: "Nombre de collectes listées",
    days: "Jours à venir (calendriers)",
    tonight_from: "Mise en avant la veille à partir de (heure)",
    type_names: "Noms des bacs",
    type_names_source: "Tels que fournis par la source",
    type_names_category: "Catégorie de déchets traduite",
    collapsed: "Sections repliées",
    zoom: "Bouton détail",
    zoom_helper: "Bascule la mini-carte vers la carte complète et inversement",
    language: "Langue",
    lang_auto: "Automatique",
  },
  de: {
    title: "Müllabfuhr",
    next: "Nächste Abholung",
    bins: "Nach Tonne",
    upcoming: "Nächste Abholungen",
    put_out_tonight: "Heute Abend rausstellen",
    collection_today: "Abholung heute",
    no_collection: "Keine anstehende Abholung",
    no_entities: "Keine Abfuhr-Entität gefunden. Fügen Sie einen Waste-Collection-Schedule-Sensor, einen Kalender oder einen Datumssensor hinzu.",
    loading: "Kalender wird geladen…",
    zoom_in: "Details anzeigen",
    zoom_out: "Weniger anzeigen",
    cat_garbage: "Restmüll",
    cat_recycling: "Wertstoffe",
    cat_paper: "Papier",
    cat_glass: "Glas",
    cat_organic: "Biomüll",
    cat_garden: "Grünschnitt",
    cat_bulky: "Sperrmüll",
    cat_hazardous: "Schadstoffe",
    cat_textile: "Textilien",
    cat_electronics: "Elektroschrott",
    cat_other: "Sonstiges",
    entities: "Entitäten (Waste-Collection-Schedule-Sensoren, Kalender, Datumssensoren)",
    title_opt: "Titel (optional)",
    show_title: "Titel anzeigen",
    show_subtitle: "Untertitel anzeigen",
    show_bins: "Nächste Abholung je Tonne anzeigen",
    show_upcoming: "Nächste Abholungen anzeigen",
    max_items: "Angezeigte Abholungen",
    days: "Tage im Voraus (Kalender)",
    tonight_from: "Am Vortag hervorheben ab (Uhrzeit)",
    type_names: "Namen der Tonnen",
    type_names_source: "Wie von der Quelle geliefert",
    type_names_category: "Übersetzte Abfallkategorie",
    collapsed: "Eingeklappte Bereiche",
    zoom: "Detail-Schaltfläche",
    zoom_helper: "Schaltet die Mini-Karte auf die volle Karte um und zurück",
    language: "Sprache",
    lang_auto: "Automatisch",
  },
  es: {
    title: "Recogida de residuos",
    next: "Próxima recogida",
    bins: "Por contenedor",
    upcoming: "Próximas recogidas",
    put_out_tonight: "Sacar esta noche",
    collection_today: "Recogida hoy",
    no_collection: "No hay recogidas próximas",
    no_entities: "No se encontró ninguna entidad de recogida. Añada un sensor de Waste Collection Schedule, un calendario o un sensor de fecha.",
    loading: "Cargando el calendario…",
    zoom_in: "Mostrar detalles",
    zoom_out: "Mostrar menos",
    cat_garbage: "Resto",
    cat_recycling: "Envases",
    cat_paper: "Papel y cartón",
    cat_glass: "Vidrio",
    cat_organic: "Orgánico",
    cat_garden: "Restos de poda",
    cat_bulky: "Voluminosos",
    cat_hazardous: "Residuos peligrosos",
    cat_textile: "Textil",
    cat_electronics: "Electrónica",
    cat_other: "Otros",
    entities: "Entidades (sensores de Waste Collection Schedule, calendarios, sensores de fecha)",
    title_opt: "Título (opcional)",
    show_title: "Mostrar el título",
    show_subtitle: "Mostrar el subtítulo",
    show_bins: "Mostrar la próxima recogida por contenedor",
    show_upcoming: "Mostrar las próximas recogidas",
    max_items: "Recogidas mostradas",
    days: "Días por delante (calendarios)",
    tonight_from: "Destacar la víspera a partir de (hora)",
    type_names: "Nombres de los contenedores",
    type_names_source: "Tal como los da la fuente",
    type_names_category: "Categoría de residuo traducida",
    collapsed: "Secciones plegadas",
    zoom: "Botón de detalle",
    zoom_helper: "Cambia la minitarjeta a la tarjeta completa y viceversa",
    language: "Idioma",
    lang_auto: "Automático",
  },
  it: {
    title: "Raccolta rifiuti",
    next: "Prossima raccolta",
    bins: "Per bidone",
    upcoming: "Prossime raccolte",
    put_out_tonight: "Da esporre stasera",
    collection_today: "Raccolta oggi",
    no_collection: "Nessuna raccolta in arrivo",
    no_entities: "Nessuna entità di raccolta trovata. Aggiungi un sensore Waste Collection Schedule, un calendario o un sensore di data.",
    loading: "Caricamento del calendario…",
    zoom_in: "Mostra dettagli",
    zoom_out: "Mostra meno",
    cat_garbage: "Indifferenziato",
    cat_recycling: "Plastica e metalli",
    cat_paper: "Carta",
    cat_glass: "Vetro",
    cat_organic: "Umido",
    cat_garden: "Verde e sfalci",
    cat_bulky: "Ingombranti",
    cat_hazardous: "Rifiuti pericolosi",
    cat_textile: "Tessili",
    cat_electronics: "RAEE",
    cat_other: "Altro",
    entities: "Entità (sensori Waste Collection Schedule, calendari, sensori di data)",
    title_opt: "Titolo (facoltativo)",
    show_title: "Mostra il titolo",
    show_subtitle: "Mostra il sottotitolo",
    show_bins: "Mostra la prossima raccolta per bidone",
    show_upcoming: "Mostra le prossime raccolte",
    max_items: "Raccolte mostrate",
    days: "Giorni in avanti (calendari)",
    tonight_from: "Evidenzia il giorno prima a partire da (ora)",
    type_names: "Nomi dei bidoni",
    type_names_source: "Come forniti dalla fonte",
    type_names_category: "Categoria di rifiuto tradotta",
    collapsed: "Sezioni chiuse",
    zoom: "Pulsante dettagli",
    zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
    language: "Lingua",
    lang_auto: "Automatica",
  },
  nl: {
    title: "Afvalinzameling",
    next: "Volgende ophaling",
    bins: "Per container",
    upcoming: "Komende ophalingen",
    put_out_tonight: "Vanavond buitenzetten",
    collection_today: "Vandaag ophaling",
    no_collection: "Geen komende ophaling",
    no_entities: "Geen afvalentiteit gevonden. Voeg een Waste Collection Schedule-sensor, een agenda of een datumsensor toe.",
    loading: "Agenda laden…",
    zoom_in: "Details tonen",
    zoom_out: "Minder tonen",
    cat_garbage: "Restafval",
    cat_recycling: "PMD",
    cat_paper: "Papier",
    cat_glass: "Glas",
    cat_organic: "GFT",
    cat_garden: "Tuinafval",
    cat_bulky: "Grofvuil",
    cat_hazardous: "Gevaarlijk afval",
    cat_textile: "Textiel",
    cat_electronics: "Elektronica",
    cat_other: "Overig",
    entities: "Entiteiten (Waste Collection Schedule-sensoren, agenda's, datumsensoren)",
    title_opt: "Titel (optioneel)",
    show_title: "Titel tonen",
    show_subtitle: "Ondertitel tonen",
    show_bins: "Volgende ophaling per container tonen",
    show_upcoming: "Komende ophalingen tonen",
    max_items: "Getoonde ophalingen",
    days: "Dagen vooruit (agenda's)",
    tonight_from: "De dag ervoor markeren vanaf (uur)",
    type_names: "Namen van de containers",
    type_names_source: "Zoals de bron ze geeft",
    type_names_category: "Vertaalde afvalcategorie",
    collapsed: "Ingeklapte secties",
    zoom: "Detailknop",
    zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
    language: "Taal",
    lang_auto: "Automatisch",
  },
  pt: {
    title: "Recolha de resíduos",
    next: "Próxima recolha",
    bins: "Por contentor",
    upcoming: "Próximas recolhas",
    put_out_tonight: "Pôr à porta esta noite",
    collection_today: "Recolha hoje",
    no_collection: "Nenhuma recolha prevista",
    no_entities: "Nenhuma entidade de recolha encontrada. Adicione um sensor Waste Collection Schedule, um calendário ou um sensor de data.",
    loading: "A carregar o calendário…",
    zoom_in: "Mostrar detalhes",
    zoom_out: "Mostrar menos",
    cat_garbage: "Indiferenciados",
    cat_recycling: "Embalagens",
    cat_paper: "Papel e cartão",
    cat_glass: "Vidro",
    cat_organic: "Orgânicos",
    cat_garden: "Resíduos verdes",
    cat_bulky: "Monstros",
    cat_hazardous: "Resíduos perigosos",
    cat_textile: "Têxteis",
    cat_electronics: "Eletrónicos",
    cat_other: "Outros",
    entities: "Entidades (sensores Waste Collection Schedule, calendários, sensores de data)",
    title_opt: "Título (opcional)",
    show_title: "Mostrar o título",
    show_subtitle: "Mostrar o subtítulo",
    show_bins: "Mostrar a próxima recolha por contentor",
    show_upcoming: "Mostrar as próximas recolhas",
    max_items: "Recolhas mostradas",
    days: "Dias à frente (calendários)",
    tonight_from: "Destacar na véspera a partir das (hora)",
    type_names: "Nomes dos contentores",
    type_names_source: "Tal como dados pela fonte",
    type_names_category: "Categoria de resíduo traduzida",
    collapsed: "Secções recolhidas",
    zoom: "Botão de detalhe",
    zoom_helper: "Alterna o mini cartão para o cartão completo e vice-versa",
    language: "Idioma",
    lang_auto: "Automático",
  },
  pl: {
    title: "Wywóz odpadów",
    next: "Najbliższy wywóz",
    bins: "Według pojemnika",
    upcoming: "Nadchodzące wywozy",
    put_out_tonight: "Wystaw dziś wieczorem",
    collection_today: "Wywóz dzisiaj",
    no_collection: "Brak nadchodzących wywozów",
    no_entities: "Nie znaleziono encji wywozu. Dodaj czujnik Waste Collection Schedule, kalendarz lub czujnik daty.",
    loading: "Wczytywanie kalendarza…",
    zoom_in: "Pokaż szczegóły",
    zoom_out: "Pokaż mniej",
    cat_garbage: "Zmieszane",
    cat_recycling: "Metale i tworzywa",
    cat_paper: "Papier",
    cat_glass: "Szkło",
    cat_organic: "Bio",
    cat_garden: "Odpady zielone",
    cat_bulky: "Gabaryty",
    cat_hazardous: "Odpady niebezpieczne",
    cat_textile: "Tekstylia",
    cat_electronics: "Elektroodpady",
    cat_other: "Inne",
    entities: "Encje (czujniki Waste Collection Schedule, kalendarze, czujniki daty)",
    title_opt: "Tytuł (opcjonalnie)",
    show_title: "Pokaż tytuł",
    show_subtitle: "Pokaż podtytuł",
    show_bins: "Pokaż najbliższy wywóz dla każdego pojemnika",
    show_upcoming: "Pokaż nadchodzące wywozy",
    max_items: "Liczba wyświetlanych wywozów",
    days: "Dni naprzód (kalendarze)",
    tonight_from: "Wyróżnij dzień wcześniej od (godzina)",
    type_names: "Nazwy pojemników",
    type_names_source: "Tak jak podaje źródło",
    type_names_category: "Przetłumaczona kategoria odpadów",
    collapsed: "Zwinięte sekcje",
    zoom: "Przycisk szczegółów",
    zoom_helper: "Przełącza mini kartę na pełną kartę i z powrotem",
    language: "Język",
    lang_auto: "Automatycznie",
  },
  sr: {
    title: "Одвоз отпада",
    next: "Следећи одвоз",
    bins: "По канти",
    upcoming: "Предстојећи одвози",
    put_out_tonight: "Изнети вечерас",
    collection_today: "Одвоз данас",
    no_collection: "Нема предстојећих одвоза",
    no_entities: "Није пронађен ентитет одвоза. Додајте Waste Collection Schedule сензор, календар или сензор датума.",
    loading: "Учитавање календара…",
    zoom_in: "Прикажи детаље",
    zoom_out: "Прикажи мање",
    cat_garbage: "Комунални отпад",
    cat_recycling: "Рециклажа",
    cat_paper: "Папир",
    cat_glass: "Стакло",
    cat_organic: "Биоотпад",
    cat_garden: "Баштенски отпад",
    cat_bulky: "Кабасти отпад",
    cat_hazardous: "Опасан отпад",
    cat_textile: "Текстил",
    cat_electronics: "Електронски отпад",
    cat_other: "Остало",
    entities: "Ентитети (Waste Collection Schedule сензори, календари, сензори датума)",
    title_opt: "Наслов (опционо)",
    show_title: "Прикажи наслов",
    show_subtitle: "Прикажи поднаслов",
    show_bins: "Прикажи следећи одвоз по канти",
    show_upcoming: "Прикажи предстојеће одвозе",
    max_items: "Број приказаних одвоза",
    days: "Дана унапред (календари)",
    tonight_from: "Истакни дан раније од (сат)",
    type_names: "Називи канти",
    type_names_source: "Како их даје извор",
    type_names_category: "Преведена категорија отпада",
    collapsed: "Скупљени одељци",
    zoom: "Дугме за детаље",
    zoom_helper: "Пребацује мини картицу на пуну картицу и назад",
    language: "Језик",
    lang_auto: "Аутоматски",
  },
  "sr-Latn": {
    title: "Odvoz otpada",
    next: "Sledeći odvoz",
    bins: "Po kanti",
    upcoming: "Predstojeći odvozi",
    put_out_tonight: "Izneti večeras",
    collection_today: "Odvoz danas",
    no_collection: "Nema predstojećih odvoza",
    no_entities: "Nije pronađen entitet odvoza. Dodajte Waste Collection Schedule senzor, kalendar ili senzor datuma.",
    loading: "Učitavanje kalendara…",
    zoom_in: "Prikaži detalje",
    zoom_out: "Prikaži manje",
    cat_garbage: "Komunalni otpad",
    cat_recycling: "Reciklaža",
    cat_paper: "Papir",
    cat_glass: "Staklo",
    cat_organic: "Biootpad",
    cat_garden: "Baštenski otpad",
    cat_bulky: "Kabasti otpad",
    cat_hazardous: "Opasan otpad",
    cat_textile: "Tekstil",
    cat_electronics: "Elektronski otpad",
    cat_other: "Ostalo",
    entities: "Entiteti (Waste Collection Schedule senzori, kalendari, senzori datuma)",
    title_opt: "Naslov (opciono)",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    show_bins: "Prikaži sledeći odvoz po kanti",
    show_upcoming: "Prikaži predstojeće odvoze",
    max_items: "Broj prikazanih odvoza",
    days: "Dana unapred (kalendari)",
    tonight_from: "Istakni dan ranije od (sat)",
    type_names: "Nazivi kanti",
    type_names_source: "Kako ih daje izvor",
    type_names_category: "Prevedena kategorija otpada",
    collapsed: "Skupljeni odeljci",
    zoom: "Dugme za detalje",
    zoom_helper: "Prebacuje mini karticu na punu karticu i nazad",
    language: "Jezik",
    lang_auto: "Automatski",
  },
  ro: {
    title: "Colectarea deșeurilor",
    next: "Următoarea colectare",
    bins: "După pubelă",
    upcoming: "Colectări viitoare",
    put_out_tonight: "De scos în seara asta",
    collection_today: "Colectare azi",
    no_collection: "Nicio colectare programată",
    no_entities: "Nu s-a găsit nicio entitate de colectare. Adăugați un senzor Waste Collection Schedule, un calendar sau un senzor de dată.",
    loading: "Se încarcă calendarul…",
    zoom_in: "Afișează detaliile",
    zoom_out: "Afișează mai puțin",
    cat_garbage: "Deșeuri menajere",
    cat_recycling: "Reciclabile",
    cat_paper: "Hârtie",
    cat_glass: "Sticlă",
    cat_organic: "Biodeșeuri",
    cat_garden: "Deșeuri verzi",
    cat_bulky: "Deșeuri voluminoase",
    cat_hazardous: "Deșeuri periculoase",
    cat_textile: "Textile",
    cat_electronics: "Electronice",
    cat_other: "Altele",
    entities: "Entități (senzori Waste Collection Schedule, calendare, senzori de dată)",
    title_opt: "Titlu (opțional)",
    show_title: "Afișează titlul",
    show_subtitle: "Afișează subtitlul",
    show_bins: "Afișează următoarea colectare pe pubelă",
    show_upcoming: "Afișează colectările viitoare",
    max_items: "Colectări afișate",
    days: "Zile în avans (calendare)",
    tonight_from: "Evidențiază în ziua dinainte de la (ora)",
    type_names: "Numele pubelelor",
    type_names_source: "Așa cum le dă sursa",
    type_names_category: "Categorie de deșeuri tradusă",
    collapsed: "Secțiuni restrânse",
    zoom: "Buton de detalii",
    zoom_helper: "Comută mini cardul la cardul complet și înapoi",
    language: "Limbă",
    lang_auto: "Automat",
  },
  da: {
    title: "Affaldsindsamling",
    next: "Næste tømning",
    bins: "Efter beholder",
    upcoming: "Kommende tømninger",
    put_out_tonight: "Sæt ud i aften",
    collection_today: "Tømning i dag",
    no_collection: "Ingen kommende tømning",
    no_entities: "Ingen affaldsentitet fundet. Tilføj en Waste Collection Schedule-sensor, en kalender eller en datosensor.",
    loading: "Indlæser kalender…",
    zoom_in: "Vis detaljer",
    zoom_out: "Vis mindre",
    cat_garbage: "Restaffald",
    cat_recycling: "Genbrug",
    cat_paper: "Papir",
    cat_glass: "Glas",
    cat_organic: "Madaffald",
    cat_garden: "Haveaffald",
    cat_bulky: "Storskrald",
    cat_hazardous: "Farligt affald",
    cat_textile: "Tekstiler",
    cat_electronics: "Elektronik",
    cat_other: "Andet",
    entities: "Entiteter (Waste Collection Schedule-sensorer, kalendere, datosensorer)",
    title_opt: "Titel (valgfri)",
    show_title: "Vis titel",
    show_subtitle: "Vis undertitel",
    show_bins: "Vis næste tømning pr. beholder",
    show_upcoming: "Vis kommende tømninger",
    max_items: "Viste tømninger",
    days: "Dage frem (kalendere)",
    tonight_from: "Fremhæv dagen før fra (time)",
    type_names: "Navne på beholdere",
    type_names_source: "Som kilden angiver dem",
    type_names_category: "Oversat affaldskategori",
    collapsed: "Sammenfoldede sektioner",
    zoom: "Detaljeknap",
    zoom_helper: "Skifter minikortet til det fulde kort og tilbage",
    language: "Sprog",
    lang_auto: "Automatisk",
  },
  sv: {
    title: "Sophämtning",
    next: "Nästa hämtning",
    bins: "Per kärl",
    upcoming: "Kommande hämtningar",
    put_out_tonight: "Ställ ut i kväll",
    collection_today: "Hämtning i dag",
    no_collection: "Ingen kommande hämtning",
    no_entities: "Ingen sophämtningsentitet hittades. Lägg till en Waste Collection Schedule-sensor, en kalender eller en datumsensor.",
    loading: "Läser in kalendern…",
    zoom_in: "Visa detaljer",
    zoom_out: "Visa mindre",
    cat_garbage: "Restavfall",
    cat_recycling: "Förpackningar",
    cat_paper: "Papper",
    cat_glass: "Glas",
    cat_organic: "Matavfall",
    cat_garden: "Trädgårdsavfall",
    cat_bulky: "Grovavfall",
    cat_hazardous: "Farligt avfall",
    cat_textile: "Textil",
    cat_electronics: "Elektronik",
    cat_other: "Övrigt",
    entities: "Entiteter (Waste Collection Schedule-sensorer, kalendrar, datumsensorer)",
    title_opt: "Titel (valfri)",
    show_title: "Visa titel",
    show_subtitle: "Visa underrubrik",
    show_bins: "Visa nästa hämtning per kärl",
    show_upcoming: "Visa kommande hämtningar",
    max_items: "Visade hämtningar",
    days: "Dagar framåt (kalendrar)",
    tonight_from: "Markera dagen före från (timme)",
    type_names: "Namn på kärl",
    type_names_source: "Som källan anger dem",
    type_names_category: "Översatt avfallskategori",
    collapsed: "Hopfällda avsnitt",
    zoom: "Detaljknapp",
    zoom_helper: "Växlar minikortet till hela kortet och tillbaka",
    language: "Språk",
    lang_auto: "Automatiskt",
  },
  bg: {
    title: "Сметоизвозване",
    next: "Следващо извозване",
    bins: "По контейнер",
    upcoming: "Предстоящи извозвания",
    put_out_tonight: "Изнесете довечера",
    collection_today: "Извозване днес",
    no_collection: "Няма предстоящи извозвания",
    no_entities: "Не е намерен обект за извозване. Добавете сензор Waste Collection Schedule, календар или сензор за дата.",
    loading: "Зареждане на календара…",
    zoom_in: "Покажи подробности",
    zoom_out: "Покажи по-малко",
    cat_garbage: "Битови отпадъци",
    cat_recycling: "Рециклируеми",
    cat_paper: "Хартия",
    cat_glass: "Стъкло",
    cat_organic: "Биоотпадъци",
    cat_garden: "Градински отпадъци",
    cat_bulky: "Едрогабаритни",
    cat_hazardous: "Опасни отпадъци",
    cat_textile: "Текстил",
    cat_electronics: "Електроника",
    cat_other: "Други",
    entities: "Обекти (сензори Waste Collection Schedule, календари, сензори за дата)",
    title_opt: "Заглавие (по избор)",
    show_title: "Покажи заглавието",
    show_subtitle: "Покажи подзаглавието",
    show_bins: "Покажи следващото извозване по контейнер",
    show_upcoming: "Покажи предстоящите извозвания",
    max_items: "Показани извозвания",
    days: "Дни напред (календари)",
    tonight_from: "Открояване в предния ден от (час)",
    type_names: "Имена на контейнерите",
    type_names_source: "Както ги дава източникът",
    type_names_category: "Преведена категория отпадъци",
    collapsed: "Свити раздели",
    zoom: "Бутон за подробности",
    zoom_helper: "Превключва мини картата към пълната карта и обратно",
    language: "Език",
    lang_auto: "Автоматично",
  },
  ru: {
    title: "Вывоз мусора",
    next: "Следующий вывоз",
    bins: "По контейнерам",
    upcoming: "Ближайшие вывозы",
    put_out_tonight: "Вынести сегодня вечером",
    collection_today: "Вывоз сегодня",
    no_collection: "Нет запланированных вывозов",
    no_entities: "Не найдено ни одной сущности вывоза. Добавьте датчик Waste Collection Schedule, календарь или датчик даты.",
    loading: "Загрузка календаря…",
    zoom_in: "Показать подробности",
    zoom_out: "Свернуть",
    cat_garbage: "Смешанные отходы",
    cat_recycling: "Вторсырьё",
    cat_paper: "Бумага",
    cat_glass: "Стекло",
    cat_organic: "Биоотходы",
    cat_garden: "Садовые отходы",
    cat_bulky: "Крупногабаритные",
    cat_hazardous: "Опасные отходы",
    cat_textile: "Текстиль",
    cat_electronics: "Электроника",
    cat_other: "Прочее",
    entities: "Сущности (датчики Waste Collection Schedule, календари, датчики даты)",
    title_opt: "Заголовок (необязательно)",
    show_title: "Показывать заголовок",
    show_subtitle: "Показывать подзаголовок",
    show_bins: "Показывать следующий вывоз по контейнерам",
    show_upcoming: "Показывать ближайшие вывозы",
    max_items: "Число показанных вывозов",
    days: "Дней вперёд (календари)",
    tonight_from: "Выделять накануне с (час)",
    type_names: "Названия контейнеров",
    type_names_source: "Как в источнике",
    type_names_category: "Переведённая категория отходов",
    collapsed: "Свёрнутые разделы",
    zoom: "Кнопка подробностей",
    zoom_helper: "Переключает мини-карточку на полную и обратно",
    language: "Язык",
    lang_auto: "Автоматически",
  },
  uk: {
    title: "Вивезення сміття",
    next: "Наступне вивезення",
    bins: "За контейнерами",
    upcoming: "Найближчі вивезення",
    put_out_tonight: "Винести сьогодні ввечері",
    collection_today: "Вивезення сьогодні",
    no_collection: "Немає запланованих вивезень",
    no_entities: "Не знайдено жодної сутності вивезення. Додайте датчик Waste Collection Schedule, календар або датчик дати.",
    loading: "Завантаження календаря…",
    zoom_in: "Показати подробиці",
    zoom_out: "Згорнути",
    cat_garbage: "Змішані відходи",
    cat_recycling: "Вторсировина",
    cat_paper: "Папір",
    cat_glass: "Скло",
    cat_organic: "Біовідходи",
    cat_garden: "Садові відходи",
    cat_bulky: "Великогабаритні",
    cat_hazardous: "Небезпечні відходи",
    cat_textile: "Текстиль",
    cat_electronics: "Електроніка",
    cat_other: "Інше",
    entities: "Сутності (датчики Waste Collection Schedule, календарі, датчики дати)",
    title_opt: "Заголовок (необов'язково)",
    show_title: "Показувати заголовок",
    show_subtitle: "Показувати підзаголовок",
    show_bins: "Показувати наступне вивезення за контейнерами",
    show_upcoming: "Показувати найближчі вивезення",
    max_items: "Кількість показаних вивезень",
    days: "Днів наперед (календарі)",
    tonight_from: "Виділяти напередодні з (година)",
    type_names: "Назви контейнерів",
    type_names_source: "Як у джерелі",
    type_names_category: "Перекладена категорія відходів",
    collapsed: "Згорнуті розділи",
    zoom: "Кнопка подробиць",
    zoom_helper: "Перемикає мінікартку на повну й назад",
    language: "Мова",
    lang_auto: "Автоматично",
  },
  hu: {
    title: "Hulladékszállítás",
    next: "Következő szállítás",
    bins: "Kukánként",
    upcoming: "Közelgő szállítások",
    put_out_tonight: "Ma este kitenni",
    collection_today: "Szállítás ma",
    no_collection: "Nincs közelgő szállítás",
    no_entities: "Nem található hulladékszállítási entitás. Adjon hozzá egy Waste Collection Schedule érzékelőt, egy naptárt vagy egy dátumérzékelőt.",
    loading: "Naptár betöltése…",
    zoom_in: "Részletek",
    zoom_out: "Kevesebb",
    cat_garbage: "Kommunális hulladék",
    cat_recycling: "Szelektív",
    cat_paper: "Papír",
    cat_glass: "Üveg",
    cat_organic: "Biohulladék",
    cat_garden: "Zöldhulladék",
    cat_bulky: "Lomtalanítás",
    cat_hazardous: "Veszélyes hulladék",
    cat_textile: "Textil",
    cat_electronics: "Elektronikai hulladék",
    cat_other: "Egyéb",
    entities: "Entitások (Waste Collection Schedule érzékelők, naptárak, dátumérzékelők)",
    title_opt: "Cím (nem kötelező)",
    show_title: "Cím megjelenítése",
    show_subtitle: "Alcím megjelenítése",
    show_bins: "Következő szállítás kukánként",
    show_upcoming: "Közelgő szállítások megjelenítése",
    max_items: "Megjelenített szállítások",
    days: "Napok előre (naptárak)",
    tonight_from: "Kiemelés előző nap ettől (óra)",
    type_names: "Kukák nevei",
    type_names_source: "Ahogy a forrás adja",
    type_names_category: "Lefordított hulladékkategória",
    collapsed: "Összecsukott szakaszok",
    zoom: "Részletek gomb",
    zoom_helper: "A mini kártyát a teljes kártyára váltja és vissza",
    language: "Nyelv",
    lang_auto: "Automatikus",
  },
  sk: {
    title: "Odvoz odpadu",
    next: "Najbližší odvoz",
    bins: "Podľa nádoby",
    upcoming: "Nadchádzajúce odvozy",
    put_out_tonight: "Vyložiť dnes večer",
    collection_today: "Odvoz dnes",
    no_collection: "Žiadny nadchádzajúci odvoz",
    no_entities: "Nenašla sa žiadna entita odvozu. Pridajte senzor Waste Collection Schedule, kalendár alebo dátumový senzor.",
    loading: "Načítava sa kalendár…",
    zoom_in: "Zobraziť podrobnosti",
    zoom_out: "Zobraziť menej",
    cat_garbage: "Zmesový odpad",
    cat_recycling: "Plasty a kovy",
    cat_paper: "Papier",
    cat_glass: "Sklo",
    cat_organic: "Bioodpad",
    cat_garden: "Záhradný odpad",
    cat_bulky: "Objemný odpad",
    cat_hazardous: "Nebezpečný odpad",
    cat_textile: "Textil",
    cat_electronics: "Elektroodpad",
    cat_other: "Iné",
    entities: "Entity (senzory Waste Collection Schedule, kalendáre, dátumové senzory)",
    title_opt: "Názov (voliteľný)",
    show_title: "Zobraziť názov",
    show_subtitle: "Zobraziť podnázov",
    show_bins: "Zobraziť najbližší odvoz podľa nádoby",
    show_upcoming: "Zobraziť nadchádzajúce odvozy",
    max_items: "Počet zobrazených odvozov",
    days: "Dní dopredu (kalendáre)",
    tonight_from: "Zvýrazniť deň vopred od (hodina)",
    type_names: "Názvy nádob",
    type_names_source: "Ako ich uvádza zdroj",
    type_names_category: "Preložená kategória odpadu",
    collapsed: "Zbalené sekcie",
    zoom: "Tlačidlo podrobností",
    zoom_helper: "Prepne mini kartu na celú kartu a späť",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  cs: {
    title: "Svoz odpadu",
    next: "Nejbližší svoz",
    bins: "Podle nádoby",
    upcoming: "Nadcházející svozy",
    put_out_tonight: "Vystavit dnes večer",
    collection_today: "Svoz dnes",
    no_collection: "Žádný nadcházející svoz",
    no_entities: "Nebyla nalezena žádná entita svozu. Přidejte senzor Waste Collection Schedule, kalendář nebo datový senzor.",
    loading: "Načítání kalendáře…",
    zoom_in: "Zobrazit podrobnosti",
    zoom_out: "Zobrazit méně",
    cat_garbage: "Směsný odpad",
    cat_recycling: "Plasty a kovy",
    cat_paper: "Papír",
    cat_glass: "Sklo",
    cat_organic: "Bioodpad",
    cat_garden: "Zahradní odpad",
    cat_bulky: "Objemný odpad",
    cat_hazardous: "Nebezpečný odpad",
    cat_textile: "Textil",
    cat_electronics: "Elektroodpad",
    cat_other: "Ostatní",
    entities: "Entity (senzory Waste Collection Schedule, kalendáře, datové senzory)",
    title_opt: "Název (volitelný)",
    show_title: "Zobrazit název",
    show_subtitle: "Zobrazit podnázev",
    show_bins: "Zobrazit nejbližší svoz podle nádoby",
    show_upcoming: "Zobrazit nadcházející svozy",
    max_items: "Počet zobrazených svozů",
    days: "Dní dopředu (kalendáře)",
    tonight_from: "Zvýraznit den předem od (hodina)",
    type_names: "Názvy nádob",
    type_names_source: "Jak je uvádí zdroj",
    type_names_category: "Přeložená kategorie odpadu",
    collapsed: "Sbalené sekce",
    zoom: "Tlačítko podrobností",
    zoom_helper: "Přepne mini kartu na celou kartu a zpět",
    language: "Jazyk",
    lang_auto: "Automaticky",
  },
  sl: {
    title: "Odvoz odpadkov",
    next: "Naslednji odvoz",
    bins: "Po zabojnikih",
    upcoming: "Prihodnji odvozi",
    put_out_tonight: "Postavite ven nocoj",
    collection_today: "Odvoz danes",
    no_collection: "Ni prihodnjih odvozov",
    no_entities: "Ni najdene entitete odvoza. Dodajte senzor Waste Collection Schedule, koledar ali senzor datuma.",
    loading: "Nalaganje koledarja…",
    zoom_in: "Pokaži podrobnosti",
    zoom_out: "Pokaži manj",
    cat_garbage: "Mešani odpadki",
    cat_recycling: "Embalaža",
    cat_paper: "Papir",
    cat_glass: "Steklo",
    cat_organic: "Biološki odpadki",
    cat_garden: "Vrtni odpadki",
    cat_bulky: "Kosovni odpadki",
    cat_hazardous: "Nevarni odpadki",
    cat_textile: "Tekstil",
    cat_electronics: "Elektronika",
    cat_other: "Drugo",
    entities: "Entitete (senzorji Waste Collection Schedule, koledarji, senzorji datuma)",
    title_opt: "Naslov (neobvezno)",
    show_title: "Pokaži naslov",
    show_subtitle: "Pokaži podnaslov",
    show_bins: "Pokaži naslednji odvoz po zabojnikih",
    show_upcoming: "Pokaži prihodnje odvoze",
    max_items: "Število prikazanih odvozov",
    days: "Dni vnaprej (koledarji)",
    tonight_from: "Poudari dan prej od (ura)",
    type_names: "Imena zabojnikov",
    type_names_source: "Kot jih poda vir",
    type_names_category: "Prevedena kategorija odpadkov",
    collapsed: "Strnjeni razdelki",
    zoom: "Gumb za podrobnosti",
    zoom_helper: "Preklopi mini kartico na celotno kartico in nazaj",
    language: "Jezik",
    lang_auto: "Samodejno",
  },
  lv: {
    title: "Atkritumu izvešana",
    next: "Nākamā izvešana",
    bins: "Pēc konteinera",
    upcoming: "Gaidāmās izvešanas",
    put_out_tonight: "Iznest šovakar",
    collection_today: "Izvešana šodien",
    no_collection: "Nav gaidāmu izvešanu",
    no_entities: "Nav atrasta neviena izvešanas entītija. Pievienojiet Waste Collection Schedule sensoru, kalendāru vai datuma sensoru.",
    loading: "Ielādē kalendāru…",
    zoom_in: "Rādīt detaļas",
    zoom_out: "Rādīt mazāk",
    cat_garbage: "Sadzīves atkritumi",
    cat_recycling: "Šķirotie",
    cat_paper: "Papīrs",
    cat_glass: "Stikls",
    cat_organic: "Bioatkritumi",
    cat_garden: "Dārza atkritumi",
    cat_bulky: "Lielgabarīta",
    cat_hazardous: "Bīstamie atkritumi",
    cat_textile: "Tekstils",
    cat_electronics: "Elektronika",
    cat_other: "Citi",
    entities: "Entītijas (Waste Collection Schedule sensori, kalendāri, datuma sensori)",
    title_opt: "Virsraksts (neobligāts)",
    show_title: "Rādīt virsrakstu",
    show_subtitle: "Rādīt apakšvirsrakstu",
    show_bins: "Rādīt nākamo izvešanu pēc konteinera",
    show_upcoming: "Rādīt gaidāmās izvešanas",
    max_items: "Parādīto izvešanu skaits",
    days: "Dienas uz priekšu (kalendāri)",
    tonight_from: "Izcelt iepriekšējā dienā no (stunda)",
    type_names: "Konteineru nosaukumi",
    type_names_source: "Kā tos dod avots",
    type_names_category: "Tulkota atkritumu kategorija",
    collapsed: "Sakļautās sadaļas",
    zoom: "Detaļu poga",
    zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
    language: "Valoda",
    lang_auto: "Automātiski",
  },
  el: {
    title: "Αποκομιδή απορριμμάτων",
    next: "Επόμενη αποκομιδή",
    bins: "Ανά κάδο",
    upcoming: "Επερχόμενες αποκομιδές",
    put_out_tonight: "Βγάλτε τον απόψε",
    collection_today: "Αποκομιδή σήμερα",
    no_collection: "Καμία επερχόμενη αποκομιδή",
    no_entities: "Δεν βρέθηκε οντότητα αποκομιδής. Προσθέστε έναν αισθητήρα Waste Collection Schedule, ένα ημερολόγιο ή έναν αισθητήρα ημερομηνίας.",
    loading: "Φόρτωση ημερολογίου…",
    zoom_in: "Εμφάνιση λεπτομερειών",
    zoom_out: "Λιγότερα",
    cat_garbage: "Σύμμεικτα",
    cat_recycling: "Ανακύκλωση",
    cat_paper: "Χαρτί",
    cat_glass: "Γυαλί",
    cat_organic: "Βιοαπόβλητα",
    cat_garden: "Κλαδέματα",
    cat_bulky: "Ογκώδη",
    cat_hazardous: "Επικίνδυνα απόβλητα",
    cat_textile: "Ρούχα",
    cat_electronics: "Ηλεκτρονικά",
    cat_other: "Άλλα",
    entities: "Οντότητες (αισθητήρες Waste Collection Schedule, ημερολόγια, αισθητήρες ημερομηνίας)",
    title_opt: "Τίτλος (προαιρετικός)",
    show_title: "Εμφάνιση τίτλου",
    show_subtitle: "Εμφάνιση υπότιτλου",
    show_bins: "Εμφάνιση επόμενης αποκομιδής ανά κάδο",
    show_upcoming: "Εμφάνιση επερχόμενων αποκομιδών",
    max_items: "Εμφανιζόμενες αποκομιδές",
    days: "Ημέρες μπροστά (ημερολόγια)",
    tonight_from: "Επισήμανση την προηγούμενη από (ώρα)",
    type_names: "Ονόματα κάδων",
    type_names_source: "Όπως τα δίνει η πηγή",
    type_names_category: "Μεταφρασμένη κατηγορία αποβλήτων",
    collapsed: "Συμπτυγμένες ενότητες",
    zoom: "Κουμπί λεπτομερειών",
    zoom_helper: "Αλλάζει τη μίνι κάρτα στην πλήρη κάρτα και αντίστροφα",
    language: "Γλώσσα",
    lang_auto: "Αυτόματα",
  },
};

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: the card's language option, else HA's full locale (keeps its region) when its base matches the
// card language, else that language. A bare "pt" (HA's European Portuguese) becomes "pt-PT".
const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const cap = (s) => {
  const v = String(s ?? "").trim();
  return v.charAt(0).toLocaleUpperCase() + v.slice(1);
};

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

const pad = (n) => String(n).padStart(2, "0");
// Parts of a Date in a time zone (Home Assistant's own, when the user chose "server time zone"), else the browser's.
const ZONE_FMT = {};
const zoned = (d, tz) => {
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
const dayKey = (d, tz) => {
  const z = zoned(d, tz);
  return `${z.y}-${pad(z.m)}-${pad(z.d)}`;
};
// The time zone the dates are shown in: Home Assistant's when its profile says "server", else the browser's.
const zoneOf = (hass) => (hass?.locale?.time_zone === "server" && hass?.config?.time_zone) || undefined;
const keyDate = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (key, n) => {
  const d = keyDate(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
};
// Whole days from `from` to `to` (both "YYYY-MM-DD"), daylight saving time aside.
const daysBetween = (from, to) => {
  const [a, b] = [from, to].map((k) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86400000);
};
const validKey = (y, m, d) => {
  const key = `${y}-${pad(m)}-${pad(d)}`;
  const dt = keyDate(key);
  return dt.getFullYear() === Number(y) && dt.getMonth() === m - 1 && dt.getDate() === Number(d) ? key : null;
};

// A day from what the sources give: "2026-11-14", "2026-11-14 00:00:00", "2026-11-14T06:00:00+01:00" (converted to
// the day in `tz` when it carries a time zone), "14.11.2026" or "14/11/2026" (day first). null otherwise.
const parseDay = (v, tz) => {
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

const RTF = {};
const DTF = {};
// "today", "tomorrow", "in 3 days" in the card's language (Intl handles the plural forms and "the day after tomorrow").
const countdown = (days, locale) => cap((RTF[locale] ??= new Intl.RelativeTimeFormat(locale, { numeric: "auto" })).format(days, "day"));
const fmtDay = (key, locale, long = false) =>
  (DTF[`${locale}|${long}`] ??= new Intl.DateTimeFormat(locale, long ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" })).format(
    keyDate(key),
  );

// Countdown → state class (header icon, chip, tiles): today blue, tomorrow orange, later green, nothing grey.
const dayClass = (days) => (days === null || days === undefined ? "idle" : days <= 0 ? "active" : days === 1 ? "warn" : "ok");

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

// Attributes that are never a collection (Home Assistant's own and Waste Collection Schedule's generic ones).
const SKIP_ATTRS = new Set([
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
const splitTypes = (s) =>
  String(s ?? "")
    .split(/\s*[,;|]\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
const DAY_UNITS = /^(d|day|days|jour|jours|tag|tage|dia|dias|giorni|dagen|dage|dagar|dni|dní|dana|zile|nap|dienas|ημέρες|дн|дни|дней|днів|дана)$/i;

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
const sensorCollections = (s, today, { tz, wcs = false } = {}) => {
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
const eventDay = (start, tz) => parseDay(start?.date ?? start?.dateTime ?? start, tz);
// The summary of an event is split into several types ("Paper, Glass"), except for the calendars of Waste Collection
// Schedule (`split` false), whose events carry one type each, and whose names may hold a comma ("Papier, Pappe").
const calendarCollections = (events, { tz, split = true } = {}) =>
  (Array.isArray(events) ? events : []).flatMap((ev) => {
    const day = eventDay(ev?.start, tz);
    if (!day || !ev.summary) return [];
    return (split ? splitTypes(ev.summary) : [String(ev.summary).trim()]).map((raw) => ({ day, raw }));
  });

// A calendar's next event from its state, until its events have been fetched.
const calendarStateCollections = (s, { split = true } = {}) => {
  const a = s?.attributes || {};
  const day = parseDay(a.start_time);
  if (!day || !a.message || s.state === "unavailable") return [];
  return (split ? splitTypes(a.message) : [String(a.message).trim()]).map((raw) => ({ day, raw }));
};

// Entities of the card: the `entities` option ("sensor.x" or { entity, name, type, icon, color }), else every
// sensor and calendar of Waste Collection Schedule.
const entityConfs = (hass, config) => {
  const list = Array.isArray(config.entities) ? config.entities : config.entity ? [config.entity] : null;
  if (list) return list.map((e) => (typeof e === "string" ? { entity: e } : { ...e })).filter((e) => typeof e.entity === "string" && e.entity);
  return autoEntities(hass).map((entity) => ({ entity }));
};
// Read on every state change: computed once per entity registry (Home Assistant replaces the object when it changes).
const AUTO = new WeakMap();
const autoEntities = (hass) => {
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
  return [...AUTO.get(reg)];
};
const isWcs = (hass, id) => hass?.entities?.[id]?.platform === "waste_collection_schedule";

// A CSS color given in the configuration, kept only when it cannot break out of the style attribute.
const safeColor = (c) => (typeof c === "string" && /^[#\w\s(),.%-]+$/.test(c) ? c : null);

// Icon: one of ICONS (inline SVG), else Home Assistant's <ha-icon>.
const iconName = (icon) => String(icon || "").replace(/^mdi:/, "");
const svgIcon = (icon, cls = "") => {
  const name = iconName(icon);
  if (ICONS[name]) return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
  return `<ha-icon class="icon ${cls}" icon="${esc(String(icon).includes(":") ? icon : `mdi:${icon}`)}"></ha-icon>`;
};

// Type of a collection: { id, name, icon, color, category }. A `types` entry whose `match` (text or /regex/,
// case and accents ignored) fits the raw name wins, then the entity's own settings, then the category.
const matches = (raw, match) =>
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

const typeOf = (raw, conf, config, tr) => {
  const rule = (Array.isArray(config.types) ? config.types : []).find((r) => r && matches(raw, r.match ?? r.name));
  const cat = categoryByKey(rule?.category) || categoryByKey(conf.type) || categoryOf(raw);
  const name = rule?.name || conf.name || (config.type_names === "category" ? tr(`cat_${cat.key}`) : cap(raw) || tr(`cat_${cat.key}`));
  return {
    id: fold(name),
    name,
    category: cat.key,
    icon: rule?.icon || conf.icon || cat.icon,
    color: safeColor(rule?.color) || safeColor(conf.color) || cat.color,
  };
};

// ---------------------------------------------------------------------------
// Picture: the wheelie bins of the next collection, animated by what is due
// ---------------------------------------------------------------------------

// tonight: the bins roll to the kerb, wheels turning, under the moon; today: their lids lift (being emptied) and
// rings pulse around them. Every animation honours prefers-reduced-motion.
const SCENE_STYLE = `
  .scene { overflow: visible; }
  .scene .wheel, .scene .lid, .scene .roll, .scene .ring, .scene .star { transform-box: fill-box; }
  .scene .lid { transform-origin: 0% 100%; }
  .scene .wheel { transform-origin: center; }
  .scene .ring { transform-origin: center; opacity: 0; }
  .scene .moon, .scene .star { opacity: 0; }
  .scene.tonight .roll { animation: wc-roll 3s ease-in-out infinite; }
  .scene.tonight .wheel { animation: wc-spin 3s ease-in-out infinite; }
  .scene.tonight .moon { opacity: 1; }
  .scene.tonight .star { transform-origin: center; animation: wc-twinkle 1.5s ease-in-out infinite; }
  .scene.tonight .star.s2 { animation-delay: -.75s; }
  .scene.today .lid { animation: wc-lid 3s ease-in-out infinite; }
  .scene.today .b1 .lid { animation-delay: -.25s; } .scene.today .b2 .lid { animation-delay: -.5s; }
  .scene.today .ring { animation: wc-ring 1.5s ease-out infinite; }
  .scene.today .ring.r2 { animation-delay: -.75s; }
  @keyframes wc-roll { 0%, 100% { transform: translateX(-7px); } 50% { transform: translateX(7px); } }
  @keyframes wc-spin { 0%, 100% { transform: rotate(-160deg); } 50% { transform: rotate(160deg); } }
  @keyframes wc-twinkle { 0%, 100% { opacity: .2; transform: scale(.6); } 50% { opacity: 1; transform: scale(1); } }
  @keyframes wc-lid { 0%, 25%, 75%, 100% { transform: rotate(0); } 40%, 60% { transform: rotate(-40deg); } }
  @keyframes wc-ring { from { transform: scale(.55); opacity: .7; } to { transform: scale(1.15); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .scene * { animation: none !important; } }
`;

// One wheelie bin (44 × 66 at x, y) in the color of its type, with the type's icon on its front.
const binSvg = (type, x, y, i) => {
  const c = type.color;
  const dark = `color-mix(in srgb, ${c} 68%, #000)`;
  const glyph = ICONS[iconName(type.icon)] || ICONS[categoryByKey(type.category)?.icon] || ICONS["trash-can"];
  return `<g class="bin b${i}" transform="translate(${x} ${y})">
    <path d="M5 14h34l-3.6 46a3 3 0 0 1-3 2.8H11.6a3 3 0 0 1-3-2.8z" style="fill:${c}"/>
    <path d="M5 14h34l-.5 6H5.5z" fill="#000" opacity=".16"/>
    <path d="M10 22h3l-1.6 36h-2z" fill="#fff" opacity=".18"/>
    <path transform="translate(14 28) scale(.67)" d="${glyph}" fill="#fff" opacity=".92"/>
    <g class="lid"><path d="M2 8.5h40a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H2A1.5 1.5 0 0 1 .5 13v-3A1.5 1.5 0 0 1 2 8.5z" style="fill:${dark}"/>
      <rect x="34" y="5" width="9" height="4.5" rx="1.5" style="fill:${dark}"/></g>
    <g class="wheel"><circle cx="12" cy="61" r="5.5" fill="#2b2b2b"/><circle cx="12" cy="61" r="2" fill="#9e9e9e"/><rect x="11.4" y="56" width="1.2" height="10" fill="#9e9e9e"/></g>
  </g>`;
};

// The bins of the next collection (three at most), side by side; the state (tonight / today / '') sets the animation.
const sceneSvg = (types, state) => {
  const list = types.slice(0, 3);
  const n = Math.max(1, list.length);
  const w = 120;
  const gap = n === 1 ? 0 : n === 2 ? 46 : 36;
  const start = (w - 44 - gap * (n - 1)) / 2;
  const scale = n === 3 ? 0.86 : 1;
  const bins = list.map((ty, i) => binSvg(ty, start + gap * i, 38, i)).join("");
  return `<svg class="scene ${state}" viewBox="0 0 120 112" role="img" aria-hidden="true">
    <ellipse cx="60" cy="104" rx="${26 + 16 * (n - 1)}" ry="4" fill="#000" opacity=".12"/>
    <circle class="ring" cx="60" cy="70" r="50" fill="none" stroke="var(--wc-active)" stroke-width="2"/>
    <circle class="ring r2" cx="60" cy="70" r="50" fill="none" stroke="var(--wc-active)" stroke-width="2"/>
    <path class="moon" d="M102 6a11 11 0 1 0 10 15 9 9 0 0 1-10-15z" fill="#ffca28"/>
    <path class="star" d="M84 10l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#ffe082"/>
    <path class="star s2" d="M92 30l.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z" fill="#ffe082"/>
    <g class="roll"><g transform="translate(${(60 * (1 - scale)).toFixed(1)} ${(104 * (1 - scale)).toFixed(1)}) scale(${scale})">${bins}</g></g>
  </svg>`;
};

// ---------------------------------------------------------------------------
// Styles (same language as the other juju35 cards)
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --wc-accent: #43a047; --wc-ok: var(--success-color, #43a047); --wc-warn: var(--warning-color, #ffa600);
          --wc-crit: var(--error-color, #db4437); --wc-idle: var(--disabled-text-color, #9e9e9e); --wc-active: var(--info-color, #039be5); }
  /* Container queries follow the width the card is given (Sections view columns, mini card). */
  ha-card { overflow: hidden; container-type: inline-size; }
  /* A size container has no width of its own content: this empty, zero-height grid gives the card a natural width of
     --wc-natural-width without any minimum, so that it neither falls to its borders in a parent sized by its content
     nor refuses to shrink in a "1fr 1fr" grid. */
  :host { display: block; min-width: 0; --wc-natural-width: 360px; }
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, var(--wc-natural-width)); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; --mdc-icon-size: 18px; display: inline-flex; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, var(--wc-accent)); outline-offset: 2px; border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
  .ok { --c: var(--wc-ok); } .warn { --c: var(--wc-warn); } .crit { --c: var(--wc-crit); } .idle { --c: var(--wc-idle); } .active { --c: var(--wc-active); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--wc-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--wc-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--wc-ok)) 50%, var(--primary-text-color));
          flex: 0 1 auto; min-width: 0; max-width: 50%; overflow: hidden; box-sizing: border-box; }
  .chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  /* The status chip sits on the title line (the titles block is centered on the 40 px icon). */
  .header.two-lines .chip { align-self: flex-start; margin-top: 4px; }
  .type-icon { position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; flex: none; align-items: center; justify-content: center;
               --wc-tint: var(--c, var(--wc-accent)); background: color-mix(in srgb, var(--wc-tint) 16%, transparent); transition: background-color .3s ease; }
  .type-icon .icon { width: 24px; height: 24px; --mdc-icon-size: 24px; fill: color-mix(in srgb, var(--wc-tint) 60%, var(--primary-text-color)); transition: fill .3s ease; }
  .titles { flex: 1 1 0; min-width: 5ch; }
  :host([hide-title]) .titles > .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--wc-warn) 50%, var(--primary-text-color)); }
  .picture { flex: none; display: flex; align-items: center; justify-content: center; }
  .picture svg { width: 100%; height: 100%; }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .when { font-size: 26px; font-weight: 400; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  .line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .line .icon { width: 16px; height: 16px; --mdc-icon-size: 16px; }
  .alert-line { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; min-width: 0;
                color: color-mix(in srgb, var(--c, var(--wc-warn)) 50%, var(--primary-text-color)); }
  .alert-line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .alert-line .icon { width: 16px; height: 16px; --mdc-icon-size: 16px; color: var(--c, var(--wc-warn)); }
  .types { display: flex; flex-wrap: wrap; gap: 4px; min-width: 0; }
  .type { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; padding: 2px 8px 2px 4px; border-radius: 10px; max-width: 100%; box-sizing: border-box;
          background: color-mix(in srgb, var(--tc) 14%, transparent); color: var(--primary-text-color); white-space: nowrap; min-width: 0; }
  .type span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  /* The type's color, drawn toward the text color so that dark bins (grey, brown) stay readable in a dark theme. */
  .type .icon { width: 14px; height: 14px; --mdc-icon-size: 14px; color: color-mix(in srgb, var(--tc) 72%, var(--primary-text-color)); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--wc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, var(--wc-accent)); outline-offset: 1px; }
  .empty { font-size: 13px; color: var(--secondary-text-color); padding: 4px 0; }
  /* Narrow card: the status chip keeps only its colored dot (its text stays in title and aria-label). */
  @container (max-width: 230px) {
    .chip { padding: 4px; flex: none; }
    .chip-text { display: none; }
  }
  @container (max-width: 200px) { .header { gap: 6px; } }
  ${SCENE_STYLE}
`;

const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .hero { display: flex; gap: 12px; align-items: center; }
  .picture { width: 104px; height: 96px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; --mdc-icon-size: 16px; }
  .section-title span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .section-title.toggle { cursor: pointer; user-select: none; }
  .section-title.toggle[aria-expanded="false"] { margin-bottom: 0; }
  .section-title .chevron { margin-left: auto; width: 16px; height: 16px; transition: transform .2s ease; }
  .section-title.toggle[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 6px; }
  .tile { display: flex; align-items: center; gap: 8px; padding: 6px 10px 6px 6px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .badge { width: 30px; height: 30px; border-radius: 50%; flex: none; display: grid; place-items: center;
                 background: color-mix(in srgb, var(--tc) 18%, transparent); }
  .tile .badge .icon { width: 18px; height: 18px; color: color-mix(in srgb, var(--tc) 72%, var(--primary-text-color)); }
  .tile .txt { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .tile .k { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile .v { font-size: 14px; font-weight: 500; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile.active .v, .tile.warn .v { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); }
  .tile.active, .tile.warn { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 45%, transparent); }
  .list { display: flex; flex-direction: column; gap: 6px; }
  .row { display: grid; grid-template-columns: 92px minmax(0, 1fr) auto; align-items: center; gap: 8px; font-size: 12px; }
  .row .d { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .in { color: var(--secondary-text-color); white-space: nowrap; text-align: right; }
  .row.active .in, .row.warn .in { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); font-weight: 500; }
  /* Narrow card (6 of 12 columns, ~240 px and below): the picture shrinks, the countdown moves under the date. */
  @container (max-width: 300px) {
    .picture { width: 72px; height: 66px; }
    .hero { gap: 10px; }
    .when { font-size: 22px; }
    .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .tile { padding: 6px 8px; }
    .tile .badge { display: none; }
    .list { gap: 10px; }
    .row { grid-template-columns: minmax(0, 1fr) auto; row-gap: 4px; }
    .row .types { grid-column: 1 / -1; grid-row: 2; }
  }
  @container (max-width: 200px) {
    .picture { width: 56px; height: 52px; }
    .when { font-size: 18px; }
  }
`;

const MINI_STYLE = `
  :host { --wc-natural-width: 300px; }
  .content { padding: 8px 12px 12px; }
  .hero { display: flex; align-items: center; gap: 12px; }
  .picture { width: 72px; height: 66px; }
  .when { font-size: 20px; }
  @container (max-width: 200px) { .picture { display: none; } }
`;

// Element names of Home Assistant dialogs (more-info opened from the card, among others).
const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. It counts when the press and the release are both outside the card (a slider dragged out of the card
// does not fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through
// the click event.
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOutside(card, ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOutside(card, ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOutside(card, ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};

const sameDeps = (a, b) => !!a && a.length === b.length && a.every((d, i) => d === b[i]);
const CAL_REFRESH_MS = 3600000;
const DEFAULT_DAYS = 60;
const DEFAULT_ITEMS = 6;

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

class WasteBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._cal = {};
    this._calVersion = 0;
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // No rewrite of the card between the press and the release: Home Assistant updates the card several times a
    // second, and a rewrite under the pointer replaces the element pressed, so that the click lands on the card itself
    // and does nothing. The pending render is done once released (after the click). The focus is only kept across
    // rewrites for the keyboard: put back after a mouse click or a tap, it would draw the focus ring.
    this.shadowRoot.addEventListener("pointerdown", () => {
      this._byPointer = true;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    // Enter / Space on an element with the button role acts as a click, as on a <button>.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      this._byPointer = false;
      if ((ev.key !== "Enter" && ev.key !== " ") || ev.target?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      ev.target.click();
    });
  }

  set hass(hass) {
    this._hass = hass;
    const deps = this._deps();
    if (deps && sameDeps(this._lastDeps, deps)) return;
    this._lastDeps = deps;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  // What a render reads: the language, the state objects of the entities, the calendar events, the day and whether
  // the evening highlight has started (both move on their own), and the hour (calendars are read again hourly).
  _deps() {
    const h = this._hass;
    if (!h || !this._config) return null;
    const ids = entityConfs(h, this._config).map((e) => e.entity);
    const now = zoned(new Date(), zoneOf(h));
    return [
      h.entities,
      h.language,
      h.locale,
      h.config?.time_zone,
      this._calVersion,
      this._today(),
      now.h >= this._tonightFrom(),
      Math.floor(Date.now() / CAL_REFRESH_MS),
      ...ids.map((id) => h.states[id]),
    ];
  }

  // Today, in the time zone the dates are shown in.
  _today() {
    return dayKey(new Date(), zoneOf(this._hass));
  }

  connectedCallback() {
    // A click elsewhere on the page folds the sections back to their defaults (clicks in a dialog opened from the card
    // leave them as they are).
    this._onOutside ??= (ev) => {
      if (!this._toggled?.size || !isOutside(this, ev)) return;
      this._toggled = new Map();
      this._update();
    };
    (this._outside ??= watchOutside(this, (ev) => this._onOutside(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    if (this._hass && this._config) this._update();
    // The countdown and the evening highlight move with the clock: re-checked every minute.
    clearInterval(this._tick);
    this._tick = setInterval(() => {
      if (this._hass) this.hass = this._hass;
    }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    this._tick = null;
    this._outside?.off();
    this._pressing = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded or with its popup open.
    this._toggled = new Map();
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._lastDeps = null;
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  // Hour from which a collection due tomorrow is shown as "put out tonight" (0: the whole day before).
  _tonightFrom() {
    const h = Number(this._config?.tonight_from ?? 0);
    return Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 0;
  }

  _update() {
    if (!this._hass || !this._config) return;
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    this._syncCalendars();
    const html = this._render();
    if (html !== this._html) {
      const focused = this._byPointer ? null : this._focusedSpot();
      this._html = html;
      this.shadowRoot.innerHTML = html;
      if (focused) this._restoreFocus(focused);
    }
  }

  // The focused element (keyboard user), found again after a re-render by its data attributes.
  _focusedSpot() {
    const el = this.shadowRoot.activeElement;
    if (!el?.dataset) return null;
    const data = JSON.stringify({ ...el.dataset });
    return data === "{}" ? null : data;
  }

  _restoreFocus(data) {
    for (const n of this.shadowRoot.querySelectorAll("[data-action], [data-entity]"))
      if (JSON.stringify({ ...n.dataset }) === data) return n.focus({ preventScroll: true });
  }

  // Calendar events are fetched once, again when the calendar's state changes (its next event moved) or after an hour.
  _syncCalendars() {
    const h = this._hass;
    for (const { entity } of entityConfs(h, this._config)) {
      if (!entity.startsWith("calendar.")) continue;
      const s = h.states[entity];
      const key = `${s?.last_updated ?? s?.state}|${this._today()}|${this._days()}`;
      const c = this._cal[entity];
      if (c && (c.loading || (c.key === key && Date.now() - c.at < CAL_REFRESH_MS))) continue;
      this._cal[entity] = { ...c, key, at: Date.now(), loading: true };
      this._fetchCalendar(entity).then((events) => {
        this._cal[entity] = { key, at: Date.now(), loading: false, events: events ?? c?.events ?? null };
        this._calVersion++;
        if (this._hass) this.hass = this._hass;
      });
    }
  }

  _days() {
    const d = Number(this._config.days ?? DEFAULT_DAYS);
    return Number.isFinite(d) && d > 0 ? Math.min(d, 400) : DEFAULT_DAYS;
  }

  // The REST API (GET /api/calendars/<entity>) first, then the calendar.get_events action over the WebSocket.
  // null when neither answers (the calendar's state still gives its next event).
  async _fetchCalendar(entity) {
    const h = this._hass;
    // From the day before (the browser's midnight may come before Home Assistant's): past days are left out later.
    const start = keyDate(addDays(this._today(), -1));
    const end = new Date(start);
    end.setDate(end.getDate() + this._days() + 1);
    try {
      if (typeof h.callApi === "function") {
        const events = await h.callApi("GET", `calendars/${entity}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`);
        if (Array.isArray(events)) return events;
      }
    } catch (_err) {
      /* try the WebSocket */
    }
    try {
      if (typeof h.callWS === "function") {
        const r = await h.callWS({
          type: "call_service",
          domain: "calendar",
          service: "get_events",
          target: { entity_id: entity },
          service_data: { start_date_time: start.toISOString(), end_date_time: end.toISOString() },
          return_response: true,
        });
        const events = r?.response?.[entity]?.events;
        if (Array.isArray(events)) return events;
      }
    } catch (_err) {
      /* the state's next event stays */
    }
    return null;
  }

  // Every collection from today on, sorted: [{ day, days, type, entity }], one per day and type.
  _collections() {
    const h = this._hass;
    const today = this._today();
    const tz = zoneOf(h);
    const tr = (k) => this._t(k);
    const seen = new Map();
    for (const conf of entityConfs(h, this._config)) {
      const s = h.states[conf.entity];
      const wcs = isWcs(h, conf.entity);
      let items;
      if (conf.entity.startsWith("calendar.")) {
        const ev = this._cal[conf.entity]?.events;
        items = ev ? calendarCollections(ev, { tz, split: !wcs }) : calendarStateCollections(s, { split: !wcs });
      } else items = sensorCollections(s, today, { tz, wcs });
      for (const { day, raw } of items) {
        const days = daysBetween(today, day);
        if (days < 0) continue;
        const type = typeOf(raw, conf, this._config, tr);
        const key = `${day}|${type.id}`;
        if (!seen.has(key)) seen.set(key, { day, days, type, entity: conf.entity });
      }
    }
    return [...seen.values()].sort((a, b) => a.day.localeCompare(b.day) || a.type.name.localeCompare(b.type.name));
  }

  _loading() {
    return Object.values(this._cal).some((c) => c.loading && !c.events);
  }

  // The collections of the next collection day.
  _next(list) {
    return list.length ? list.filter((c) => c.day === list[0].day) : [];
  }

  // tonight: due tomorrow and the evening highlight has started; today: due today.
  _due(next) {
    const d = next[0]?.days;
    if (d === 0) return "today";
    if (d === 1 && zoned(new Date(), zoneOf(this._hass)).h >= this._tonightFrom()) return "tonight";
    return "";
  }

  _onClick(ev) {
    this._pressing = false;
    if (ev.detail === 0) this._byPointer = false;
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!el) return;
    ev.stopPropagation();
    const { action, entity } = el.dataset;
    if (action === "zoom") return this._toggleZoom(ev);
    if (action === "toggle_section") {
      const key = el.dataset.section;
      this._toggled = new Map(this._toggled).set(key, !this._isCollapsed(key));
      return this._update();
    }
    if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
  }

  _isCollapsed(key) {
    if (this._toggled?.has(key)) return this._toggled.get(key);
    const c = this._config.collapsed ?? [];
    return (Array.isArray(c) ? c : [c]).includes(key);
  }

  _zoomButton() {
    return "";
  }

  _header(next, sub) {
    const c = this._config;
    const days = next[0]?.days ?? null;
    const cls = dayClass(days);
    const text = days === null ? this._t("no_collection") : countdown(days, this._locale());
    const chip = next.length
      ? `<span class="chip clickable ${cls}" role="button" tabindex="0" data-entity="${esc(next[0].entity)}" title="${esc(text)}" aria-label="${esc(text)}"><span class="dot"></span><span class="chip-text">${esc(text)}</span></span>`
      : "";
    const two = sub && c.show_subtitle !== false && c.show_title !== false;
    return `
      <div class="header${two ? " two-lines" : ""}">
        <div class="type-icon ${cls}">${svgIcon("trash-can")}</div>
        <div class="titles">
          <div class="name">${esc(c.title || this._t("title"))}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>
        ${chip}
        ${this._zoomButton()}
      </div>`;
  }

  _errorCard(key) {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(this._t(key))}</div></ha-card>`;
  }

  _typeChip(type) {
    return `<span class="type" style="--tc:${type.color}">${svgIcon(type.icon)}<span>${esc(type.name)}</span></span>`;
  }

  // Picture, countdown, highlight and the types of the next collection.
  _hero(next) {
    const loc = this._locale();
    if (!next.length) {
      return `<div class="hero"><div class="picture">${sceneSvg([{ ...OTHER, name: "" }], "")}</div><div class="info"><div class="empty">${esc(this._t(this._loading() ? "loading" : "no_collection"))}</div></div></div>`;
    }
    const due = this._due(next);
    const cls = dayClass(next[0].days);
    const alert = due
      ? `<div class="alert-line ${cls}">${svgIcon(due === "today" ? "truck" : "weather-night")}<span>${esc(this._t(due === "today" ? "collection_today" : "put_out_tonight"))}</span></div>`
      : "";
    return `<div class="hero">
        <div class="picture clickable" role="button" tabindex="0" aria-label="${esc(next.map((c) => c.type.name).join(", "))}" data-entity="${esc(next[0].entity)}">${sceneSvg(
          next.map((c) => c.type),
          due,
        )}</div>
        <div class="info">
          <div class="when">${esc(countdown(next[0].days, loc))}</div>
          ${alert}
          <div class="types">${next.map((c) => this._typeChip(c.type)).join("")}</div>
          <div class="line">${svgIcon("calendar")}<span>${esc(cap(fmtDay(next[0].day, loc, true)))}</span></div>
        </div>
      </div>`;
  }
}

class WasteCard extends WasteBase {
  static getConfigElement() {
    return document.createElement("waste-card-editor");
  }

  static getStubConfig(hass) {
    const ids = autoEntities(hass);
    return ids.length ? { entities: ids } : {};
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _sectionTitle(key, icon, label) {
    const closed = this._isCollapsed(key);
    return `<div class="section-title toggle" role="button" tabindex="0" data-action="toggle_section" data-section="${key}" aria-expanded="${!closed}">${svgIcon(icon)}<span>${esc(
      label,
    )}</span>${svgIcon("chevron-down", "chevron")}</div>`;
  }

  // Next collection of every bin type.
  _bins(list) {
    const loc = this._locale();
    const byType = new Map();
    for (const c of list) if (!byType.has(c.type.id)) byType.set(c.type.id, c);
    if (!byType.size) return "";
    const closed = this._isCollapsed("bins");
    const tiles = [...byType.values()]
      .map((c) => {
        const label = `${c.type.name}: ${countdown(c.days, loc)}`;
        return `<div class="tile clickable ${dayClass(c.days)}" role="button" tabindex="0" aria-label="${esc(label)}" data-entity="${esc(c.entity)}" style="--tc:${c.type.color}">
          <span class="badge">${svgIcon(c.type.icon)}</span>
          <div class="txt"><div class="k">${esc(c.type.name)}</div><div class="v">${esc(countdown(c.days, loc))}</div><div class="k">${esc(fmtDay(c.day, loc))}</div></div>
        </div>`;
      })
      .join("");
    return `<div>${this._sectionTitle("bins", "delete-empty", this._t("bins"))}${closed ? "" : `<div class="tiles">${tiles}</div>`}</div>`;
  }

  // The next collection days and their types.
  _upcoming(list) {
    const loc = this._locale();
    const max = Number(this._config.max_items ?? DEFAULT_ITEMS);
    const days = [...new Set(list.map((c) => c.day))].slice(0, Number.isFinite(max) && max > 0 ? max : DEFAULT_ITEMS);
    if (!days.length) return "";
    const closed = this._isCollapsed("upcoming");
    const rows = days
      .map((day) => {
        const items = list.filter((c) => c.day === day);
        return `<div class="row clickable ${dayClass(items[0].days)}" role="button" tabindex="0" data-entity="${esc(items[0].entity)}">
          <span class="d">${esc(fmtDay(day, loc))}</span>
          <div class="types">${items.map((c) => this._typeChip(c.type)).join("")}</div>
          <span class="in">${esc(countdown(items[0].days, loc))}</span>
        </div>`;
      })
      .join("");
    return `<div>${this._sectionTitle("upcoming", "calendar-clock", this._t("upcoming"))}${closed ? "" : `<div class="list">${rows}</div>`}</div>`;
  }

  _render() {
    if (!entityConfs(this._hass, this._config).length) return this._errorCard("no_entities");
    const c = this._config;
    const list = this._collections();
    const next = this._next(list);
    const parts = [this._hero(next)];
    if (c.show_bins !== false) parts.push(this._bins(list));
    if (c.show_upcoming !== false) parts.push(this._upcoming(list));
    const sub = next.length ? `${this._t("next")} · ${cap(fmtDay(next[0].day, this._locale()))}` : "";
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card>
        ${this._header(next, sub)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }
}

// The mini card shows the next collection only; its detail button (top right, `zoom: false` removes it) switches it
// to the full card's content and back, and a click anywhere else on the page brings the compact view back.
class WasteMiniCard extends WasteCard {
  constructor() {
    super();
    this._onUnzoom = (ev) => {
      if (this._zoomed && isOutside(this, ev)) this._setZoom(false);
    };
  }

  static getConfigElement() {
    return document.createElement("waste-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    (this._unzoom ??= watchOutside(this, (ev) => this._onUnzoom(ev))).on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom?.off();
    // Back to the compact view once off the screen (see the full card).
    this._zoomed = false;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 2;
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? "arrow-collapse" : "arrow-expand")}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
    this.dispatchEvent(new CustomEvent("iron-resize", { bubbles: true, composed: true }));
  }

  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _render() {
    if (this._zoomed) return super._render();
    if (!entityConfs(this._hass, this._config).length) return this._errorCard("no_entities");
    const next = this._next(this._collections());
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        ${this._header(next, next.length ? this._t("next") : "")}
        <div class="content">${this._hero(next)}</div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

const LANGUAGES = [
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

// Editor labels whose translation key differs from the option name.
const LABELS = { title: "title_opt" };

class WasteEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [
      ["show_title", true],
      ["show_subtitle", true],
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
      { name: "tonight_from", selector: { number: { min: 0, max: 23, mode: "box", unit_of_measurement: "h" } } },
      ...this.constructor.extraFields(tr),
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
        const defaults = { ...Object.fromEntries(toggles), type_names: "source", tonight_from: 0, days: DEFAULT_DAYS, max_items: DEFAULT_ITEMS, collapsed: [] };
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
    const data = { type_names: "source", tonight_from: 0, days: DEFAULT_DAYS, max_items: DEFAULT_ITEMS, collapsed: [], ...this._config };
    data.entities = entityConfs(this._hass, this._config).map((e) => e.entity);
    for (const [name, def] of toggles) if (data[name] === undefined) data[name] = def;
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

class WasteCardEditor extends WasteEditorBase {
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

class WasteMiniCardEditor extends WasteEditorBase {
  static get toggles() {
    return [...WasteEditorBase.toggles, ["zoom", true]];
  }

  static extraFields() {
    return [{ name: "days", selector: { number: { min: 1, max: 400, mode: "box", unit_of_measurement: "d" } } }];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
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
