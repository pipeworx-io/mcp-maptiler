# @pipeworx/maptiler

[MapTiler Cloud](https://docs.maptiler.com/cloud/api/) MCP — geocoding, reverse-geocoding, static maps, elevation. Free 100k req/mo.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/maptiler/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Maptiler data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
