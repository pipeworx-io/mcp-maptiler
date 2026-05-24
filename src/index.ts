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
    description: 'Forward geocoding.',
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
    description: 'Reverse geocoding.',
    inputSchema: {
      type: 'object',
      properties: { lon: { type: 'number' }, lat: { type: 'number' }, language: { type: 'string' }, limit: { type: 'number' }, types: { type: 'string' } },
      required: ['lon', 'lat'],
    },
  },
  { name: 'geocode_by_id', description: 'Feature by id.', inputSchema: { type: 'object', properties: { id: { type: 'string' }, language: { type: 'string' } }, required: ['id'] } },
  { name: 'elevation', description: 'Elevation at point.', inputSchema: { type: 'object', properties: { lon: { type: 'number' }, lat: { type: 'number' } }, required: ['lon', 'lat'] } },
  {
    name: 'elevation_polyline',
    description: 'Elevations along a polyline.',
    inputSchema: { type: 'object', properties: { coordinates: { type: 'array', items: { type: 'array', items: { type: 'number' } } } }, required: ['coordinates'] },
  },
  {
    name: 'static_map_url',
    description: 'Static map URL (returns URL only).',
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
    description: 'CRS conversion.',
    inputSchema: {
      type: 'object',
      properties: { coordinates: { type: 'array', items: { type: 'array', items: { type: 'number' } } }, target_crs: { type: 'number' } },
      required: ['coordinates', 'target_crs'],
    },
  },
  { name: 'tiles_json', description: 'TileJSON for a tileset.', inputSchema: { type: 'object', properties: { tileset: { type: 'string' } }, required: ['tileset'] } },
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
