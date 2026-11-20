# Changelog

## 1.2.2 - 2026-11-20

### Fixes
- The frosted expand / collapse button of the illustrated header keeps its blur on Safari before 18 (WebKit prefix).
- Without Waste Collection Schedule, the card picker offers a working card: a calendar or a date sensor that looks like waste collection (by its id or name, in the card's languages), else the first calendar, instead of the "no entities" warning.
- The discovered entities are no longer copied at each state change (shared read-only list).

### Maintenance
- Tests: the coverage of the card source is now measured (`node --test --experimental-test-coverage`).
- README: the `entity` shorthand option is documented.

## 1.2.1 - 2026-11-18

### Fixes
- Illustrated header: `auto` now follows the Home Assistant theme alone — a light theme keeps the day picture after sunset, a dark theme still shows the night one.

## 1.2.0 - 2026-11-17

### Features
- Illustrated header on the full and the mini card (90 px): the card's own bins of the next collection, in their colors and shape, stand in front of a hedge above a 10 px road strip, with the title and the state of the collection (*Today*, *Tomorrow · Glass, Recycling*, *Put out tonight*) on the sky. The round icon and the state line take the state's color, a glow lights up under the bins due today or tomorrow (pulsing today), and the existing animations play in the scene (lids lifting today, bins rolling the evening before).
- Night picture when `sun.sun` is below the horizon or with Home Assistant's dark theme (even while the sun is up), forced with `illustration_theme: day | night`; `illustration: false` keeps the classic header. Both options are in the visual editors, translated in every language.
- The state of the collection is a status pill (dot and label in the icon's colour on a frosted tint), placed by measurement in every language: right after the title only when the whole title and the whole label fit there, otherwise on its own line under the title (or the subtitle, then kept to one line); when the label would still be cut or leave the banner above its road strip, and on a card of 200 px or less, only its dot shows (label kept for screen readers). On narrower cards the bins and hedge are drawn smaller (80 %, then 70 %), and from 270 px down the road strip stays alone (the bins are the hero's big line), so that the title stays whole and the pill keeps its label. The mini card's expand / collapse button is a 24 px frosted round button 5 px from the banner's top right corner.
- Illustrated header: the hero no longer repeats the countdown of the status pill ("Tomorrow" + "Put out tonight") nor the full card's subtitle the bins: its big line is the bins to put out, as large chips, then the date; on a card so narrow that the pill keeps only its dot, its text comes back as a line in the hero.

## 1.1.0 - 2026-11-14

### Features
- Bin shape: `bin_shape` draws the bins as a rolled-out wheelie bin (default), a flat-lid bin, a cylindrical can or a North-American roll-out cart; also in the visual editor.
- Bin colors per waste category: `colors` (a map of category key to a CSS color) recolours whole categories, for towns whose bin colors differ from the defaults; a `types` entry or an entity `color` still wins over it. The color of each category is also set in the visual editor.

## 1.0.2 - 2026-11-14

### Fixes
- Mini card visual editor: the options of the full card shown in its detailed view (`show_bins`, `show_upcoming`, `max_items`, `collapsed`) can now be set there too.
- README: `types` is marked YAML only (the visual editor keeps it).

## 1.0.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so the unfolded sections of the card and the detailed view of the mini card stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state: sections folded as configured, mini card compact.
- A click could do nothing: Home Assistant updates the card several times a second, and a rewrite of the card between the press and the release replaced the element pressed, so that the click was lost. The card is no longer rewritten while a press is in progress; the pending update is drawn right after the click.
- No focus ring after a mouse click or a tap: the focus is kept across updates only for the keyboard.

## 1.0.0 - 2026-11-13

### Features
- `custom:waste-card`: next collection with drawn wheelie bins in the color of their type, countdown (today / tomorrow / in N days) and date; "Put out tonight" highlight the day before (`tonight_from`) and "Collection today" on the day; next collection per bin type; list of the next collection days (`max_items`); collapsible sections (`collapsed`), folded back by a click elsewhere.
- `custom:waste-mini-card`: next collection only, with a detail button switching to the full card and back (`zoom`).
- Sources: Waste Collection Schedule sensors (every `details_format`, or the state) and calendars, found automatically; any calendar entity (REST API, or the `calendar.get_events` action); any sensor whose state is a date, a timestamp or a number of days.
- Waste categories recognized in many languages (household, recycling, paper, glass, organic, garden, bulky, hazardous, textiles, electronics), giving the default icon and color; own name, category, icon and color per type (`types`) or per entity; type names as given by the source or translated (`type_names`).
- Animations: the bins roll to the kerb under the moon the evening before a collection, their lids lift with pulsing rings on collection day; `prefers-reduced-motion` honoured.
- Visual editors for both cards; light and dark themes; 22 languages, every language but English loaded on demand.
