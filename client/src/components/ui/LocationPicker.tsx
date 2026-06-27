"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Geoapify-backed location picker: search a place (forward geocoding) or drop/drag a
// pin on a MapLibre map; emits { latitude, longitude }. Reverse-geocodes the pin so
// the partner can confirm the address. Key comes from NEXT_PUBLIC_GEOAPIFY_KEY — when
// it is absent the component degrades to plain lat/lng number inputs so the form
// still works before credentials are wired.

export type LatLng = { latitude: number; longitude: number };

type Props = {
  latitude?: number;
  longitude?: number;
  onChange: (value: LatLng) => void;
  error?: string;
  /** Map fallback centre when no coords are set yet (defaults to India). */
  defaultCenter?: [number, number]; // [lng, lat]
};

type GeoFeature = {
  geometry: { coordinates: [number, number] };
  properties: { formatted?: string; address_line1?: string };
};

const KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
const GEOCODE = "https://api.geoapify.com/v1/geocode";
const STYLE = `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${KEY}`;

export default function LocationPicker({ latitude, longitude, onChange, error, defaultCenter }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolved, setResolved] = useState<string | null>(null);

  const hasCoords = typeof latitude === "number" && typeof longitude === "number" && !Number.isNaN(latitude) && !Number.isNaN(longitude);

  // Reverse-geocode a point into a human-readable address (best effort).
  async function reverseGeocode(lng: number, lat: number) {
    if (!KEY) return;
    try {
      const res = await fetch(`${GEOCODE}/reverse?lat=${lat}&lon=${lng}&format=geojson&apiKey=${KEY}`);
      const json = (await res.json()) as { features?: GeoFeature[] };
      setResolved(json.features?.[0]?.properties.formatted ?? null);
    } catch {
      setResolved(null);
    }
  }

  // Move the pin + notify the parent + refresh the resolved address.
  function setPoint(lng: number, lat: number, fly = false) {
    const map = mapRef.current;
    if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
    if (fly && map) map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 13) });
    onChange({ latitude: lat, longitude: lng });
    void reverseGeocode(lng, lat);
  }

  // ── Initialise the map once (client-only dynamic import keeps SSR safe) ───────
  useEffect(() => {
    if (!KEY || !containerRef.current || mapRef.current) return;
    let disposed = false;

    void (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (disposed || !containerRef.current) return;

      const center: [number, number] = hasCoords
        ? [longitude as number, latitude as number]
        : defaultCenter ?? [78.9629, 20.5937];

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE,
        center,
        zoom: hasCoords ? 14 : 4,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      const marker = new maplibregl.Marker({ draggable: true, color: "#c1440e" })
        .setLngLat(center)
        .addTo(map);
      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat();
        setPoint(lng, lat);
      });

      map.on("click", (e) => setPoint(e.lngLat.lng, e.lngLat.lat));

      mapRef.current = map;
      markerRef.current = marker;
      if (hasCoords) void reverseGeocode(longitude as number, latitude as number);
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Init once; subsequent coord changes are reflected by the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the pin in sync if the parent sets coords externally (e.g. reset/edit).
  useEffect(() => {
    if (!hasCoords || !markerRef.current) return;
    markerRef.current.setLngLat([longitude as number, latitude as number]);
  }, [latitude, longitude, hasCoords]);

  async function runSearch() {
    if (!KEY || !query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${GEOCODE}/search?text=${encodeURIComponent(query.trim())}&format=geojson&limit=5&apiKey=${KEY}`);
      const json = (await res.json()) as { features?: GeoFeature[] };
      setResults(json.features ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function pick(feature: GeoFeature) {
    const [lng, lat] = feature.geometry.coordinates;
    setQuery(feature.properties.formatted ?? "");
    setResults([]);
    setPoint(lng, lat, true);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setPoint(pos.coords.longitude, pos.coords.latitude, true);
    });
  }

  // ── Fallback: no key yet → manual numeric inputs ─────────────────────────────
  if (!KEY) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Latitude *" value={latitude} error={error}
          onChange={(v) => onChange({ latitude: v, longitude: longitude ?? 0 })} />
        <NumberField label="Longitude *" value={longitude}
          onChange={(v) => onChange({ latitude: latitude ?? 0, longitude: v })} />
        <p className="text-[12px] text-ink-muted sm:col-span-2">
          Map picker unavailable — set <code>NEXT_PUBLIC_GEOAPIFY_KEY</code> to enable search &amp; pin dropping.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void runSearch(); } }}
            placeholder="Search for the hotel address or landmark…"
            className="w-full rounded-lg border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
          {results.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-white shadow-lg">
              {results.map((f, i) => (
                <li key={i}>
                  <button type="button" onClick={() => pick(f)}
                    className="block w-full px-4 py-2 text-left text-[13px] text-ink hover:bg-surface-muted">
                    {f.properties.formatted ?? f.properties.address_line1}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={() => void runSearch()} disabled={searching}
          className="rounded-lg bg-brand-600 px-4 py-2 text-[14px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {searching ? "Searching…" : "Search"}
        </button>
        <button type="button" onClick={useMyLocation}
          className="rounded-lg border border-border px-4 py-2 text-[14px] font-semibold text-ink-soft hover:border-brand-400">
          Use my location
        </button>
      </div>

      <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-lg border border-border" />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-muted">
        <span>Drag the pin or click the map to set the exact location.</span>
        {hasCoords && (
          <span className="font-mono">
            {(latitude as number).toFixed(6)}, {(longitude as number).toFixed(6)}
          </span>
        )}
      </div>
      {resolved && <p className="text-[12px] text-ink-soft">📍 {resolved}</p>}
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  );
}

function NumberField({ label, value, error, onChange }: { label: string; value?: number; error?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-brand-950">{label}</label>
      <input
        type="number"
        step="0.000001"
        value={value ?? ""}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600 ${error ? "border-danger-500" : "border-border"}`}
        placeholder={label.replace(" *", "")}
      />
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
}
