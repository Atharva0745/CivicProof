import React, { useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Plus,
  Edit2,
  Calendar,
  AlertCircle,
  FileCheck2,
  Phone
} from 'lucide-react';

export default function OfficialComplaintPanel({ incident, onRefresh }) {
  const { user, openAuthModal } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [authority, setAuthority] = useState('BMC');
  const [officialReference, setOfficialReference] = useState('');
  const [statusReportedByUser, setStatusReportedByUser] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const complaint = incident.officialComplaintId;
  const isOwner = user && incident.reporterId && user.id === (incident.reporterId._id || incident.reporterId);
  const isModOrAdmin = user && ['moderator', 'admin'].includes(user.role);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.recordOfficialComplaint(incident._id, {
        authority,
        officialReference,
        statusReportedByUser: statusReportedByUser || 'Registered on official portal',
        notes
      });
      setModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to record official complaint reference');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-info" />
          <span>Official Complaint Tracking</span>
        </h3>
        {complaint && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-info/10 text-info">
            Linked
          </span>
        )}
      </div>

      {complaint ? (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-canvas border border-line text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted font-medium">Authority:</span>
              <span className="font-semibold text-ink">{complaint.authority || 'BMC'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted font-medium">Official Reference:</span>
              <span className="font-mono font-bold text-info">
                {complaint.officialReference || 'Confidential / Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted font-medium">Status on Portal:</span>
              <span className="font-medium text-ink">
                {complaint.statusReportedByUser || 'Logged'}
              </span>
            </div>

            {complaint.submittedAt && (
              <div className="flex items-center justify-between text-muted text-[11px]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Submitted date:
                </span>
                <span>{new Date(complaint.submittedAt).toLocaleDateString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Crucial Trust Language Disclaimer */}
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Reporter-provided:</strong> CivicProof records this reference from the user. It has not been independently verified with BMC's internal system.
            </span>
          </div>

          {(isOwner || isModOrAdmin) && (
            <button
              onClick={() => {
                setOfficialReference(complaint.officialReference || '');
                setStatusReportedByUser(complaint.statusReportedByUser || '');
                setModalOpen(true);
              }}
              className="w-full py-2 rounded-xl border border-line text-xs font-semibold text-ink hover:bg-canvas transition flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Update official reference/status</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted leading-relaxed">
            No official complaint reference has been recorded for this CivicProof report yet.
          </p>

          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else {
                setModalOpen(true);
              }
            }}
            className="w-full py-2.5 rounded-xl bg-info/10 text-info hover:bg-info/15 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record official complaint token</span>
          </button>
        </div>
      )}

      {/* Official Links */}
      <div className="pt-2 border-t border-line space-y-1.5 text-xs">
        <span className="text-[11px] font-semibold text-muted block mb-1">
          Official Grievance Portals:
        </span>
        <a
          href="https://portal.mcgm.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-info hover:underline py-1"
        >
          <span>BMC Citizen Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href="https://marg.mcgm.gov.in/MARG/welcomePage.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-info hover:underline py-1"
        >
          <span>BMC MARG Pothole Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <div className="flex items-center justify-between text-ink py-1 font-medium">
          <span className="flex items-center gap-1.5 text-muted">
            <Phone className="w-3 h-3" /> Civic Helpline:
          </span>
          <a href="tel:1916" className="font-bold text-primary hover:underline">1916</a>
        </div>
      </div>

      {/* Record Reference Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-line shadow-floating p-6 space-y-4">
            <h3 className="font-semibold text-ink text-sm">
              Record Official BMC / Government Reference
            </h3>
            <p className="text-xs text-muted">
              Enter the token or reference number you received after submitting this grievance on the official BMC portal or helpline 1916.
            </p>

            {error && (
              <div className="p-3 rounded-lg bg-danger-bg text-danger-ink text-xs">{error}</div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Authority</label>
                <select
                  value={authority}
                  onChange={(e) => setAuthority(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-line bg-surface text-ink outline-none"
                >
                  <option value="BMC">Brihanmumbai Municipal Corporation (BMC)</option>
                  <option value="Maharashtra grievance portal">Maharashtra Grievance Portal (Aaple Sarkar)</option>
                  <option value="other">Other Official Agency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Official Reference Number / Token *
                </label>
                <input
                  type="text"
                  required
                  value={officialReference}
                  onChange={(e) => setOfficialReference(e.target.value)}
                  placeholder="e.g. BMC-2026-HW-99824"
                  className="w-full h-10 px-3 text-sm font-mono rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Status as Shown on Official Portal
                </label>
                <input
                  type="text"
                  value={statusReportedByUser}
                  onChange={(e) => setStatusReportedByUser(e.target.value)}
                  placeholder="e.g. Assigned to Road Engineer"
                  className="w-full h-10 px-3 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Notes / Follow-up History (Optional)
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Called 1916 operator on Monday, promised inspection"
                  className="w-full p-2.5 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-medium text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
                >
                  {submitting ? 'Saving...' : 'Save reference'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
