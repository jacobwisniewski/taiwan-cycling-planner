export type PlaceKind = "camp" | "onsen" | "supply" | "caution";
export type SourceKind = "official" | "rider report" | "community";
export type SleepStyle = "registered" | "ask first" | "wild lead";
export type CampCompliance = "compliant" | "violation";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Place = Coordinates & {
  id: string;
  name: string;
  kind: PlaceKind;
  note: string;
  verified: boolean;
  sleepStyle?: SleepStyle;
  campCompliance?: CampCompliance;
  statusLabel?: string;
  websiteUrl?: string;
  translationUrl?: string;
  sourceIds: string[];
  mapsUrl: string;
};

export type RouteDay = Coordinates & {
  id: string;
  day: number;
  from: string;
  to: string;
  distance: number;
  climbing: number;
  surface: string;
  camp: string;
  onsen: string | null;
  note: string;
  difficulty: "easy" | "steady" | "big";
};

export type RouteCoordinate = [lng: number, lat: number, elevation?: number];

export type RoutedSegment = {
  dayId: string;
  coordinates: RouteCoordinate[];
  distance: number;
  climbing: number;
};

export type PlannerState = {
  title: string;
  start: Coordinates & { name: string };
  days: RouteDay[];
  places: Place[];
  sources: Source[];
};

export type Source = {
  id: string;
  title: string;
  publisher: string;
  kind: SourceKind;
  url: string;
  usedFor: string;
};
