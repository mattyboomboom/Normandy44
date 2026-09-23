# Normandy 1944: an animated atlas

An interactive map of the Normandy campaign, from the eve of D-Day (5 June 1944) to the crossing of the Seine at the end of August. It opens on the globe, closes in on the Channel coast, lands on the five beaches, and then follows the Allied area of control as it spreads across Normandy through 18 key moments: the airborne drops, Omaha, the link-up, the storm, Cherbourg, Caen, Goodwood, Cobra, Avranches, Mortain, the Falaise pocket, the liberation of Paris and the end of the battle.

Each moment has an info panel with context and approximate troop numbers by army and by area.

## Running it

Built with [Astro](https://astro.build) and TypeScript, rendered with d3. Needs Node 22.12 or newer.

```sh
npm install
npm run dev        # local dev server at http://localhost:4321
npm run build      # static site in dist/
npm run preview    # serve the built site
npm run check      # type-check
```

## Deploying

The site is static and deploys to Vercel as-is: import the GitHub repo in Vercel, keep the detected **Astro** framework preset and the default build settings. Every push to a branch gets a preview URL; `main` goes to production. `vercel.json` sets long cache lifetimes for the hashed assets and the map data.

## Project layout

```
src/
  pages/index.astro     page markup (map SVG, counter, panel, legend, timeline)
  atlas/main.ts         camera, layers, overlays, panel, timeline, playback
  atlas/geo.ts          loads and decodes the base map
  atlas/rings.ts        resampling of the areas of control for morphing
  data/scenes.ts        the 18 moments: text, figures, events, arrows, camera
  data/areas.ts         outlines of each landing force's area of control over time
  data/places.ts        town and sea labels with the zoom level they appear at
  data/*.ts             nation colours, hand-traced rivers, troops-ashore series, types
  styles/               atlas styles and self-hosted fonts
  fonts/                woff2 files (Latin subsets)
public/data/geo.topo.json   base map, generated (see below)
data-src/geo.json           base map source (GeoJSON)
scripts/                    build and test tooling
prototype/index.html        the original single-file prototype, kept for reference
tests/visual/baseline/      screenshots of every moment from the prototype
```

To edit the story, change `src/data/scenes.ts`. To change the base map, edit `data-src/geo.json` and run `npm run geo` to regenerate `public/data/geo.topo.json` (lossless: coordinates are kept to 4 decimal places).

## Visual regression check

`tests/visual/baseline/` holds a screenshot of every moment, desktop and mobile, taken from the original prototype. To check the site still looks the same:

```sh
npx playwright install chromium   # first time only
npm run build && npm run preview  # in one terminal
npm run shots -- http://localhost:4321/ tests/visual/current
npm run compare -- tests/visual/baseline tests/visual/current
```

`compare` prints the share of pixels that differ per screenshot and writes diff images to `tests/visual/diff/`. The baseline was captured on Linux Chromium, so on a Mac expect small anti-aliasing differences across the board; big localised differences are the ones to look at.

## Controls

- **Play** runs through the campaign automatically; press again to pause.
- **Arrows** (on screen or ← / → keys) step one moment at a time; Space toggles play; Home / End jump to the start or finish.
- Click any point on the timeline to jump there.
- Drag to pan and scroll or pinch to zoom; stepping to another moment resets the view.
- Click an event marker on the map for a short note about it.
- Each moment has its own link, e.g. `/#scene=12` opens Operation Cobra.

## Sources and caveats

Front lines and areas of control are simplified from period situation maps and are approximate, drawn to show the shape of the campaign rather than the exact line on a given day. Troop, casualty and supply figures are rounded, widely cited totals (US Army and Commonwealth official histories, the D-Day Story and Juno Beach Centre figures, among others); sources differ, and German losses in particular are estimates.

Map data: Natural Earth (public domain), and the French coastline from france-geojson (derived from IGN / INSEE open data). Rendering: d3 v7. Fonts: Big Shoulders Stencil Display and Source Serif 4 (SIL Open Font License), self-hosted from Fontsource.
