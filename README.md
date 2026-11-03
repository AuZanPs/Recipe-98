# Recipe Discovery 98

A Windows 98–styled recipe browser, shipped as a static Astro site with React
islands. Built with Astro, React, TypeScript, 98.css, Asciify, Pixelarticons,
IBM Plex, TanStack Query, Zod, and TheMealDB.

**Demo:** https://auzanps.github.io/Recipe-98/

![Recipe Discovery 98](docs/desktop.png)

![Recipe window](docs/app.png)

![Display Properties](docs/settings.png)

## Run

```bash
npm install
npm run dev
```

```bash
npm run build      # typecheck + static build into dist/
npm run preview    # serve the built site
npm test           # Vitest, unit and component
npm run test:e2e   # Playwright against the built site
npm run lint       # ESLint
```

Node `24+` LTS. The dev server runs at `http://localhost:3098/`, an uncommon
port on purpose so this project never contends with another local server.
`npm run preview` serves the last build (Astro defaults to `4321`); the browser
tests pin their own preview to `http://127.0.0.1:4398`.

## How it is put together

Astro renders the document and every route ahead of time; React only hydrates
the desktop.

| Route | Page | What ships |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | The welcome desktop, prerendered, hydrated on idle |
| `/app/` | `src/pages/app.astro` | The full Recipe Finder, hydrated immediately |
| `404` | `src/pages/404.astro` | A 98-style "cannot find this page" window |

- **Real routes.** Opening the finder is a link, not a state flag, so each view
  has its own URL and the launcher works before a byte of JavaScript runs.
- **One island, split chunks.** `src/components/Desktop/Desktop.tsx` is the
  island. The finder (`Home`) is a `lazy()` chunk, so the welcome desktop never
  downloads recipe code.
- **Deferred ASCII engine.** The desktop field is imported after paint, and a
  failure to start it leaves the desktop working.
- **Cheaper images.** TheMealDB serves `/preview` and `/medium` variants beside
  the full image; cards use the preview (≈11 kB instead of ≈110 kB), the detail
  view the medium one.
- **Prefetch.** Both routes are warmed on viewport, so the launch is instant.

## Features

- Search, categories, random recipes, favourites, and printable recipes
- A Windows 98 desktop with a draggable recipe window, taskbar, clock, and Start menu
- A program launch animation, then the Recipe Finder window
- Minimize, maximize, restore, and close window modes
- Display Properties with theme, recipe text size, desktop toggles, and 98.css
  tabs, fieldsets, tree view, table view, and slider
- Plum theme across title bars, dialogs, active controls, selections, and window
  accents via Display Properties or the Konami code
- Shut Down (and the classic "safe to turn off" screen) plus a blue-screen error
  handler for when something breaks

## Deploy

The site builds for the domain root by default, which is what Cloudflare Pages
needs: build command `npm run build`, output directory `dist`, Node `24`.
`public/_headers` sets the security headers.

GitHub Pages serves the repo from a sub-path, so its workflow builds with
`VITE_BASE_PATH=/Recipe-98/`. Astro emits `404.html` itself, so no redirect hack
is needed.

## Credits

Everything is open source: Astro (MIT), 98.css (MIT), Asciify (MIT),
Pixelarticons (MIT), IBM Plex (OFL-1.1), React (MIT), TanStack Query (MIT),
Zod (MIT), Vitest (MIT), Playwright (Apache-2.0).

Windows 98 reference: [98.css documentation](https://jdan.github.io/98.css/) ·
[Windows 98 interface gallery](https://guidebookgallery.org/screenshots/win98).

Recipe data and images belong to [TheMealDB](https://www.themealdb.com/).
Windows 98 is a Microsoft trademark; this is an independent tribute, not
affiliated with Microsoft. Project code is MIT licensed.
