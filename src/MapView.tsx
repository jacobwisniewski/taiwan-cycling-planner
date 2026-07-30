import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const makePlaceIcon = (kind: PlaceKind): L.DivIcon =>
  L.divIcon({
    className: "place-marker-shell",
    html: `<span class="place-marker" style="--marker:${placeColors[kind]}">${kind === "camp" ? "⌂" : kind === "onsen" ? "♨" : kind === "supply" ? "＋" : "!"}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
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

  useEffect(() => {
    if (containerRef.current === null || mapRef.current !== null) {
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: false,
      minZoom: 7,
      zoomSnap: 0.5,
      maxBounds: [
        [20.9, 119.8],
        [25.7, 122.3],
      ],
    }).setView([23.65, 121], 7.5);

    const cycleLayer = L.tileLayer(
      "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
      {
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://www.cyclosm.org">CyclOSM</a> · routing <a href="https://github.com/abrensch/brouter">BRouter</a>',
      },
    );
    const simpleLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · routing <a href="https://github.com/abrensch/brouter">BRouter</a>',
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

    places
      .filter((place) => visibleKinds.has(place.kind))
      .forEach((place) => {
        const sourceLinks = place.sourceIds
          .map((sourceId) => sources.find((source) => source.id === sourceId))
          .filter((source) => source !== undefined)
          .map(
            (source) =>
              `<a href="${source.url}" target="_blank" rel="noreferrer">${source.publisher}</a>`,
          )
          .join(" · ");
        L.marker([place.lat, place.lng], {
          icon: makePlaceIcon(place.kind),
        })
          .bindPopup(
            `<div class="map-popup"><small>${place.sleepStyle ?? place.kind}</small><strong>${place.name}</strong><p>${place.note}</p><em>${place.verified ? "Location checked" : "Lead — verify before travel"}</em><div>${sourceLinks}</div><a class="maps-link" href="${place.mapsUrl}" target="_blank" rel="noreferrer">Open in Google Maps ↗</a></div>`,
          )
          .addTo(layer);
      });
  }, [
    start,
    days,
    routedSegments,
    failedDayIds,
    places,
    sources,
    visibleKinds,
    selectedDayId,
    onMoveStart,
    onMoveDay,
    onSelectDay,
  ]);

  useEffect(() => {
    const selected = days.find((day) => day.id === selectedDayId);
    if (selected !== undefined) {
      mapRef.current?.flyTo([selected.lat, selected.lng], 10, {
        duration: 0.8,
      });
    }
  }, [days, selectedDayId]);

  return <div ref={containerRef} className="map" aria-label="Route map" />;
}
