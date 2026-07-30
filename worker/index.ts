interface Env {
  ASSETS: Fetcher;
}

const ROUTER_URL = "https://brouter.de/brouter";
const TAIWAN_BOUNDS = {
  minLat: 20.5,
  maxLat: 26.5,
  minLng: 119,
  maxLng: 123,
};

const isTaiwanCoordinate = (value: string): boolean => {
  const parts = value.split(",");
  if (parts.length !== 2) {
    return false;
  }
  const lng = Number(parts[0]);
  const lat = Number(parts[1]);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= TAIWAN_BOUNDS.minLat &&
    lat <= TAIWAN_BOUNDS.maxLat &&
    lng >= TAIWAN_BOUNDS.minLng &&
    lng <= TAIWAN_BOUNDS.maxLng
  );
};

const routeResponse = async (
  request: Request,
  context: ExecutionContext,
): Promise<Response> => {
  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET" },
    });
  }

  const requestUrl = new URL(request.url);
  const lonlats = requestUrl.searchParams.get("lonlats");
  const points = lonlats?.split("|") ?? [];
  if (lonlats === null || points.length !== 2 || !points.every(isTaiwanCoordinate)) {
    return Response.json(
      { error: "Two valid Taiwan coordinates are required." },
      { status: 400 },
    );
  }

  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached !== undefined) {
    return cached;
  }

  const upstreamUrl = new URL(ROUTER_URL);
  upstreamUrl.searchParams.set("lonlats", lonlats);
  upstreamUrl.searchParams.set("profile", "trekking");
  upstreamUrl.searchParams.set("alternativeidx", "0");
  upstreamUrl.searchParams.set("format", "geojson");
  const upstream = await fetch(upstreamUrl, {
    headers: { "User-Agent": "Lantern Taiwan Cycling Planner" },
  });
  const response = new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": upstream.ok
        ? "public, max-age=86400"
        : "no-store",
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/geo+json",
    },
  });
  if (response.ok) {
    context.waitUntil(cache.put(request, response.clone()));
  }
  return response;
};

export default {
  async fetch(
    request: Request,
    env: Env,
    context: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/route") {
      return routeResponse(request, context);
    }
    return env.ASSETS.fetch(request);
  },
};
