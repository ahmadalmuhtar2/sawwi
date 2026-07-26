# Template cover images

Static catalog covers for the templates gallery — shipped with the code (see
`src/templates/*/index.ts` → `cover`). Templates are a code catalog (there is no
`Template` table in the DB), so their covers live here, versioned with the repo.

## Convention

- **Filename = the template key**, e.g. `barbershop-five-star.jpg`.
- Set the module's `cover` to the public path: `"/template-covers/<key>.jpg"`.
- **Aspect ratio 16:10** (the card cover box). ~1200×750 is plenty.
- Format: `.jpg`/`.webp` for photos, `.png` if it needs transparency.

If the file is missing, the gallery renders a generated textured poster instead
of a broken image — so it's safe to declare `cover` before the asset lands.
