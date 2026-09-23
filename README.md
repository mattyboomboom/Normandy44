# Normandy 1944: an animated atlas

An interactive map of the Normandy campaign, from the eve of D-Day (5 June 1944) to the crossing of the Seine at the end of August. It opens on the globe, closes in on the Channel coast, lands on the five beaches, and then follows the Allied area of control as it spreads across Normandy through 18 key moments: the airborne drops, Omaha, the link-up, the storm, Cherbourg, Caen, Goodwood, Cobra, Avranches, Mortain, the Falaise pocket, the liberation of Paris and the end of the battle.

Each moment has an info panel with context and approximate troop numbers by army and by area.

## Running it

It is a single self-contained file (`index.html`) with the map data and the d3 library baked in. Open it in any modern browser, no server needed.

To publish on GitHub Pages: create a repository, add `index.html` and this README to the root, then go to Settings → Pages, choose "Deploy from a branch", pick `main` and `/ (root)`. The atlas will be live at `https://<username>.github.io/<repo>/`.

## Controls

- **Play** runs through the campaign automatically; press again to pause.
- **Arrows** (on screen or ← / → keys) step one moment at a time; Space toggles play; Home / End jump to the start or finish.
- Click any point on the timeline to jump there.
- Drag to pan and scroll or pinch to zoom; stepping to another moment resets the view.
- Click an event marker on the map for a short note about it.
- Each moment has its own link, e.g. `index.html#scene=12` opens Operation Cobra.

## Sources and caveats

Front lines and areas of control are simplified from period situation maps and are approximate, drawn to show the shape of the campaign rather than the exact line on a given day. Troop, casualty and supply figures are rounded, widely cited totals (US Army and Commonwealth official histories, the D-Day Story and Juno Beach Centre figures, among others); sources differ, and German losses in particular are estimates.

Map data: Natural Earth (public domain), and the French coastline from france-geojson (derived from IGN / INSEE open data). Rendering: d3 v7. Fonts: Big Shoulders Stencil and Source Serif 4 via Google Fonts (falls back to system fonts offline).
