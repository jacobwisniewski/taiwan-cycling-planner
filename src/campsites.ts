import type { CampCompliance, Place } from "./types";

type CampsiteRecord = {
  id: string;
  name: string;
  county: string;
  district: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  website: string;
  compliance: CampCompliance;
  violation: string;
};

const freeCampDetails: Record<
  string,
  { note: string; sourceId: string; statusLabel: string }
> = {
  碧山露營場: {
    note: "Free Taipei City campground; advance application required.",
    sourceId: "taipei-free-camps",
    statusLabel: "Free public campground · reserve before arrival",
  },
  貴子坑露營場: {
    note: "Free Taipei City campground; advance application required.",
    sourceId: "taipei-free-camps",
    statusLabel: "Free public campground · reserve before arrival",
  },
};

const isCampsiteRecord = (value: unknown): value is CampsiteRecord => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.county === "string" &&
    typeof record.district === "string" &&
    typeof record.lat === "number" &&
    typeof record.lng === "number" &&
    typeof record.address === "string" &&
    typeof record.phone === "string" &&
    typeof record.website === "string" &&
    (record.compliance === "compliant" ||
      record.compliance === "violation") &&
    typeof record.violation === "string"
  );
};

const toPlace = (campsite: CampsiteRecord): Place => {
  const compliant = campsite.compliance === "compliant";
  const freeCamp = freeCampDetails[campsite.name];
  const location = [campsite.county, campsite.district]
    .filter((part) => part !== "")
    .join(" · ");
  const issue =
    campsite.violation === ""
      ? ""
      : ` Listed issue: ${campsite.violation}.`;

  return {
    id: campsite.id,
    name: campsite.name,
    kind: "camp",
    lat: campsite.lat,
    lng: campsite.lng,
    note: `${location}${campsite.address === "" ? "" : ` · ${campsite.address}`}.${issue}${freeCamp === undefined ? "" : ` ${freeCamp.note}`}`,
    verified: compliant,
    sleepStyle: "registered",
    campCompliance: campsite.compliance,
    statusLabel:
      freeCamp?.statusLabel ??
      (compliant
        ? "Listed as compliant by the Tourism Administration"
        : `Listed with a regulatory issue${campsite.violation === "" ? "" : `: ${campsite.violation}`}`),
    sourceIds: [
      "official-camps-data",
      ...(freeCamp === undefined ? [] : [freeCamp.sourceId]),
    ],
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${campsite.name} ${campsite.address}`)}`,
    websiteUrl: campsite.website === "" ? undefined : campsite.website,
  };
};

export const loadOfficialCampsites = async (
  signal: AbortSignal,
): Promise<Place[]> => {
  const response = await fetch("/data/campsites.json", { signal });
  if (!response.ok) {
    throw new Error(`campsites: dataset returned ${response.status}`);
  }
  const value: unknown = await response.json();
  if (!Array.isArray(value) || !value.every(isCampsiteRecord)) {
    throw new Error("campsites: invalid official dataset");
  }
  return value.map(toPlace);
};
