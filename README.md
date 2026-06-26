# mcp-maptiler

MapTiler MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 965+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `geocode` | "Geocode [address]" / "find coordinates of [place]" / "lat lng for [city]" / "search OpenStreetMap-backed places" — forward geocoding via MapTiler (OpenStreetMap-curated). Returns ranked candidates with lat/lng, address components, and feature IDs for re-lookup via geocode_by_id. Alternative to Mapbox/Google geocoders when you want OSM data. |
| `geocode_reverse` | "What address is at [lat,lng]" / "reverse geocode [coords]" / "what place is at this point" — reverse geocoding (coordinates → address / locality / region) via MapTiler. |
| `elevation_polyline` | "Elevation profile along [route]" / "topographic profile of [path]" / "how hilly is this trail" — elevation samples along a polyline (sequence of lat/lng). Use for hiking elevation gain, cycling grade, trail planning. |
| `static_map_url` | "Static map image of [location]" / "embed a map of [coords]" / "map thumbnail PNG" / "screenshot of map" — returns a MapTiler static-tile image URL for embedding in slack, docs, emails, dashboards. Pass style + coords + zoom + width/height; returns a fetchable PNG URL. No interactive JS required. |
| `coordinates_convert` | "Convert WGS84 lat/lng to [other CRS]" / "reproject coordinates" / "EPSG:4326 → EPSG:[X]" / "Web Mercator coordinates" — Coordinate Reference System (CRS) reprojection. Use to convert standard lat/lng (EPSG:4326) into projected systems like Web Mercator (3857), UTM zones, state plane, etc. |

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

Or connect to the full Pipeworx gateway for access to all 965+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
