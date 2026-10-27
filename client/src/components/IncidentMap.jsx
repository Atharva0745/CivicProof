import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair } from 'lucide-react';

const MUMBAI_CENTER = [19.076, 72.8777];

// Status color mappings for map marker circles
const statusPinStyles = {
  Submitted: { bg: '#68736F', border: '#FFFFFF', icon: '⚠️' },
  UnderReview: { bg: '#805500', border: '#FFF3D8', icon: '🔍' },
  OfficialComplaintRecorded: { bg: '#245FC7', border: '#EBF3FF', icon: '🏛️' },
  InProgress: { bg: '#C07D00', border: '#FFF3D8', icon: '🛠️' },
  RepairClaimed: { bg: '#E07A10', border: '#FFF3D8', icon: '📸' },
  VerifiedResolved: { bg: '#176443', border: '#E2F4EA', icon: '✅' },
  Disputed: { bg: '#A12D25', border: '#FDE9E7', icon: '❌' },
  Reopened: { bg: '#A12D25', border: '#FDE9E7', icon: '🔄' },
  Duplicate: { bg: '#8C9692', border: '#E1E6E2', icon: '📑' }
};

export default function IncidentMap({
  incidents = [],
  selectedIncidentId = null,
  onSelectIncident,
  height = '100%'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const navigate = useNavigate();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: MUMBAI_CENTER,
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      // Free OpenStreetMap tile layer (No API key required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Custom zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersGroupRef.current = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Markers with Incidents
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    incidents.forEach((inc) => {
      const coords = inc.location?.coordinates;
      if (!coords || coords.length !== 2) return;
      const [lng, lat] = coords;

      const isSelected = selectedIncidentId === inc._id;
      const pinCfg = statusPinStyles[inc.status] || statusPinStyles.Submitted;

      // Custom HTML Marker icon
      const customIcon = L.divIcon({
        className: 'custom-map-icon-container',
        html: `
          <div class="custom-civic-pin ${isSelected ? 'selected' : ''}"
               style="background-color: ${pinCfg.bg}; width: ${isSelected ? 38 : 30}px; height: ${isSelected ? 38 : 30}px; border: 2.5px solid ${pinCfg.border};">
            <span style="font-size: ${isSelected ? 16 : 13}px;">${pinCfg.icon}</span>
          </div>
        `,
        iconSize: [isSelected ? 38 : 30, isSelected ? 38 : 30],
        iconAnchor: [isSelected ? 19 : 15, isSelected ? 19 : 15]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Click on pin
      marker.on('click', () => {
        if (onSelectIncident) {
          onSelectIncident(inc);
        }
      });

      // Bind informative popup
      const firstPhoto = inc.evidenceIds?.[0]?.publicUrl;
      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px; max-width: 230px;">
          ${
            firstPhoto
              ? `<img src="${firstPhoto}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />`
              : ''
          }
          <div style="font-size: 10px; font-weight: 700; color: #68736F; text-transform: uppercase;">
            ${inc.ward} · ${inc.category}
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #17211F; margin: 2px 0 6px 0; line-height: 1.3;">
            ${inc.title}
          </div>
          <div style="font-size: 11px; color: #68736F; margin-bottom: 8px;">
            ${inc.addressLabel}
          </div>
          <button id="view-report-${inc._id}" style="width: 100%; background: #176B5B; color: white; border: none; border-radius: 6px; padding: 6px 10px; font-size: 11px; font-weight: 600; cursor: pointer;">
            View full report →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-report-${inc._id}`);
        if (btn) {
          btn.onclick = () => navigate(`/incidents/${inc._id}`);
        }
      });

      group.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
        map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
      }
    });
  }, [incidents, selectedIncidentId, onSelectIncident, navigate]);

  // Handle Recentering
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(MUMBAI_CENTER, 12, { animate: true });
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-line/20" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          title="Recenter Mumbai"
          className="w-9 h-9 rounded-xl bg-surface border border-line shadow-floating flex items-center justify-center text-ink hover:text-primary transition"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 bg-surface/95 backdrop-blur-xs border border-line rounded-xl px-3 py-2 text-[11px] shadow-floating flex items-center gap-3">
        <span className="font-semibold text-ink text-[10px] uppercase tracking-wider">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#68736F]" />
          <span className="text-muted">Reported (Pending)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#245FC7]" />
          <span className="text-muted">Official logged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E07A10]" />
          <span className="text-muted">Repair claimed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#176443]" />
          <span className="text-muted">Verified</span>
        </div>
      </div>
    </div>
  );
}
