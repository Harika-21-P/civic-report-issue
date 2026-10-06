"use client";

import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";

type Point = { latitude: number; longitude: number } | null;

function ClickHandler({ onChange }: { onChange: (point: NonNullable<Point>) => void }) {
  useMapEvents({ click(event) { onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng }); } });
  return null;
}
function Recenter({ point }: { point: Point }) {
  const map = useMap();
  useEffect(() => { if (point) map.flyTo([point.latitude, point.longitude], Math.max(map.getZoom(), 16), { duration: .45 }); }, [map, point]);
  return null;
}
export default function MapPicker({ point, onChange }: { point: Point; onChange: (point: NonNullable<Point>) => void }) {
  const center: [number, number] = point ? [point.latitude, point.longitude] : [19.0760, 72.8777];
  return <MapContainer center={center} zoom={point ? 16 : 12} scrollWheelZoom style={{ height: "100%", width: "100%" }}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><ClickHandler onChange={onChange}/><Recenter point={point}/>{point && <CircleMarker center={center} radius={10} pathOptions={{ color: "#075fba", fillColor: "#075fba", fillOpacity: .7 }} />}</MapContainer>;
}
