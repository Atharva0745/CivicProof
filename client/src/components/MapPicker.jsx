import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

export default function MapPicker({ coordinates = [72.8777, 19.076], onChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const [initLng, initLat] = coordinates;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initLat, initLng],
        zoom: 14,
        zoomControl: true
      });

      // Free OpenStreetMap tile layer (No API key required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Custom draggable marker
      const markerIcon = L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div style="background-color: #176B5B; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 16px;">
            📍
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      const marker = L.marker([initLat, initLng], {
        draggable: true,
        icon: markerIcon
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        if (onChange) {
          onChange([
            parseFloat(pos.lng.toFixed(6)),
            parseFloat(pos.lat.toFixed(6))
          ]);
        }
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        if (onChange) {
          onChange([
            parseFloat(e.latlng.lng.toFixed(6)),
            parseFloat(e.latlng.lat.toFixed(6))
          ]);
        }
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync coords if updated externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && coordinates) {
      const [lng, lat] = coordinates;
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [coordinates]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
          markerRef.current.setLatLng([latitude, longitude]);
          if (onChange) {
            onChange([
              parseFloat(longitude.toFixed(6)),
              parseFloat(latitude.toFixed(6))
            ]);
          }
        }
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        alert('Could not retrieve your location. Please drop the pin manually on the map.');
      }
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-line bg-canvas">
      <div ref={mapContainerRef} className="w-full h-64 md:h-72 z-10" />

      {/* Geolocate Button */}
      <button
        type="button"
        onClick={handleUseMyLocation}
        className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-surface border border-line text-xs font-semibold text-ink shadow-floating hover:border-primary hover:text-primary transition"
      >
        <Navigation className="w-3.5 h-3.5 text-primary" />
        <span>Use my location</span>
      </button>

      {/* Coordinate Display */}
      <div className="px-4 py-2 bg-surface border-t border-line flex items-center justify-between text-xs text-muted">
        <span>Click anywhere or drag the pin to adjust</span>
        <span className="font-mono text-[11px] text-ink">
          Lng: {coordinates[0]?.toFixed(4)}, Lat: {coordinates[1]?.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
