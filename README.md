# temirlann-dev.github.io

My personal site: a neon arcade you can walk up to. Click the middle cabinet and the camera dives into its screen, which becomes the menu for my projects, experience and contact info.

**Live:** https://temirlann-dev.github.io

Shortcuts: [/#projects](https://temirlann-dev.github.io/#projects) · [/#experience](https://temirlann-dev.github.io/#experience) · [/#contact](https://temirlann-dev.github.io/#contact) skip straight to a section.

## Stack

- React + TypeScript, built with Vite
- [React Three Fiber](https://r3f.docs.pmnd.rs) for the 3D arcade (cabinets are built from code, screens are drawn on canvas textures)
- [Motion](https://motion.dev) for the menu animations
- A small hand-written WebGL shader for the water background
- Deployed to GitHub Pages by GitHub Actions on every push to `main`

## Run locally

```sh
npm install
npm run dev
```

## Editing content

All text lives in [`src/data/content.ts`](src/data/content.ts): projects, experience, stats and contact links.
