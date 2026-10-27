import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import StatusLabel from '../components/StatusLabel';
import {
  ShieldAlert,
  GitMerge,
  Edit3,
  UserCheck,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function AdminQueue() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Merge modal
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [targetIncidentId, setTargetIncidentId] = useState('');
  const [mergeNote, setMergeNote] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminQueue();
      if (res.success && res.data) {
        setIncidents(res.data);
      }
    } catch (err) {
      console.error('Failed to load moderation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ['moderator', 'admin'].includes(user.role)) {
      fetchQueue();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user || !['moderator', 'admin'].includes(user.role)) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-warning-ink mx-auto" />
        <h2 className="text-xl font-bold text-ink">Moderator / Admin Access Required</h2>
        <p className="text-xs text-muted leading-relaxed">
          The moderation queue allows authorized reviewers to verify community claims, merge duplicates, and update workflow statuses.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="h-10 px-5 rounded-xl bg-primary text-white text-xs font-semibold shadow-xs"
        >
          Sign in with Moderator Account
        </button>
      </div>
    );
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !newStatus) return;
    setSubmitting(true);
    try {
      await api.updateStatus(selectedIncident._id, newStatus, statusNote);
      setStatusModalOpen(false);
      fetchQueue();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMerge = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !targetIncidentId) return;
    setSubmitting(true);
    try {
      await api.mergeIncidents(selectedIncident._id, targetIncidentId.trim(), mergeNote);
      setMergeModalOpen(false);
      setTargetIncidentId('');
      setMergeNote('');
      fetchQueue();
    } catch (err) {
      alert(err.message || 'Failed to merge incidents');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-primary block mb-1">
            MUNICIPAL ACCOUNTABILITY WORKFLOW
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Moderation & Review Queue
          </h1>
          <p className="text-xs text-muted mt-1">
            {incidents.length} incidents currently requiring community or moderator attention.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted" />
          <span>Refresh queue</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-muted flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
          <span>Loading queue...</span>
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-line p-12 text-center text-muted space-y-2">
          <Check className="w-8 h-8 text-success-ink mx-auto" />
          <h3 className="text-sm font-semibold text-ink">Queue is Clear!</h3>
          <p className="text-xs text-muted">All submitted reports and disputed claims are reviewed.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-canvas text-muted">
                  <th className="py-3 px-4 font-semibold">Incident</th>
                  <th className="py-3 px-4 font-semibold">Ward & Category</th>
                  <th className="py-3 px-4 font-semibold">Current Status</th>
                  <th className="py-3 px-4 font-semibold">Reporter</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {incidents.map((inc) => (
                  <tr key={inc._id} className="hover:bg-canvas/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ink leading-snug max-w-sm truncate">
                        {inc.title}
                      </div>
                      <div className="text-[11px] text-muted truncate max-w-sm mt-0.5">
                        {inc.addressLabel}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <div>{inc.ward}</div>
                      <span className="text-[11px] capitalize text-muted">{inc.category}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusLabel status={inc.status} size="xs" />
                    </td>
                    <td className="py-3.5 px-4 text-muted">
                      <div>{inc.reporterId?.name || 'Citizen'}</div>
                      <div className="text-[10px] font-mono">{inc.reporterId?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/incidents/${inc._id}`)}
                          className="px-2.5 py-1 rounded-lg border border-line hover:border-primary text-xs font-semibold text-ink transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedIncident(inc);
                            setNewStatus(inc.status);
                            setStatusModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-canvas hover:bg-line/60 text-xs font-semibold text-ink border border-line transition"
                        >
                          Status
                        </button>
                        <button
                          onClick={() => {
                            setSelectedIncident(inc);
                            setMergeModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-canvas hover:bg-line/60 text-xs font-semibold text-muted hover:text-ink border border-line transition"
                          title="Merge duplicate"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-line shadow-floating p-6 space-y-4">
            <h3 className="font-semibold text-ink text-sm">Update Incident Status</h3>
            <p className="text-xs text-muted truncate">
              {selectedIncident.title} ({selectedIncident._id})
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                >
                  <option value="Submitted">Submitted (Reported)</option>
                  <option value="UnderReview">Under Review</option>
                  <option value="ReadyForOfficialSubmission">Ready For Official Submission</option>
                  <option value="OfficialComplaintRecorded">Official Complaint Recorded</option>
                  <option value="InProgress">In Progress</option>
                  <option value="RepairClaimed">Repair Claimed (After-photo uploaded)</option>
                  <option value="VerifiedResolved">Verified Resolved (Verified on-ground)</option>
                  <option value="Disputed">Disputed Repair</option>
                  <option value="FollowUpNeeded">Follow Up Needed</option>
                  <option value="FollowUpPrepared">Follow Up Prepared</option>
                  <option value="Reopened">Reopened</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Audit Log Note *
                </label>
                <textarea
                  rows="3"
                  required
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Explain why this status is being transitioned..."
                  className="w-full p-2.5 text-xs rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-medium text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
                >
                  {submitting ? 'Saving...' : 'Apply status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Duplicate Modal */}
      {mergeModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-line shadow-floating p-6 space-y-4">
            <h3 className="font-semibold text-ink text-sm flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-primary" />
              <span>Merge Duplicate Incident</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Consolidate duplicate reports. All photos and IDs will be merged into the primary target incident, and this record will be marked as a Duplicate.
            </p>

            <form onSubmit={handleMerge} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Primary Target Incident ID *
                </label>
                <input
                  type="text"
                  required
                  value={targetIncidentId}
                  onChange={(e) => setTargetIncidentId(e.target.value)}
                  placeholder="Paste 24-character target incident ID"
                  className="w-full h-10 px-3 text-sm font-mono rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Merge Justification Note
                </label>
                <textarea
                  rows="2"
                  value={mergeNote}
                  onChange={(e) => setMergeNote(e.target.value)}
                  placeholder="e.g. Same pothole reported 15 meters away within 24 hours"
                  className="w-full p-2.5 text-xs rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMergeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-medium text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
                >
                  {submitting ? 'Merging...' : 'Confirm merge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
