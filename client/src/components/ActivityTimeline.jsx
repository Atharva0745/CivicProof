import React from 'react';
import {
  Clock,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  XCircle,
  FileText,
  Copy,
  RotateCcw,
  User,
  Info
} from 'lucide-react';

const eventIcons = {
  INCIDENT_CREATED: { icon: Clock, color: 'text-primary bg-primary/10 border-primary/20' },
  OFFICIAL_COMPLAINT_RECORDED: { icon: ShieldCheck, color: 'text-info bg-info/10 border-info/20' },
  OFFICIAL_STATUS_UPDATED: { icon: FileText, color: 'text-info bg-info/10 border-info/20' },
  RESOLUTION_CLAIMED: { icon: Wrench, color: 'text-warning-ink bg-warning-bg border-[#F0DCB0]' },
  VERIFIED_RESOLVED: { icon: CheckCircle2, color: 'text-success-ink bg-success-bg border-[#BCE8D1]' },
  RESOLUTION_DISPUTED: { icon: XCircle, color: 'text-danger-ink bg-danger-bg border-[#F8C4C1]' },
  INCIDENT_REOPENED: { icon: RotateCcw, color: 'text-danger-ink bg-danger-bg border-[#F8C4C1]' },
  FOLLOW_UP_PREPARED: { icon: FileText, color: 'text-info bg-info/10 border-info/20' },
  INCIDENT_MERGED_OUT: { icon: Copy, color: 'text-muted bg-muted/10 border-muted/20' },
  INCIDENT_MERGED_IN: { icon: Copy, color: 'text-muted bg-muted/10 border-muted/20' },
  STATUS_CHANGED: { icon: Info, color: 'text-primary bg-primary/10 border-primary/20' },
  INCIDENT_ASSIGNED: { icon: User, color: 'text-muted bg-muted/10 border-muted/20' }
};

export default function ActivityTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted">
        No recorded activity events yet.
      </div>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-line">
      {events.map((ev, index) => {
        const config = eventIcons[ev.action] || {
          icon: Info,
          color: 'text-muted bg-muted/10 border-muted/20'
        };
        const Icon = config.icon;

        return (
          <div key={ev._id || index} className="relative group">
            {/* Timeline node icon */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${config.color}`}
            >
              <Icon className="w-2.5 h-2.5" />
            </div>

            {/* Event Content */}
            <div className="text-xs">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-semibold text-ink">
                  {ev.action.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-muted font-mono tabular-nums">
                  {formatDate(ev.createdAt)}
                </span>
              </div>

              <div className="text-muted leading-relaxed">
                {ev.note || 'Status or verification update recorded.'}
              </div>

              {ev.actorId && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted/80">
                  <User className="w-3 h-3 text-muted" />
                  <span>
                    By {ev.actorId.name || 'Citizen'} ({ev.actorId.role || 'citizen'})
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
