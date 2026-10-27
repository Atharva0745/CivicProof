import React from 'react';
import { Link } from 'react-router-dom';
import StatusLabel from './StatusLabel';
import { AlertTriangle, Trash2, Droplets, Lightbulb, HelpCircle, ChevronRight, MapPin } from 'lucide-react';

const categoryIcons = {
  pothole: AlertTriangle,
  garbage: Trash2,
  drainage: Droplets,
  streetlight: Lightbulb,
  other: HelpCircle
};

export default function IncidentListRow({ incident, isSelected, onClick }) {
  const Icon = categoryIcons[incident.category] || HelpCircle;

  // Format relative time
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const firstPhoto = incident.evidenceIds?.[0]?.publicUrl;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(incident)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(incident);
        }
      }}
      className={`group w-full flex items-start gap-3.5 px-4 py-3.5 text-left border-b border-line transition cursor-pointer select-none ${
        isSelected
          ? 'bg-primary/5 border-l-3 border-l-primary'
          : 'hover:bg-canvas/80 border-l-3 border-l-transparent'
      }`}
    >
      {/* Thumbnail or Category Symbol */}
      <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-line/40 border border-line flex items-center justify-center">
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="text-muted flex items-center justify-center w-full h-full bg-canvas">
            <Icon className="w-6 h-6 text-primary/70" />
          </div>
        )}
      </div>

      {/* Issue Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-muted truncate">
            {incident.ward} · {incident.category}
          </span>
          <span className="text-[11px] text-muted shrink-0 tabular-nums">
            {getRelativeTime(incident.createdAt)}
          </span>
        </div>

        <h4 className="text-sm font-semibold text-ink leading-snug line-clamp-1 group-hover:text-primary transition">
          {incident.title}
        </h4>

        <div className="flex items-center gap-1.5 text-xs text-muted mt-1 truncate">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-muted/70" />
          <span className="truncate">{incident.addressLabel}</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <StatusLabel status={incident.status} size="xs" />
          <Link
            to={`/incidents/${incident._id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
