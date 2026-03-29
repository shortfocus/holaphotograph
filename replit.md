# HolaPhoto (올라포토)

A Korean photography blog and review platform built with Astro (static site generator) and Tailwind CSS.

## Project Structure

- `src/pages/` — Astro pages (index, post, notice, reviews, admin, feed)
- `src/layouts/` — Shared layout components
- `src/data/` — Static data files
- `src/styles/` — Global CSS styles
- `src/lib/` — Utility libraries
- `public/` — Static assets
- `worker/` — Cloudflare Worker (separate service for API)
- `scripts/` — Build/utility scripts
- `docs/` — Documentation

## Tech Stack

- **Framework:** Astro v5 (static output)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Package Manager:** npm
- **Build output:** `dist/` directory

## Development

```bash
npm run dev       # Start dev server on port 5000
npm run build     # Build static site to dist/
npm run preview   # Preview built site
```

## Configuration

- Dev server: `0.0.0.0:5000` (configured in `astro.config.mjs`)
- `allowedHosts: true` set for Replit proxy compatibility
- Site URL: `https://holaphoto.com`

## Environment Variables

- `PUBLIC_API_URL` — Public API endpoint
- `PUBLIC_ADMIN_API_URL` — Admin API endpoint

## Deployment

Configured as a **static** deployment:
- Build command: `npm run build`
- Public directory: `dist`
