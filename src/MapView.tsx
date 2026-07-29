import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Place, PlaceKind, RouteDay, Source } from "./types";

type MapViewProps = {
  days: RouteDay[];
  places: Place[];
  sources: Source[];
  visibleKinds: Set<PlaceKind>;
  selectedDayId: string | null;
  onSelectDay: (id: string) => void;
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

export function MapView({
  days,
  places,
  sources,
  visibleKinds,
  selectedDayId,
  onSelectDay,
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
      maxBounds: [
        [20.9, 119.8],
        [25.7, 122.3],
      ],
    }).setView([23.7, 121], 8);

    const cycleLayer = L.tileLayer(
      "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
      {
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://www.cyclosm.org">CyclOSM</a>',
      },
    );
    const simpleLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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
    const start: [number, number] = [25.033, 121.5654];
    const coordinates: [number, number][] = [
      start,
      ...days.map((day): [number, number] => [day.lat, day.lng]),
    ];

    L.polyline(coordinates, {
      color: "#f3e7c9",
      weight: 9,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(layer);
    L.polyline(coordinates, {
      color: "#c94f32",
      weight: 4,
      opacity: 1,
      lineCap: "round",
      lineJoin: "round",
      dashArray: "2 9",
    }).addTo(layer);

    days.forEach((day) => {
      const marker = L.marker([day.lat, day.lng], {
        draggable: true,
        icon: makeDayIcon(day.day, day.id === selectedDayId),
        zIndexOffset: day.id === selectedDayId ? 1000 : 0,
      }).addTo(layer);
      marker.bindTooltip(
        `<strong>Day ${day.day} · ${day.to}</strong><br>${day.distance} km · ${day.camp}`,
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
    days,
    places,
    sources,
    visibleKinds,
    selectedDayId,
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
