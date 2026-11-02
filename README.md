# Recipe Discovery 98

A Windows 98–styled recipe browser. Built as a personal experiment with React, TypeScript, Vite, 98.css, Asciify, Pixelarticons, IBM Plex, and TheMealDB.

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
npm run build
npm test
npm run lint
```

Node `24+` LTS. The dev server runs at `http://localhost:3000/Recipe-98/`.

## Features

- Search, categories, random recipes, favourites, and printable recipes
- A Windows 98 desktop with a draggable recipe window, taskbar, clock, and Start menu
- Minimize, maximize, restore, and close window modes
- Display Properties with theme, recipe text size, desktop toggles, and 98.css tabs, fieldsets, tree view, table view, and slider
- Draggable “Today’s Special” recipe widget
- Plum theme via Display Properties or the Konami code

## Deploy

GitHub Pages builds with the default `/Recipe-98/` base. For Cloudflare Pages, set `VITE_BASE_PATH=/` or let the build auto-detect `CF_PAGES`; build command `npm run build`, output `dist`.

## Credits

Everything is open source: 98.css (MIT), Asciify (MIT), Pixelarticons (MIT), IBM Plex (OFL-1.1), React (MIT), TanStack Query (MIT), Zod (MIT), Vite (MIT), Vitest (MIT).

Windows 98 reference: [98.css documentation](https://jdan.github.io/98.css/) · [Windows 98 interface gallery](https://guidebookgallery.org/screenshots/win98).

Recipe data and images belong to [TheMealDB](https://www.themealdb.com/). Windows 98 is a Microsoft trademark; this is an independent tribute, not affiliated with Microsoft. Project code is MIT licensed.
