// Mock Home Assistant data for the screenshots and the tests: one Waste Collection Schedule sensor (details_format
// `upcoming`), its calendar, and a template sensor whose state is a date. Neutral names only.
// Every capture is taken on Friday 13 November 2026 at 18:30 (UTC): the recycling and glass bins are due tomorrow.
export const NOW = "2026-11-13T18:30:00Z";

export const entities = {
  "sensor.waste_collection": { entity_id: "sensor.waste_collection", platform: "waste_collection_schedule", device_id: "wcs" },
  "calendar.waste_collection": { entity_id: "calendar.waste_collection", platform: "waste_collection_schedule", device_id: "wcs" },
  "sensor.bulky_waste": { entity_id: "sensor.bulky_waste", platform: "template" },
};

const wcs = (upcoming) => ({
  entity_id: "sensor.waste_collection",
  state: "",
  attributes: { ...upcoming, attribution: "Last update: 11/13/26 06:00:00", friendly_name: "Waste collection", icon: "mdi:trash-can" },
});

export const upcoming = {
  "2026-11-14": "Recycling, Glass",
  "2026-11-17": "General waste",
  "2026-11-19": "Organic waste",
  "2026-11-21": "Paper",
  "2026-11-24": "General waste",
  "2026-11-26": "Organic waste",
  "2026-12-01": "General waste, Garden waste",
};

export const states = {
  "sensor.waste_collection": { ...wcs(upcoming), state: "Recycling, Glass in 1 days" },
  "sensor.bulky_waste": {
    entity_id: "sensor.bulky_waste",
    state: "2026-12-08",
    attributes: { device_class: "date", friendly_name: "Bulky waste", icon: "mdi:sofa" },
  },
  "calendar.waste_collection": {
    entity_id: "calendar.waste_collection",
    state: "off",
    last_updated: "2026-11-13T06:00:00Z",
    attributes: { message: "Household waste", all_day: true, start_time: "2026-11-16 00:00:00", end_time: "2026-11-17 00:00:00", friendly_name: "Waste calendar" },
  },
};

// Events of the calendar, as GET /api/calendars/calendar.waste_collection returns them.
export const calendarEvents = {
  "calendar.waste_collection": [
    ["2026-11-16", "Household waste"],
    ["2026-11-18", "Packaging"],
    ["2026-11-20", "Paper"],
    ["2026-11-23", "Household waste"],
    ["2026-11-25", "Food waste"],
    ["2026-11-27", "Glass"],
    ["2026-12-04", "Household waste"],
    ["2026-12-04", "Packaging"],
    ["2027-01-08", "Christmas trees"],
  ].map(([date, summary]) => ({ summary, start: { date }, end: { date } })),
};

// The general waste is collected this very day (the bins' lids lift, rings pulse).
export const today = {
  "sensor.waste_collection": { ...wcs({ "2026-11-13": "General waste", ...upcoming }), state: "General waste in 0 days" },
};
