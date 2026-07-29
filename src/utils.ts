import type { Coordinates, PlannerState, RouteDay } from "./types";

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

export const downloadGpx = (days: RouteDay[]): void => {
  const points = days
    .map(
      (day) =>
        `<rtept lat="${day.lat}" lon="${day.lng}"><name>Day ${day.day}: ${day.to}</name><desc>${day.camp}</desc></rtept>`,
    )
    .join("");
  const gpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Lantern Taiwan Planner" xmlns="http://www.topografix.com/GPX/1/1"><rte><name>Taiwan — ${days.length} days</name>${points}</rte></gpx>`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([gpx], { type: "application/gpx+xml" }),
  );
  link.download = "taiwan-cycling-plan.gpx";
  link.click();
  URL.revokeObjectURL(link.href);
};
