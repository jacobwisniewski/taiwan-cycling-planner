import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";

import type {
  Coordinates,
  Place,
  PlaceKind,
  RouteDay,
  RoutedSegment,
  Source,
} from "./types";

type MapViewProps = {
  start: Coordinates & { name: string };
  days: RouteDay[];
  routedSegments: RoutedSegment[];
  failedDayIds: Set<string>;
  places: Place[];
  sources: Source[];
  visibleKinds: Set<PlaceKind>;
  selectedDayId: string | null;
  onSelectDay: (id: string) => void;
  onMoveStart: (lat: number, lng: number) => void;
  onMoveDay: (id: string, lat: number, lng: number) => void;
};

const placeColors: Record<PlaceKind, string> = {
  camp: "#28745d",
  onsen: "#c9603b",
  supply: "#d29f32",
  caution: "#a43d36",
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const makePlaceIcon = (place: Place): L.DivIcon => {
  const markerColor =
    place.kind === "camp" && place.campCompliance === "violation"
      ? placeColors.caution
      : placeColors[place.kind];
  const symbol =
    place.kind === "camp"
      ? place.campCompliance === "violation"
        ? "!"
        : "⌂"
      : place.kind === "onsen"
        ? "♨"
        : place.kind === "supply"
          ? "＋"
          : "!";

  return L.divIcon({
    className: "place-marker-shell",
    html: `<span class="place-marker" style="--marker:${markerColor}">${symbol}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const makeClusterIcon = (cluster: L.MarkerCluster): L.DivIcon =>
  L.divIcon({
    className: "camp-cluster-shell",
    html: `<span class="camp-cluster"><strong>${cluster.getChildCount()}</strong><small>places</small></span>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

const makeDayIcon = (day: number, selected: boolean): L.DivIcon =>
  L.divIcon({
    className: "day-marker-shell",
    html: `<span class="day-marker${selected ? " is-selected" : ""}">${day}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const startIcon = L.divIcon({
  className: "start-marker-shell",
  html: '<span class="start-marker">START<small>Taipei</small></span>',
  iconSize: [60, 38],
  iconAnchor: [30, 35],
});

export function MapView({
  start,
  days,
  routedSegments,
  failedDayIds,
  places,
  sources,
  visibleKinds,
  selectedDayId,
  onSelectDay,
  onMoveStart,
  onMoveDay,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const placeLayerRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (containerRef.current === null || mapRef.current !== null) {
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: false,
      minZoom: 7,
      zoomSnap: 0.5,
    }).setView([23.65, 121], 7.5);

    const cycleLayer = L.tileLayer(
      "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
      {
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://www.cyclosm.org">CyclOSM</a> · routing <a href="https://github.com/abrensch/brouter">BRouter</a> · camps <a href="https://data.gov.tw/en/datasets/132066">Taiwan Tourism Administration</a>',
      },
    );
    const simpleLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · routing <a href="https://github.com/abrensch/brouter">BRouter</a> · camps <a href="https://data.gov.tw/en/datasets/132066">Taiwan Tourism Administration</a>',
      },
    );
    cycleLayer.addTo(map);
    L.control
      .layers(
        { "Cycle map": cycleLayer, "Simple map": simpleLayer },
        undefined,
        { position: "bottomright" },
      )
      .addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null) {
      return;
    }

    routeLayerRef.current?.remove();
    const layer = L.layerGroup().addTo(map);
    routeLayerRef.current = layer;

    days.forEach((day, index) => {
      const segment = routedSegments.find(
        (candidate) => candidate.dayId === day.id,
      );
      const previous = index === 0 ? start : days[index - 1];
      const coordinates: [number, number][] =
        segment?.coordinates.map(
          ([lng, lat]): [number, number] => [lat, lng],
        ) ?? [
          [previous.lat, previous.lng],
          [day.lat, day.lng],
        ];

      L.polyline(coordinates, {
        color: "#f3e7c9",
        weight: segment === undefined ? 5 : 8,
        opacity: segment === undefined ? 0.7 : 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layer);
      L.polyline(coordinates, {
        color: failedDayIds.has(day.id) ? "#9a5446" : "#c94f32",
        weight: segment === undefined ? 2 : 4,
        opacity: segment === undefined ? 0.72 : 1,
        lineCap: "round",
        lineJoin: "round",
        dashArray: segment === undefined ? "4 8" : undefined,
      })
        .bindTooltip(
          segment === undefined
            ? `Day ${day.day} · ${failedDayIds.has(day.id) ? "Routing unavailable" : "Routing roads…"}`
            : `Day ${day.day} · ${segment.distance.toFixed(1)} km · ${Math.round(segment.climbing)} m up`,
          { sticky: true },
        )
        .addTo(layer);
    });

    const startMarker = L.marker([start.lat, start.lng], {
      draggable: true,
      icon: startIcon,
      zIndexOffset: 1100,
    }).addTo(layer);
    startMarker.bindTooltip(`<strong>Start · ${start.name}</strong>`, {
      direction: "top",
      offset: [0, -29],
    });
    startMarker.on("dragend", () => {
      const position = startMarker.getLatLng();
      onMoveStart(position.lat, position.lng);
    });

    days.forEach((day) => {
      const segment = routedSegments.find(
        (candidate) => candidate.dayId === day.id,
      );
      const marker = L.marker([day.lat, day.lng], {
        draggable: true,
        icon: makeDayIcon(day.day, day.id === selectedDayId),
        zIndexOffset: day.id === selectedDayId ? 1000 : 0,
      }).addTo(layer);
      marker.bindTooltip(
        `<strong>Day ${day.day} · ${day.to}</strong><br>${segment?.distance.toFixed(1) ?? day.distance} km · ${day.camp}`,
        { direction: "top", offset: [0, -13] },
      );
      marker.on("click", () => onSelectDay(day.id));
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        onMoveDay(day.id, position.lat, position.lng);
      });
    });

  }, [
    start,
    days,
    routedSegments,
    failedDayIds,
    selectedDayId,
    onMoveStart,
    onMoveDay,
    onSelectDay,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null) {
      return;
    }

    placeLayerRef.current?.remove();
    const layer = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 30,
      disableClusteringAtZoom: 14,
      iconCreateFunction: makeClusterIcon,
      maxClusterRadius: 48,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
    }).addTo(map);
    placeLayerRef.current = layer;

    places
      .filter((place) => visibleKinds.has(place.kind))
      .forEach((place) => {
        const sourceLinks = place.sourceIds
          .map((sourceId) => sources.find((source) => source.id === sourceId))
          .filter((source) => source !== undefined)
          .map(
            (source) =>
              `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.publisher)}</a>`,
          )
          .join(" · ");
        const websiteLink =
          place.websiteUrl === undefined
            ? ""
            : `<a href="${escapeHtml(place.websiteUrl)}" target="_blank" rel="noreferrer">Campsite website ↗</a>`;
        const translationLink =
          place.translationUrl === undefined
            ? ""
            : `<a href="${escapeHtml(place.translationUrl)}" target="_blank" rel="noreferrer">English translation ↗</a>`;
        L.marker([place.lat, place.lng], {
          icon: makePlaceIcon(place),
        })
          .bindPopup(
            `<div class="map-popup"><small>${escapeHtml(place.sleepStyle ?? place.kind)}</small><strong>${escapeHtml(place.name)}</strong><p>${escapeHtml(place.note)}</p><em>${escapeHtml(place.statusLabel ?? (place.verified ? "Location checked" : "Lead — verify before travel"))}</em><div>${sourceLinks}</div><div class="map-popup__links">${websiteLink}${translationLink}<a class="maps-link" href="${escapeHtml(place.mapsUrl)}" target="_blank" rel="noreferrer">Google Maps ↗</a></div></div>`,
          )
          .addTo(layer);
      });

    return () => {
      layer.remove();
      if (placeLayerRef.current === layer) {
        placeLayerRef.current = null;
      }
    };
  }, [places, sources, visibleKinds]);

  return <div ref={containerRef} className="map" aria-label="Route map" />;
}
