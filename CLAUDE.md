# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `src/pages/index.astro`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Run `pnpm check` before you push.
- Open the page in a browser and look at it. The rendered page is the truth;
  your mental model of it isn't.
- When a check fails, read its output before you change anything.
- Never commit a red state.

## The checks

`pnpm check` runs them, and `pnpm check:evidence` is the extra gate before you
ship. CI runs the same plus links, secrets and the deploy.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## This week's stack: Astro

This prototype uses Astro instead of the template's default hand-written
HTML/Vite (carried forward from last week's prototype). A few things that
changed and why:

- Pages live in `src/pages/` as `.astro` files, not `.html` at the repo root.
  Styles live in `src/styles/`, imported from a page's frontmatter.
- `astro.config.ts` sets `base: "/comp4020-crit5-leahylin"`. GitHub Pages
  serves this repo under that subpath, and Astro needs `base` set explicitly
  for its internal links and assets to resolve there — unlike the template's
  Vite config, which sidesteps this with relative (`base: "./"`) asset URLs.
  Any new internal link should go through `import.meta.env.BASE_URL` (or a
  relative path) rather than a hand-written absolute `/path`, or it'll 404 once
  deployed even though it looks fine in `astro dev`. `BASE_URL` itself has no
  trailing slash, so `` `${base}about` `` builds `/comp4020-crit5-leahylinabout`,
  not `/comp4020-crit5-leahylin/about` — write it as `` `${base}/about` `` and
  confirm with the links check below, not just a build that succeeds.
- `pnpm typecheck` runs `astro check` (not `tsc --noEmit`) — plain `tsc`
  doesn't understand `.astro` files.
- **The links check needed a CI fix.** Because `base` makes every internal
  href root-relative to `/comp4020-crit5-leahylin`, crawling the raw `dist/`
  folder (the template's default `pnpm dlx linkinator ./dist`) treats `dist/`
  as the domain root and 404s on that prefix — it's not a real broken link,
  just a mismatch between local raw-folder testing and how GitHub Pages
  actually serves a subpath. `.github/workflows/checks.yml`'s "Check internal
  links" step boots `astro preview` and crawls the served URL instead of
  the raw folder. Reproduce it locally the same way rather than
  `pnpm dlx linkinator ./dist`, which will show a false positive:
  ```sh
  pnpm preview --port 4321 &
  pnpm dlx linkinator http://localhost:4321/comp4020-crit5-leahylin/ --silent
  kill %1
  ```

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. This file and the sensors you wire into `check` carry
across the course --- both come with you into next week's repo. The prototype
doesn't: source, and the tests answering this week's published spec, stay
behind. `spec/README.md` draws the line.
