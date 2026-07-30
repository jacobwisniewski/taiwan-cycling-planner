import type {
  Coordinates,
  PlannerState,
  RouteDay,
  RoutedSegment,
} from "./types";

const EARTH_RADIUS_KM = 6371;

export const distanceBetween = (
  first: Coordinates,
  second: Coordinates,
): number => {
  const latitudeDelta = ((second.lat - first.lat) * Math.PI) / 180;
  const longitudeDelta = ((second.lng - first.lng) * Math.PI) / 180;
  const firstLatitude = (first.lat * Math.PI) / 180;
  const secondLatitude = (second.lat * Math.PI) / 180;
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 *
      Math.cos(firstLatitude) *
      Math.cos(secondLatitude);

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const updateDayNumbers = (days: RouteDay[]): RouteDay[] =>
  days.map((day, index) => ({ ...day, day: index + 1 }));

export const savePlanner = (state: PlannerState): void => {
  localStorage.setItem("lantern-planner", JSON.stringify(state));
};

export const loadPlanner = (): PlannerState | null => {
  const saved = localStorage.getItem("lantern-planner");
  if (saved === null) {
    return null;
  }

  try {
    return JSON.parse(saved) as PlannerState;
  } catch {
    return null;
  }
};

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export const downloadGpx = (
  start: Coordinates & { name: string },
  days: RouteDay[],
  routedSegments: RoutedSegment[],
): void => {
  const waypoints = [
    `<wpt lat="${start.lat}" lon="${start.lng}"><name>Start: ${escapeXml(start.name)}</name></wpt>`,
    ...days.map(
      (day) =>
        `<wpt lat="${day.lat}" lon="${day.lng}"><name>Day ${day.day}: ${escapeXml(day.to)}</name><desc>${escapeXml(day.camp)}</desc></wpt>`,
    ),
  ].join("");
  const trackSegments = days
    .map(
      (day, index) => {
        const routed = routedSegments.find(
          (segment) => segment.dayId === day.id,
        );
        const previous = index === 0 ? start : days[index - 1];
        const coordinates = routed?.coordinates ?? [
          [previous.lng, previous.lat],
          [day.lng, day.lat],
        ];
        const points = coordinates
          .map(
            ([lng, lat, elevation]) =>
              `<trkpt lat="${lat}" lon="${lng}">${elevation === undefined ? "" : `<ele>${elevation}</ele>`}</trkpt>`,
          )
          .join("");
        return `<trkseg>${points}</trkseg>`;
      },
    )
    .join("");
  const gpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Taiwan Circuit" xmlns="http://www.topografix.com/GPX/1/1">${waypoints}<trk><name>Taiwan — ${days.length} days</name>${trackSegments}</trk></gpx>`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([gpx], { type: "application/gpx+xml" }),
  );
  link.download = "taiwan-cycling-plan.gpx";
  link.click();
  URL.revokeObjectURL(link.href);
};
