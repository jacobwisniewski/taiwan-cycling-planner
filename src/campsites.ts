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
  communityMap?: boolean;
};

const countyNames: Record<string, string> = {
  宜蘭縣: "Yilan County",
  花蓮縣: "Hualien County",
  臺東縣: "Taitung County",
  台東縣: "Taitung County",
  屏東縣: "Pingtung County",
  高雄市: "Kaohsiung City",
  臺南市: "Tainan City",
  台南市: "Tainan City",
  嘉義縣: "Chiayi County",
  嘉義市: "Chiayi City",
  雲林縣: "Yunlin County",
  彰化縣: "Changhua County",
  南投縣: "Nantou County",
  臺中市: "Taichung City",
  台中市: "Taichung City",
  苗栗縣: "Miaoli County",
  新竹縣: "Hsinchu County",
  新竹市: "Hsinchu City",
  桃園市: "Taoyuan City",
  新北市: "New Taipei City",
  臺北市: "Taipei City",
  台北市: "Taipei City",
  基隆市: "Keelung City",
  澎湖縣: "Penghu County",
  金門縣: "Kinmen County",
  連江縣: "Lienchiang County",
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
    typeof record.violation === "string" &&
    (record.communityMap === undefined ||
      typeof record.communityMap === "boolean")
  );
};

const toPlace = (campsite: CampsiteRecord): Place => {
  const compliant = campsite.compliance === "compliant";
  const freeCamp = freeCampDetails[campsite.name];
  const location = [
    countyNames[campsite.county] ?? campsite.county,
    campsite.district,
  ]
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
      ...(campsite.communityMap === true ? ["legacy-community-camp-map"] : []),
    ],
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${campsite.name} ${campsite.address}`)}`,
    websiteUrl: campsite.website === "" ? undefined : campsite.website,
    translationUrl: `https://translate.google.com/?sl=zh-TW&tl=en&text=${encodeURIComponent(`${campsite.name}\n${campsite.address}`)}&op=translate`,
  };
};

export const loadOfficialCampsites = async (
  signal: AbortSignal,
): Promise<Place[]> => {
  const response = await fetch("/data/campsites.json?v=2026-07-30-community", {
    signal,
  });
  if (!response.ok) {
    throw new Error(`campsites: dataset returned ${response.status}`);
  }
  const value: unknown = await response.json();
  if (!Array.isArray(value) || !value.every(isCampsiteRecord)) {
    throw new Error("campsites: invalid official dataset");
  }
  return value.map(toPlace);
};
