# @pipeworx/maptiler

[MapTiler Cloud](https://docs.maptiler.com/cloud/api/) MCP — geocoding, reverse-geocoding, static maps, elevation. Free 100k req/mo.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Auth

- Platform: `PLATFORM_MAPTILER_KEY`. BYO: `?_apiKey=…`.

## Tools

- `geocode(query, language?, limit?, bbox?, proximity?, country?, types?, autocomplete?, fuzzyMatch?)` — forward geocoding
- `geocode_reverse(lon, lat, language?, limit?, types?)` — reverse geocoding
- `geocode_by_id(id, language?)` — feature by Mapbox-style id (e.g. `place.123456`)
- `elevation(lon, lat)` — elevation at point
- `elevation_polyline(coordinates)` — elevations along a polyline (`coordinates`: array of `[lon, lat]`)
- `static_map_url(style, lon, lat, zoom, width, height, retina?, marker?, attribution?)` — static map URL (binary; pack returns the URL only)
- `coordinates_convert(coordinates, target_crs)` — CRS conversion (e.g. WGS84 → Web Mercator)
- `tiles_json(tileset)` — TileJSON for a tileset (e.g. `streets-v2`)

## Data source

`https://api.maptiler.com`

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "maptiler": {
      "url": "https://gateway.pipeworx.io/maptiler/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Maptiler data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
