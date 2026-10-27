import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import StatusLabel from '../components/StatusLabel';
import {
  Layers,
  PlusCircle,
  AlertTriangle,
  ChevronRight,
  Calendar,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function MyReports() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // 'all' | 'needs_attention' | 'resolved'

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchMyIncidents = async () => {
      try {
        setLoading(true);
        // Fetch all incidents and filter by logged-in user
        const res = await api.getIncidents({ limit: 100 });
        if (res.success && res.data) {
          const userReports = res.data.filter(
            (i) => (i.reporterId?._id || i.reporterId) === user.id
          );
          setIncidents(userReports);
        }
      } catch (err) {
        console.error('Failed to load user reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyIncidents();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-ink">Sign in to View Your Reports</h2>
        <p className="text-xs text-muted leading-relaxed">
          Access your submitted civic reports, follow up on official references, and track verification history.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="h-10 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs"
        >
          Sign in or Register
        </button>
      </div>
    );
  }

  // Filtered by tab
  const filtered = incidents.filter((item) => {
    if (tab === 'needs_attention') {
      return ['Submitted', 'UnderReview', 'RepairClaimed', 'Disputed', 'FollowUpNeeded'].includes(
        item.status
      );
    }
    if (tab === 'resolved') {
      return item.status === 'VerifiedResolved';
    }
    return true;
  });

  const needsAttentionCount = incidents.filter((i) =>
    ['Submitted', 'UnderReview', 'RepairClaimed', 'Disputed', 'FollowUpNeeded'].includes(i.status)
  ).length;

  const resolvedCount = incidents.filter((i) => i.status === 'VerifiedResolved').length;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Title & Compact Summary Line (Section 8) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">My Reports</h1>
          {/* Dense summary line */}
          <p className="text-xs text-muted mt-1 font-medium">
            <strong className="text-ink font-semibold">{incidents.length} reports</strong> · {needsAttentionCount} awaiting review · {resolvedCount} verified resolved
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report new issue</span>
        </Link>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-line gap-6 text-xs font-semibold">
        <button
          onClick={() => setTab('all')}
          className={`pb-3 transition border-b-2 ${
            tab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          All reports ({incidents.length})
        </button>
        <button
          onClick={() => setTab('needs_attention')}
          className={`pb-3 transition border-b-2 ${
            tab === 'needs_attention'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Needs attention ({needsAttentionCount})
        </button>
        <button
          onClick={() => setTab('resolved')}
          className={`pb-3 transition border-b-2 ${
            tab === 'resolved'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Verified resolved ({resolvedCount})
        </button>
      </div>

      {/* Dense List Rows */}
      {loading ? (
        <div className="py-12 text-center text-xs text-muted flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
          <span>Loading your reports...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-line p-12 text-center space-y-3">
          <Layers className="w-8 h-8 text-muted/60 mx-auto" />
          <h3 className="text-sm font-semibold text-ink">No reports in this view</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {tab === 'all'
              ? 'You have not submitted any civic reports yet. Help document road defects or sanitation issues in your Mumbai neighborhood.'
              : 'No items currently in this category.'}
          </p>
          {tab === 'all' && (
            <Link
              to="/report"
              className="inline-block px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold mt-2"
            >
              Submit your first report
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-line overflow-hidden divide-y divide-line">
          {filtered.map((item) => {
            const firstPhoto = item.evidenceIds?.[0]?.publicUrl;
            return (
              <div
                key={item._id}
                onClick={() => navigate(`/incidents/${item._id}`)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-canvas transition cursor-pointer gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-canvas border border-line overflow-hidden shrink-0 flex items-center justify-center">
                    {firstPhoto ? (
                      <img src={firstPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-muted" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-muted mb-0.5">
                      <span className="font-semibold uppercase text-primary">
                        {item.ward} · {item.category}
                      </span>
                      <span>•</span>
                      <span className="tabular-nums">
                        {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-ink group-hover:text-primary transition truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted truncate mt-0.5">{item.addressLabel}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <StatusLabel status={item.status} size="xs" />
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
