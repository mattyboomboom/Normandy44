# Normandy 1944: an animated atlas

An interactive map of the Normandy campaign, from the eve of D-Day (5 June 1944) to the crossing of the Seine at the end of August. It opens on the globe, closes in on the Channel coast, lands on the five beaches, and then follows the Allied area of control as it spreads across Normandy through 21 moments: Montgomery's plan, the airborne drops, Omaha, the link-up, the storm, Cherbourg, Epsom, Caen, the hedgerow war, Goodwood, Cobra, Avranches, Mortain, the Falaise pocket, the liberation of Paris and the end of the battle. Epsom, Goodwood and Cobra are close-ups told in three steps each, with formations, start lines and bombing zones.

The story is told around Montgomery's hinge at Caen: the British and Canadians drawing in the German armour so the Americans could break out. A gauge under the day counter shows how many German armoured divisions faced each front, wherever a source records it.

The front page (`/`) is a title over the globe; each moment has its own page (e.g. `/cobra/`, with close-up steps at `/cobra/2/`) with an info panel giving context and troop numbers, and every figure links to its source. There is also a text-only [story](https://mattyboomboom.github.io/Normandy44/story/) page, an [About](https://mattyboomboom.github.io/Normandy44/about/) page and a [Sources](https://mattyboomboom.github.io/Normandy44/sources/) page.

## Running it

Built with [Astro](https://astro.build) and TypeScript, rendered with d3. Needs Node 22.12 or newer.

```sh
npm install
npm run dev        # local dev server at http://localhost:4321/Normandy44/
npm run build      # preview images + static site in dist/
npm run preview    # serve the built site
npm run check      # type-check
npm test           # unit tests, including the content checks
```

## Deploying

The site is published to GitHub Pages at <https://mattyboomboom.github.io/Normandy44/>. Every push to `main` runs `.github/workflows/deploy.yml`, which type-checks, runs the unit tests, builds the site and publishes it; progress shows in the repo's **Actions** tab. Pull requests get the checks but are not published. (Repo **Settings → Pages → Source** must be set to **GitHub Actions**.)

Because Pages serves the site from the `/Normandy44/` sub-folder, `astro.config.mjs` sets that as the base path. Links to files in `public/` must go through `withBase()` from `src/lib/url.ts`, or they will break there.

To host at the root of a domain instead (a custom domain on Pages, or Vercel), build with `SITE_URL=https://your-domain` and `BASE_PATH=/`. For a custom domain on Pages, also add a `public/CNAME` file containing the domain. `vercel.json` is kept for a possible move to Vercel.

## Project layout

```
src/
  content/moments/*.yaml  the 21 moments: text, figures (with sources), armour counts, events,
                          arrows, camera; close-ups have steps with formations, lines and zones
  content/sources.yaml    bibliography
  content/schema.ts       what a moment and a source must look like (checked at build)
  content.config.ts       registers the two collections
  pages/                  index (first moment), [moment] (one page per moment),
                          story, about, sources, 404, sitemap.xml, robots.txt
  components/Atlas.astro  the atlas markup, pre-filled with the moment's text
  layouts/                Base (metadata), Page (reading pages)
  atlas/                  the map in the browser:
    main.ts                 wires everything together, runs transitions
    camera.ts               camera framing and flights (pure, tested)
    view.ts                 projection and screen layout
    areas.ts                areas of Allied control and the front line
    layers.ts               base map, beaches, town and sea labels
    markers.ts              event markers, arrows, bombing zones, popover
    panel.ts                info panel and day counter
    timeline.ts, player.ts  timeline bar and autoplay
    router.ts               one address per moment, Back / Forward
    tactical.ts             close-up detail: formation symbols, lines, zones, village names
    cover.ts                the front-page title and its docked wordmark
    rings.ts, geo.ts        ring resampling; base map loading
  data/                   area outlines over time, places, rivers, nation colours,
                          troops-ashore series, shared types
  lib/                    content loading and cross-checks, URLs, page metadata
public/data/geo.topo.json base map, generated from data-src/geo.json (npm run geo)
public/og/                preview images, generated on every build (npm run og)
scripts/                  build and test tooling; og-fonts/ holds TTF copies of the fonts
tests/unit/               unit tests (vitest)
tests/visual/baseline/    screenshots of every moment, for the visual check
prototype/index.html      the original single-file prototype, kept for reference
```

### Editing the story

Each moment is a YAML file in `src/content/moments/`, named `NN-id.yaml`: the number sets the order, the id becomes the address (`12-cobra.yaml` → `/cobra/`). Every figure needs a `check` status, and a `verified` figure needs at least one `src` key from `src/content/sources.yaml`:

```yaml
forces:
  - n: us                      # nation colour: us uk ca pl fr de all
    k: Ashore at Omaha         # what is counted
    v: 34,250                  # the figure as shown
    s: Detail line             # optional
    src: [ddaystory]           # keys in sources.yaml
    check: verified            # or unverified (shown in amber)
    note: Anything a careful reader should know.
```

A close-up replaces `day`, `date`, `cam`, `state` and `body` with a list of `steps`, each of which has those fields plus optional `units` (formations: `n`, `k` of `inf`/`arm`/`mech`/`para`/`kg`, `label`, `p`), `lines` (`start`, `objective`, `road`, `ridge`), `zones` (`bomb`, `corridor`, `pocket`) and `labels` (village names). An optional `armour` block (`br`, `us`, `when`, `src`) feeds the balance-of-armour gauge.

The build and the unit tests fail with a clear message if a moment breaks the rules: an unknown source, an unknown area state, a point outside the map, a figure without a check status, a gap in the numbering, and so on. To change the base map, edit `data-src/geo.json` and run `npm run geo` (lossless: coordinates are kept to 4 decimal places).

## Visual regression check

`tests/visual/baseline/` holds a screenshot of every moment, desktop and mobile. (The first baseline was taken from the prototype and matched the port; it has since been replaced by the current site, which adds source links and corrected figures.) To check the site still looks the same:

```sh
npx playwright install chromium   # first time only
npm run build && npm run preview  # in one terminal
npm run shots -- http://localhost:4321/Normandy44/ tests/visual/current --paths
npm run compare -- tests/visual/baseline tests/visual/current
```

`compare` prints the share of pixels that differ per screenshot and writes diff images to `tests/visual/diff/`. The baseline was captured on Linux Chromium, so on a Mac expect small anti-aliasing differences across the board; big localised differences are the ones to look at.

## Controls

- **Play** runs through the campaign automatically; press again to pause.
- **Arrows** (on screen or ← / → keys) step one moment at a time; Space toggles play; Home / End jump to the start or finish.
- Click any point on the timeline to jump there.
- Drag to pan and scroll or pinch to zoom; stepping to another moment resets the view.
- Click an event marker on the map for a short note about it.
- The speaker button (or M) turns the ambient soundscape on and off. It is synthesised in the browser (`src/atlas/sound.ts`), off by default, and each moment picks a mood with `sound:` in its YAML.
- Each moment has its own address, e.g. `/cobra/`, and Back / Forward step through the moments you visited. Old `#scene=12` links still work.

## Sources and caveats

Front lines and areas of control are simplified from period situation maps and are approximate, drawn to show the shape of the campaign rather than the exact line on a given day.

Every figure is listed on the Sources page with its source, its check status and any notes. In September 2026 the figures were checked against the D-Day Story (Portsmouth), the Congressional Research Service's D-Day primer, the National WWII Museum, and Wikipedia articles and the works they cite; several were corrected in the process (their notes say what changed). One figure, the build-up to 30 June, is still marked unverified until it can be traced in the official histories.

Map data: Natural Earth (public domain), and the French coastline from france-geojson (derived from IGN / INSEE open data). Rendering: d3. Fonts: Big Shoulders Stencil Display and Source Serif 4 (SIL Open Font License), self-hosted from Fontsource.
