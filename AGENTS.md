# Recipe Discovery 98

A Windows 98–styled recipe browser, shipped as a static Astro site with React
islands. Recipe data comes from TheMealDB. Single page-shaped app, two real
routes, no backend.

## Gate

Hand work back only when all five pass:

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e
```

`npm run build` runs `typecheck` itself. `test:e2e` builds nothing — run
`npm run build` first; Playwright pins its preview to `http://127.0.0.1:4398`.
The dev server is at `http://localhost:3098` (uncommon ports on purpose: this
project must not take a port from another local server).

Node 24+ (`.nvmrc`, `engines`): the API layer relies on `Promise.withResolvers`
and `AbortSignal.any`.

## Map

| Path | Holds |
| --- | --- |
| `src/pages/*.astro` | Routes only: `index` (welcome desktop), `app` (finder), `404` |
| `src/layouts/Layout.astro` | Document head, fonts, global CSS import, CSP input |
| `src/App.tsx` | Island root: error boundary, query client, desktop |
| `src/components/Desktop/` | Desktop shell: window state, taskbar, Start menu, launch and shut-down screens, ASCII field |
| `src/components/Home/` | Recipe finder: view state, toolbar, status bar, shortcuts |
| `src/components/<Name>/` | One folder per component |
| `src/hooks/` | Query wrappers, favourites store, window drag, Konami code, debounce |
| `src/api/mealdb.ts` | TheMealDB client: slot queue, timeout, retry, zod validation |
| `src/routing.ts` | Base-path aware asset, home, and finder URLs |
| `src/styles/global.css` | All styling: theme variables, 98.css overrides, responsive and touch rules |
| `src/tests/` | Vitest + Testing Library (jsdom) |
| `e2e/` | Playwright specs against the built site; `screenshots.spec.ts` runs only through `npm run docs:screens` |

## Invariants

Each of these breaks silently — a green build still ships a broken app.

1. **The island is server-rendered, so server and client must agree.** Never
   branch on `typeof document` in a way that changes markup. Components that
   portal into `document.body` render nothing until they are open, which is what
   keeps the first client render identical to the prerendered HTML.
2. **Build asset URLs through `src/routing.ts`.** `getAssetUrl()`, `getBaseUrl()`,
   `getAppUrl()`. GitHub Pages serves the repo from `/Recipe-98/`, so a hardcoded
   `/favicon.svg` 404s in production only.
3. **The CSP is generated.** `security.csp` in `astro.config.mjs` hashes the
   inline scripts Astro emits (island bootstrapper included); `style-src` allows
   `'unsafe-inline'` because React sets style attributes. `public/_headers` adds
   only `frame-ancestors`, which a `<meta>` policy cannot express — a second,
   stricter `script-src` there would block the hashed scripts.
4. **Keep the CSS unminified.** 98.css 0.1.21 ships a `@media (not(hover))` rule
   that Lightning CSS rejects. `vite.build.cssMinify: false` is deliberate
   (~10 kB gzipped).
5. **Theme through the root attribute.** `document.documentElement.dataset.theme`
   plus the `--theme-*` and `--win-*` variables in `global.css`; that attribute is
   what themes portaled dialogs. New UI colours read those variables, so the plum
   theme covers them for free.
6. **The finder is a lazy chunk.** `Desktop` imports `Home` with `lazy()`, so the
   welcome route downloads no recipe code and no ASCII engine. Keep new
   finder-only imports behind that boundary.
7. **Persist through the zod schemas.** Settings (`recipe98:settings:v1`) and
   favourites (`recipe98:favorites:v1`) parse stored JSON and fall back to
   defaults. Text size is clamped to 11–18, in sync with the slider.
8. **Keep the API client's concurrency cap.** `MAX_CONCURRENT = 2` protects the
   public test key; requests time out at 10 s and retry once on 429/502/503/504.
   Add endpoints as exported functions in `mealdb.ts`, wrapped in a query hook.
9. **Use the image variants.** Cards request `…/preview` (~11 kB), the detail
   view `…/medium` (~45 kB), never the full image, through `mealImageUrl()`.
10. **Match the touch baseline.** Controls set `touch-action: manipulation` and
    no tap highlight; inputs are 16px on coarse pointers so iOS never zooms;
    `viewport-fit=cover` plus `env(safe-area-inset-*)` keeps the taskbar off the
    home indicator; hover styles stay inside `(hover: hover) and (pointer: fine)`.

## Conventions

- **Data layer:** TanStack Query defaults live in `App.tsx` (5 min stale, 15 min
  gc, one retry, no refetch on focus). `queryFn` forwards its `AbortSignal`.
- **Component files export components.** Helpers and constants go in a sibling
  `.ts` (for example `SettingsDialog/settings.ts`); `react-refresh/only-export-components`
  warns otherwise.
- **Focus and announcements:** move focus in
  `requestAnimationFrame(() => ref.focus())`; announce status through
  `role="status" aria-live="polite"`; mark toggles with `aria-pressed`.
- **Motion:** gate animation on `prefersReducedMotion()` from
  `src/utils/motion.ts`.
- **Comments explain why**, matching the existing notes on `cssMinify`,
  `MAX_CONCURRENT`, and the service-worker retirement.
- **Tests:** `src/tests/*.test.{ts,tsx}` under jsdom with `restoreMocks`; mock
  `fetch` for data-layer cases. Browser behaviour belongs in `e2e/` — 98.css
  renders radio inputs as 0×0 controls, so click the label, not the input.

## Environment and deploy

`.env` is optional — copy `.env.example`. `VITE_MEALDB_API_KEY` defaults to `1`
(the public test key) and `VITE_MEALDB_BASE_URL` overrides the full API base.
`VITE_BASE_PATH` defaults to `/` for domain-root hosting such as Cloudflare
Pages; `.github/workflows/deploy.yml` builds with `/Recipe-98/` and force-pushes
`gh-pages`. Astro emits `404.html` itself, so the old redirect page and
`_redirects` are gone.

`.gitignore` excludes agent tooling artifacts (`specs/`, `plans/`, `tasks/`,
`memory/`, `research/`, `.spec-kit/`, `.specify/`, draft prompt files), plus
`.astro/`, `dist/`, and Playwright output. Keep them out of commits.
