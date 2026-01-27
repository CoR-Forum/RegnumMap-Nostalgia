# Regnum map tiles


Overview
- The `tiles/` folder contains 9 map tiles for a 3x3 map named by row-column: `1-1.png` ... `3-3.png`.
- This is an old map from Regnum Online (nowadays Champions of Regnum).

Preview

![Regnum Map](https://github.com/CoR-Forum/RegnumMap-Nostalgia/blob/main/map.png?raw=true)

Requirements
- ImageMagick (install on macOS with: `brew install imagemagick`).

Notes
- The command assumes all tiles are the same size and named in row-major order.
- If you prefer a different output filename, change `map.png`.
- Verify the tile ordering before running; adjust filenames if your numbering scheme differs.

Quick Start

- **Docker Compose**: Start the nginx service and serve the site on port 8000:

```bash
docker compose up --build
```

Then open http://localhost:8000/index.html

- **Local (no Docker)**: Serve files from the project root with Python's simple HTTP server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/index.html

- **Files**: The viewer is `index.html` (uses Leaflet); nginx config is in `nginx/default.conf`; the compose file is `docker-compose.yml`. Map tiles live in the `tiles/` folder (`1-1.png` … `3-3.png`).

- **Troubleshooting**: If tiles don't appear, confirm the `tiles/` files exist and are served at `/tiles/`.
