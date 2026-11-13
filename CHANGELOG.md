# Changelog

## 1.0.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so the unfolded sections of the card and the detailed view of the mini card stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state: sections folded as configured, mini card compact.

## 1.0.0 - 2026-11-13

### Features
- `custom:waste-card`: next collection with drawn wheelie bins in the color of their type, countdown (today / tomorrow / in N days) and date; "Put out tonight" highlight the day before (`tonight_from`) and "Collection today" on the day; next collection per bin type; list of the next collection days (`max_items`); collapsible sections (`collapsed`), folded back by a click elsewhere.
- `custom:waste-mini-card`: next collection only, with a detail button switching to the full card and back (`zoom`).
- Sources: Waste Collection Schedule sensors (every `details_format`, or the state) and calendars, found automatically; any calendar entity (REST API, or the `calendar.get_events` action); any sensor whose state is a date, a timestamp or a number of days.
- Waste categories recognized in many languages (household, recycling, paper, glass, organic, garden, bulky, hazardous, textiles, electronics), giving the default icon and color; own name, category, icon and color per type (`types`) or per entity; type names as given by the source or translated (`type_names`).
- Animations: the bins roll to the kerb under the moon the evening before a collection, their lids lift with pulsing rings on collection day; `prefers-reduced-motion` honoured.
- Visual editors for both cards; light and dark themes; 22 languages, every language but English loaded on demand.
