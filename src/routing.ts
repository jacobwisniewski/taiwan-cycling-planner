import type {
  Coordinates,
  RouteCoordinate,
  RouteDay,
  RoutedSegment,
} from "./types";

type GeoJsonRoute = {
  features?: {
    geometry?: {
      coordinates?: unknown;
      type?: unknown;
    };
    properties?: Record<string, unknown>;
  }[];
  type?: unknown;
};

const isRouteCoordinate = (value: unknown): value is RouteCoordinate =>
  Array.isArray(value) &&
  value.length >= 2 &&
  value.length <= 3 &&
  value.every((coordinate) => typeof coordinate === "number");

const readMetric = (
  properties: Record<string, unknown>,
  key: string,
): number => {
  const value = properties[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const parseRoute = (value: unknown, dayId: string): RoutedSegment => {
  if (typeof value !== "object" || value === null) {
    throw new Error(`routing: invalid response for ${dayId}`);
  }

  const route = value as GeoJsonRoute;
  const feature = route.features?.[0];
  const coordinates = feature?.geometry?.coordinates;
  if (
    route.type !== "FeatureCollection" ||
    feature?.geometry?.type !== "LineString" ||
    !Array.isArray(coordinates) ||
    !coordinates.every(isRouteCoordinate)
  ) {
    throw new Error(`routing: missing route geometry for ${dayId}`);
  }

  const properties = feature.properties ?? {};
  return {
    dayId,
    coordinates,
    distance: readMetric(properties, "track-length") / 1000,
    climbing: readMetric(properties, "filtered ascend"),
  };
};

const routeStage = async (
  start: Coordinates,
  day: RouteDay,
  signal: AbortSignal,
): Promise<RoutedSegment> => {
  const query = new URLSearchParams({
    lonlats: `${start.lng},${start.lat}|${day.lng},${day.lat}`,
    profile: "trekking",
    alternativeidx: "0",
    format: "geojson",
  });
  const response = await fetch(`/api/route?${query}`, { signal });
  if (!response.ok) {
    throw new Error(`routing: ${day.id} returned ${response.status}`);
  }
  return parseRoute(await response.json(), day.id);
};

export const routeDays = async (
  start: Coordinates,
  days: RouteDay[],
  signal: AbortSignal,
  onSegment: (segment: RoutedSegment) => void,
  onFailure: (dayId: string) => void,
): Promise<void> => {
  const stages = days.map((day, index) => ({
    day,
    start: index === 0 ? start : days[index - 1],
  }));
  let cursor = 0;

  const runLane = async (): Promise<void> => {
    const stage = stages[cursor];
    cursor += 1;
    if (stage === undefined || signal.aborted) {
      return;
    }

    try {
      onSegment(await routeStage(stage.start, stage.day, signal));
    } catch (error) {
      if (!signal.aborted) {
        onFailure(stage.day.id);
        console.warn(error);
      }
    }
    await runLane();
  };

  await Promise.all(
    Array.from({ length: Math.min(3, stages.length) }, () => runLane()),
  );
};
