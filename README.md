# temirlann-dev.github.io

My personal site: a cozy, cel-shaded bedroom by the sea. Click the monitor on the desk and the camera dives into its screen, which becomes a Persona 3 Reload-style menu for my projects, experience and contact info.

**Live:** https://temirlann-dev.github.io

Shortcuts: [/#projects](https://temirlann-dev.github.io/#projects) · [/#experience](https://temirlann-dev.github.io/#experience) · [/#contact](https://temirlann-dev.github.io/#contact) skip straight to a section.

## Stack

- React + TypeScript, built with Vite
- [React Three Fiber](https://r3f.docs.pmnd.rs) for the 3D room: everything is built from code with toon shading and ink outlines, the view out of the window is a shader, and the monitor's lock screen is drawn on a canvas texture
- [Motion](https://motion.dev) for the menu animations
- A small hand-written WebGL shader for the menu's water background
- Deployed to GitHub Pages by GitHub Actions on every push to `main`

## Run locally

```sh
npm install
npm run dev
```

## Editing content

All text lives in [`src/data/content.ts`](src/data/content.ts): projects, experience, stats and contact links.
