interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * MapTiler MCP.
 */


const BASE = 'https://api.maptiler.com';
const UA = 'pipeworx-mcp-maptiler/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'geocode',
    description: '"Geocode [address]" / "find coordinates of [place]" / "lat lng for [city]" / "search OpenStreetMap-backed places" — forward geocoding via MapTiler (OpenStreetMap-curated). Returns ranked candidates with lat/lng, address components, and feature IDs for re-lookup via geocode_by_id. Alternative to Mapbox/Google geocoders when you want OSM data.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        language: { type: 'string' },
        limit: { type: 'number' },
        bbox: { type: 'string' },
        proximity: { type: 'string' },
        country: { type: 'string' },
        types: { type: 'string' },
        autocomplete: { type: 'boolean' },
        fuzzyMatch: { type: 'boolean' },
      },
      required: ['query'],
    },
  },
  {
    name: 'geocode_reverse',
    description: '"What address is at [lat,lng]" / "reverse geocode [coords]" / "what place is at this point" — reverse geocoding (coordinates → address / locality / region) via MapTiler.',
    inputSchema: {
      type: 'object',
      properties: { lon: { type: 'number' }, lat: { type: 'number' }, language: { type: 'string' }, limit: { type: 'number' }, types: { type: 'string' } },
      required: ['lon', 'lat'],
    },
  },
  { name: 'geocode_by_id', description: 'Re-fetch a MapTiler geocoding feature by its stable ID (returned in geocode / geocode_reverse results). Use to refresh or re-localize a previously discovered place.', inputSchema: { type: 'object', properties: { id: { type: 'string' }, language: { type: 'string' } }, required: ['id'] } },
  { name: 'elevation', description: '"Elevation at [coords]" / "altitude at [point]" / "how high is [location]" / "height above sea level" — elevation in meters above sea level at a single point via MapTiler\'s SRTM/Maxar dataset.', inputSchema: { type: 'object', properties: { lon: { type: 'number' }, lat: { type: 'number' } }, required: ['lon', 'lat'] } },
  {
    name: 'elevation_polyline',
    description: '"Elevation profile along [route]" / "topographic profile of [path]" / "how hilly is this trail" — elevation samples along a polyline (sequence of lat/lng). Use for hiking elevation gain, cycling grade, trail planning.',
    inputSchema: { type: 'object', properties: { coordinates: { type: 'array', items: { type: 'array', items: { type: 'number' } } } }, required: ['coordinates'] },
  },
  {
    name: 'static_map_url',
    description: '"Static map image of [location]" / "embed a map of [coords]" / "map thumbnail PNG" / "screenshot of map" — returns a MapTiler static-tile image URL for embedding in slack, docs, emails, dashboards. Pass style + coords + zoom + width/height; returns a fetchable PNG URL. No interactive JS required.',
    inputSchema: {
      type: 'object',
      properties: {
        style: { type: 'string' },
        lon: { type: 'number' },
        lat: { type: 'number' },
        zoom: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
        retina: { type: 'boolean' },
        marker: { type: 'string' },
        attribution: { type: 'string' },
      },
      required: ['style', 'lon', 'lat', 'zoom', 'width', 'height'],
    },
  },
  {
    name: 'coordinates_convert',
    description: '"Convert WGS84 lat/lng to [other CRS]" / "reproject coordinates" / "EPSG:4326 → EPSG:[X]" / "Web Mercator coordinates" — Coordinate Reference System (CRS) reprojection. Use to convert standard lat/lng (EPSG:4326) into projected systems like Web Mercator (3857), UTM zones, state plane, etc.',
    inputSchema: {
      type: 'object',
      properties: { coordinates: { type: 'array', items: { type: 'array', items: { type: 'number' } } }, target_crs: { type: 'number' } },
      required: ['coordinates', 'target_crs'],
    },
  },
  { name: 'tiles_json', description: 'TileJSON spec metadata for a MapTiler tileset (zoom range, bounds, layer schema). Specialist tool for GIS integrators — most users want geocode / static_map_url instead.', inputSchema: { type: 'object', properties: { tileset: { type: 'string' } }, required: ['tileset'] } },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) throw new Error('MapTiler requires an API key. Set PLATFORM_MAPTILER_KEY or pass ?_apiKey=… (free at https://cloud.maptiler.com/account/keys/).');
  const get = async (url: string) => {
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
    if (res.status === 401 || res.status === 403) throw new Error('MapTiler: invalid API key.');
    if (!res.ok) throw new Error(`MapTiler: ${res.status}`);
    return res.json();
  };
  const reqStr = (k: string, ex: string) => {
    const v = args[k];
    if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${k}" is missing. Pass a string like ${ex}.`);
    return v;
  };
  const reqNum = (k: string, ex: string) => {
    const v = args[k];
    if (v == null || typeof v !== 'number') throw new Error(`Required argument "${k}" is missing. Pass a number like ${ex}.`);
    return v;
  };
  switch (name) {
    case 'geocode': {
      const q = encodeURIComponent(reqStr('query', '"Paris"'));
      const p = new URLSearchParams({ key: apiKey });
      for (const k of ['language', 'bbox', 'proximity', 'country', 'types'] as const) if (args[k]) p.set(k, String(args[k]));
      if (args.limit != null) p.set('limit', String(args.limit));
      if (args.autocomplete != null) p.set('autocomplete', args.autocomplete ? 'true' : 'false');
      if (args.fuzzyMatch != null) p.set('fuzzyMatch', args.fuzzyMatch ? 'true' : 'false');
      return get(`${BASE}/geocoding/${q}.json?${p}`);
    }
    case 'geocode_reverse': {
      const lon = reqNum('lon', '2.349');
      const lat = reqNum('lat', '48.864');
      const p = new URLSearchParams({ key: apiKey });
      if (args.language) p.set('language', String(args.language));
      if (args.limit != null) p.set('limit', String(args.limit));
      if (args.types) p.set('types', String(args.types));
      return get(`${BASE}/geocoding/${lon},${lat}.json?${p}`);
    }
    case 'geocode_by_id': {
      const id = encodeURIComponent(reqStr('id', '"place.1234567890"'));
      const p = new URLSearchParams({ key: apiKey });
      if (args.language) p.set('language', String(args.language));
      return get(`${BASE}/geocoding/${id}.json?${p}`);
    }
    case 'elevation': {
      const lon = reqNum('lon', '2.349');
      const lat = reqNum('lat', '48.864');
      return get(`${BASE}/elevation/v1/single?lng=${lon}&lat=${lat}&key=${encodeURIComponent(apiKey)}`);
    }
    case 'elevation_polyline': {
      const coords = (args.coordinates as number[][]).map(([lon, lat]) => `${lon},${lat}`).join('|');
      return get(`${BASE}/elevation/v1/polyline?points=${encodeURIComponent(coords)}&key=${encodeURIComponent(apiKey)}`);
    }
    case 'static_map_url': {
      const style = reqStr('style', '"streets-v2"');
      const lon = reqNum('lon', '2.349');
      const lat = reqNum('lat', '48.864');
      const zoom = reqNum('zoom', '12');
      const w = reqNum('width', '600');
      const h = reqNum('height', '400');
      const retina = args.retina ? '@2x' : '';
      const p = new URLSearchParams({ key: apiKey });
      if (args.marker) p.set('marker', String(args.marker));
      if (args.attribution) p.set('attribution', String(args.attribution));
      return { url: `${BASE}/maps/${encodeURIComponent(style)}/static/${lon},${lat},${zoom}/${w}x${h}${retina}.png?${p}`, note: 'PNG binary; open in a browser or fetch as bytes.' };
    }
    case 'coordinates_convert': {
      const coords = (args.coordinates as number[][]).map(([x, y]) => `${x},${y}`).join('|');
      const target = reqNum('target_crs', '3857');
      return get(`${BASE}/coordinates/transform/${encodeURIComponent(coords)}.json?key=${encodeURIComponent(apiKey)}&s_srs=4326&t_srs=${target}`);
    }
    case 'tiles_json':
      return get(`${BASE}/tiles/${encodeURIComponent(reqStr('tileset', '"streets-v2"'))}/tiles.json?key=${encodeURIComponent(apiKey)}`);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
