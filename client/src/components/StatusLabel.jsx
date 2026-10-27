import React from 'react';
import {
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Wrench,
  FileText,
  ShieldCheck,
  Copy,
  AlertTriangle
} from 'lucide-react';

const statusConfig = {
  Submitted: {
    label: 'Reported (Pending)',
    bg: 'bg-muted/10',
    text: 'text-muted',
    border: 'border-muted/20',
    icon: Clock
  },
  UnderReview: {
    label: 'Under review',
    bg: 'bg-warning-bg',
    text: 'text-warning-ink',
    border: 'border-[#F0DCB0]',
    icon: Search
  },
  ReadyForOfficialSubmission: {
    label: 'Ready for official submission',
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
    icon: FileText
  },
  OfficialComplaintRecorded: {
    label: 'Official reference logged',
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
    icon: ShieldCheck
  },
  InProgress: {
    label: 'In progress',
    bg: 'bg-warning-bg',
    text: 'text-warning-ink',
    border: 'border-[#F0DCB0]',
    icon: Wrench
  },
  RepairClaimed: {
    label: 'Repair claimed · Awaiting review',
    bg: 'bg-warning-bg',
    text: 'text-warning-ink',
    border: 'border-[#F0DCB0]',
    icon: AlertCircle
  },
  VerifiedResolved: {
    label: 'Verified resolved',
    bg: 'bg-success-bg',
    text: 'text-success-ink',
    border: 'border-[#BCE8D1]',
    icon: CheckCircle2
  },
  Disputed: {
    label: 'Disputed repair',
    bg: 'bg-danger-bg',
    text: 'text-danger-ink',
    border: 'border-[#F8C4C1]',
    icon: XCircle
  },
  FollowUpNeeded: {
    label: 'Follow-up needed',
    bg: 'bg-warning-bg',
    text: 'text-warning-ink',
    border: 'border-[#F0DCB0]',
    icon: AlertTriangle
  },
  FollowUpPrepared: {
    label: 'Follow-up prepared',
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
    icon: FileText
  },
  Reopened: {
    label: 'Reopened',
    bg: 'bg-danger-bg',
    text: 'text-danger-ink',
    border: 'border-[#F8C4C1]',
    icon: RotateCcw
  },
  Duplicate: {
    label: 'Duplicate report',
    bg: 'bg-muted/10',
    text: 'text-muted',
    border: 'border-muted/20',
    icon: Copy
  }
};

export default function StatusLabel({ status, size = 'sm' }) {
  const cfg = statusConfig[status] || {
    label: status || 'Unknown',
    bg: 'bg-muted/10',
    text: 'text-muted',
    border: 'border-muted/20',
    icon: Clock
  };

  const Icon = cfg.icon;

  const sizeClasses =
    size === 'xs'
      ? 'text-[11px] px-1.5 py-0.5 gap-1'
      : size === 'md'
      ? 'text-sm px-3 py-1.5 gap-2'
      : 'text-xs px-2 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
    >
      <Icon className={size === 'xs' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{cfg.label}</span>
    </span>
  );
}
