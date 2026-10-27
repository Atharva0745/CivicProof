import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { joinIncidentRoom, leaveIncidentRoom, getSocket } from '../api/socket';
import StatusLabel from '../components/StatusLabel';
import EvidenceGallery from '../components/EvidenceGallery';
import ActivityTimeline from '../components/ActivityTimeline';
import OfficialComplaintPanel from '../components/OfficialComplaintPanel';
import EscalationWizard from '../components/EscalationWizard';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  Share2,
  Shield,
  HelpCircle,
  Edit3
} from 'lucide-react';

export default function IncidentDetails() {
  const { id } = useParams();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimFile, setClaimFile] = useState(null);
  const [claimNote, setClaimNote] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verdict, setVerdict] = useState('accepted');
  const [verifyNote, setVerifyNote] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  // Moderator status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Citizen / Mod Reopen modal
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getIncidentById(id);
      if (res.success && res.data) {
        setIncident(res.data);
        setTimeline(res.timeline || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load incident record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    joinIncidentRoom(id);

    const socket = getSocket();
    if (socket) {
      const handleUpdate = () => {
        console.log('[Socket] Incident update received on page');
        fetchDetails();
      };
      socket.on('incident:updated', handleUpdate);
      socket.on('incident:status-changed', handleUpdate);
      socket.on('incident:resolution-claimed', handleUpdate);
      socket.on('incident:verification-updated', handleUpdate);

      return () => {
        leaveIncidentRoom(id);
        socket.off('incident:updated', handleUpdate);
        socket.off('incident:status-changed', handleUpdate);
        socket.off('incident:resolution-claimed', handleUpdate);
        socket.off('incident:verification-updated', handleUpdate);
      };
    }
  }, [id]);

  const handleClaimResolution = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    setSubmittingClaim(true);
    try {
      const formData = new FormData();
      if (claimFile) {
        formData.append('photo', claimFile);
      }
      formData.append('note', claimNote || 'Repair claimed with evidence photograph');

      await api.claimResolution(id, formData);
      setClaimModalOpen(false);
      setClaimFile(null);
      setClaimNote('');
      fetchDetails();
    } catch (err) {
      alert(err.message || 'Failed to record repair claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleVerifyOrDispute = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    setSubmittingVerify(true);
    try {
      await api.verifyResolution(id, {
        verdict,
        note: verifyNote || (verdict === 'accepted' ? 'Verified on-ground' : 'Repair disputed')
      });
      setVerifyModalOpen(false);
      setVerifyNote('');
      fetchDetails();
    } catch (err) {
      alert(err.message || 'Failed to record verification');
    } finally {
      setSubmittingVerify(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: incident.title,
        text: `CivicProof Mumbai: ${incident.title} at ${incident.addressLabel}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Report link copied to clipboard!');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setSubmittingStatus(true);
    try {
      await api.updateStatus(id, newStatus, statusNote);
      setStatusModalOpen(false);
      setStatusNote('');
      fetchDetails();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleReopenIncident = async (e) => {
    e.preventDefault();
    if (!reopenReason) return;
    setSubmittingReopen(true);
    try {
      await api.reopenIncident(id, reopenReason);
      setReopenModalOpen(false);
      setReopenReason('');
      fetchDetails();
    } catch (err) {
      alert(err.message || 'Failed to reopen incident');
    } finally {
      setSubmittingReopen(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-16 text-center text-xs text-muted">
        Loading incident dossier and timeline...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-danger-ink mx-auto" />
        <h3 className="text-sm font-semibold text-ink">Incident Record Unavailable</h3>
        <p className="text-xs text-muted">{error || 'Incident was not found.'}</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold"
        >
          Return to map
        </Link>
      </div>
    );
  }

  const isOwner = user && incident.reporterId && user.id === (incident.reporterId._id || incident.reporterId);
  const isModOrAdmin = user && ['moderator', 'admin'].includes(user.role);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Explore map</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas transition"
          >
            <Share2 className="w-3.5 h-3.5 text-muted" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-surface rounded-2xl border border-line p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {incident.ward} · {incident.category}
            </span>
            <span className="text-line">•</span>
            <span className="font-mono text-xs text-muted">ID: {incident._id}</span>
          </div>
          <StatusLabel status={incident.status} size="md" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight leading-snug">
          {incident.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="text-ink font-medium">{incident.addressLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted shrink-0" />
            <span>
              Reported on {new Date(incident.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-line">
          {/* Claim resolution with after-photo - when repair has occurred */}
          {incident.status !== 'VerifiedResolved' && (
            <button
              onClick={() => setClaimModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Upload repair after-photo</span>
            </button>
          )}

          {/* Prepare escalation dossier button */}
          {incident.status !== 'VerifiedResolved' && (
            <button
              onClick={() => setEscalationOpen(true)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-line bg-surface text-ink text-xs font-semibold hover:bg-canvas transition shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-muted" />
              <span>Prepare escalation dossier</span>
            </button>
          )}

          {/* Verify or dispute button if repair is claimed */}
          {incident.status === 'RepairClaimed' && (
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-success-ink text-white text-xs font-semibold hover:opacity-90 transition shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify / Dispute repair</span>
            </button>
          )}

          {/* Reopen button if verified resolved but problem resurfaced */}
          {incident.status === 'VerifiedResolved' && (
            <button
              onClick={() => setReopenModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-danger-ink/30 text-danger-ink bg-danger-bg text-xs font-semibold hover:bg-red-100 transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Issue resurfaced? Reopen</span>
            </button>
          )}

          {/* Moderator status management */}
          {user && ['moderator', 'admin'].includes(user.role) && (
            <button
              onClick={() => {
                setNewStatus(incident.status);
                setStatusModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-line bg-surface text-ink text-xs font-semibold hover:bg-canvas transition shadow-xs cursor-pointer sm:ml-auto"
            >
              <Edit3 className="w-3.5 h-3.5 text-primary" />
              <span>Update status</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2/3 + 1/3 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2/3): Evidence & Detailed Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photographic Evidence Gallery */}
          <div className="bg-surface rounded-2xl border border-line p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Photographic Evidence</h3>
              <span className="text-xs text-muted">
                {incident.evidenceIds?.length || 0} photo(s) attached
              </span>
            </div>
            <EvidenceGallery evidenceList={incident.evidenceIds || []} />
          </div>

          {/* Detailed Observation Description */}
          <div className="bg-surface rounded-2xl border border-line p-6 space-y-3">
            <h3 className="text-sm font-semibold text-ink">Observation & Ground Impact</h3>
            <p className="text-xs text-muted leading-relaxed whitespace-pre-line">
              {incident.description}
            </p>
          </div>

          {/* Activity Timeline */}
          <div className="bg-surface rounded-2xl border border-line p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Accountability Timeline</h3>
              <span className="text-[11px] font-mono text-muted">Append-only audit trail</span>
            </div>
            <ActivityTimeline events={timeline} />
          </div>
        </div>

        {/* Right Rail (1/3): Official Complaint & Verification Checks */}
        <div className="space-y-6">
          {/* Official Complaint Tracking */}
          <OfficialComplaintPanel incident={incident} onRefresh={fetchDetails} />

          {/* Resolution Verification Status */}
          <div className="bg-surface rounded-2xl border border-line p-5 space-y-3 text-xs">
            <h3 className="font-semibold text-ink text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success-ink" />
              <span>Resolution Check</span>
            </h3>

            {incident.status === 'VerifiedResolved' ? (
              <div className="p-3.5 rounded-xl bg-success-bg border border-[#BCE8D1] text-success-ink space-y-1">
                <span className="font-semibold block">Repair Verified Complete</span>
                <p className="text-[11px] leading-relaxed">
                  Community or authorized reviewer verified that on-ground repairs were carried out.
                </p>
              </div>
            ) : incident.status === 'RepairClaimed' ? (
              <div className="p-3.5 rounded-xl bg-warning-bg border border-[#F0DCB0] text-warning-ink space-y-1">
                <span className="font-semibold block">Repair Claimed · Awaiting Review</span>
                <p className="text-[11px] leading-relaxed">
                  An after-photo has been submitted. An uploaded photo alone does not prove the work is complete until inspected.
                </p>
              </div>
            ) : incident.status === 'Disputed' ? (
              <div className="p-3.5 rounded-xl bg-danger-bg border border-[#F8C4C1] text-danger-ink space-y-1">
                <span className="font-semibold block">Resolution Disputed</span>
                <p className="text-[11px] leading-relaxed">
                  The claimed repair was inspected by the reporting citizen or community and marked incomplete or defective.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-canvas border border-line text-muted space-y-1">
                <span className="font-semibold text-ink block">Pending Municipal Action</span>
                <p className="text-[11px] leading-relaxed">
                  This issue was reported by a citizen and is waiting for on-ground municipal work. Once patched, anyone can upload an after-photo to mark repair claimed.
                </p>
              </div>
            )}

            {/* Note on Evidence Integrity */}
            <div className="p-3 rounded-xl bg-canvas border border-line text-muted text-[11px] leading-relaxed">
              <strong>Evidence Principle:</strong> CivicProof distinguishes between an uploaded after-photo and actual resolution. Community review ensures defects are not closed prematurely.
            </div>
          </div>
        </div>
      </div>

      {/* Escalation Wizard Modal */}
      <EscalationWizard
        incident={incident}
        isOpen={escalationOpen}
        onClose={() => setEscalationOpen(false)}
        onCompleted={fetchDetails}
      />

      {/* Claim Resolution Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-line shadow-floating p-6 space-y-4">
            <h3 className="font-semibold text-ink text-sm">Upload Evidence of Claimed Repair</h3>
            <p className="text-xs text-muted">
              Submit an after-photo showing that work was completed at this spot. The report will enter community review.
            </p>

            <form onSubmit={handleClaimResolution} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  After-Photo (JPEG / PNG)
                </label>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setClaimFile(e.target.files[0])}
                  className="w-full text-xs text-ink file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:border-line file:text-xs file:font-semibold file:bg-canvas file:text-ink hover:file:bg-line/40 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Repair Note / Description
                </label>
                <textarea
                  rows="3"
                  value={claimNote}
                  onChange={(e) => setClaimNote(e.target.value)}
                  placeholder="e.g. BMC team patched the pothole with hot-mix asphalt this morning..."
                  className="w-full p-2.5 text-xs rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-medium text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
                >
                  {submittingClaim ? 'Uploading...' : 'Submit repair claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify / Dispute Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-line shadow-floating p-6 space-y-4">
            <h3 className="font-semibold text-ink text-sm">Review Claimed Repair</h3>
            <p className="text-xs text-muted">
              Inspect the site or review the after-photo to confirm whether the defect is fixed or still pending.
            </p>

            <form onSubmit={handleVerifyOrDispute} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-line cursor-pointer hover:border-success-ink/50">
                  <input
                    type="radio"
                    name="verdict"
                    value="accepted"
                    checked={verdict === 'accepted'}
                    onChange={() => setVerdict('accepted')}
                    className="mt-0.5 text-primary"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-success-ink">
                      Accept: Verified Resolved
                    </span>
                    <span className="block text-[11px] text-muted">
                      Work is properly completed; site is safe and clear.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-line cursor-pointer hover:border-danger-ink/50">
                  <input
                    type="radio"
                    name="verdict"
                    value="disputed"
                    checked={verdict === 'disputed'}
                    onChange={() => setVerdict('disputed')}
                    className="mt-0.5 text-danger-ink"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-danger-ink">
                      Dispute: Incomplete or Substandard
                    </span>
                    <span className="block text-[11px] text-muted">
                      Repair is defective, incomplete, or problem has already resurfaced.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Inspection Note *
                </label>
                <textarea
                  rows="3"
                  required
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  placeholder="Explain your inspection observation..."
                  className="w-full p-2.5 text-xs rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-medium text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVerify}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
                >
                  {submittingVerify ? 'Recording...' : 'Record verdict'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Moderator Status Update Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-line shadow-floating p-6 space-y-4">
            <h3 className="font-semibold text-ink text-sm">Update Incident Status</h3>
            <p className="text-xs text-muted">
              As an authorized reviewer, update the lifecycle state of this civic issue.
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                >
                  <option value="Submitted">Reported (Pending)</option>
                  <option value="UnderReview">Under Review</option>
                  <option value="ReadyForOfficialSubmission">Ready for Official Submission</option>
                  <option value="OfficialComplaintRecorded">Official Reference Logged</option>
                  <option value="InProgress">In Progress</option>
                  <option value="RepairClaimed">Repair Claimed</option>
                  <option value="VerifiedResolved">Verified Resolved</option>
                  <option value="Disputed">Disputed Repair</option>
                  <option value="FollowUpNeeded">Follow-up Needed</option>
                  <option value="FollowUpPrepared">Follow-up Prepared</option>
                  <option value="Reopened">Reopened</option>
                  <option value="Duplicate">Duplicate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Status Note</label>
                <textarea
                  rows="3"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Reason or explanation for status update..."
                  className="w-full p-2.5 text-xs rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-medium text-muted hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
                >
                  {submittingStatus ? 'Updating...' : 'Save status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Report Modal */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-line shadow-floating p-6 space-y-4">
            <h3 className="font-semibold text-ink text-sm">Reopen Civic Report</h3>
            <p className="text-xs text-muted">
              If the problem has reappeared or the repair was incomplete, record the reason to reopen the issue.
            </p>

            <form onSubmit={handleReopenIncident} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Reason for Reopening *
                </label>
                <textarea
                  rows="3"
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Asphalt patch washed away after rain, crater has reopened..."
                  className="w-full p-2.5 text-xs rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-medium text-muted hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReopen}
                  className="px-4 py-2 rounded-xl bg-danger-ink hover:opacity-90 text-white text-xs font-semibold cursor-pointer"
                >
                  {submittingReopen ? 'Reopening...' : 'Reopen report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
