"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const RESORT_LAT = 14.363458;
const RESORT_LNG = 120.877718;
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${RESORT_LAT},${RESORT_LNG}`;

export default function ResortMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Custom teal pin matching brand primary color
    const customIcon = L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
        ">
          <div style="
            position: absolute;
            inset: 0;
            background: hsl(160, 65%, 45%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 16px rgba(41,184,153,0.5);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -36],
      className: "",
    });

    const map = L.map(mapRef.current, {
      center: [RESORT_LAT, RESORT_LNG],
      zoom: 15,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([RESORT_LAT, RESORT_LNG], { icon: customIcon }).addTo(map);

    marker
      .bindPopup(
        `<div style="min-width:180px; font-family: inherit; line-height: 1.5;">
          <strong style="font-size:14px; display:block; margin-bottom:2px;">Kampo Ibayo Resort</strong>
          <span style="font-size:12px; color:#6b7280; display:block; margin-bottom:8px;">
            Brgy. Tapia, General Trias, Cavite
          </span>
          <a
            href="${DIRECTIONS_URL}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
              font-weight: 600;
              color: white;
              background: hsl(160, 65%, 45%);
              padding: 4px 12px;
              border-radius: 6px;
              text-decoration: none;
            "
          >
            Get Directions →
          </a>
        </div>`,
        { maxWidth: 220 }
      )
      .openPopup();

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
}
