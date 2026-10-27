import React, { useState } from 'react';
import { api } from '../api/api';
import {
  X,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

export default function EscalationWizard({ incident, isOpen, onClose, onCompleted }) {
  const [step, setStep] = useState(1);
  const [stillPresent, setStillPresent] = useState('yes'); // 'yes' | 'partly' | 'resolved'
  const [conditionNote, setConditionNote] = useState('');
  const [authority, setAuthority] = useState('BMC');
  const [officialReference, setOfficialReference] = useState(
    incident.officialComplaintId?.officialReference || ''
  );
  const [generatedPacket, setGeneratedPacket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGeneratePacket = async () => {
    setError('');
    setLoading(true);
    try {
      // First ensure official reference is saved if provided
      if (officialReference && (!incident.officialComplaintId || incident.officialComplaintId.officialReference !== officialReference)) {
        await api.recordOfficialComplaint(incident._id, {
          authority,
          officialReference,
          notes: conditionNote
        });
      }

      // Generate follow-up packet from backend
      const res = await api.createFollowUpPacket(incident._id);
      if (res.success && res.data) {
        setGeneratedPacket(res.data);
        setStep(3);
        if (onCompleted) onCompleted();
      }
    } catch (err) {
      setError(err.message || 'Failed to compile escalation packet.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedPacket?.neutralDraftText) {
      navigator.clipboard.writeText(generatedPacket.neutralDraftText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    if (!generatedPacket) return;
    const element = document.createElement('a');
    const file = new Blob([generatedPacket.neutralDraftText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `CivicProof_Escalation_${incident.ward}_${generatedPacket.packetId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface w-full max-w-2xl rounded-2xl border border-line shadow-floating overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-canvas shrink-0">
          <div>
            <h3 className="font-semibold text-ink text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-ink" />
              <span>Issue Not Fixed? Prepare Escalation Dossier</span>
            </h3>
            <p className="text-xs text-muted">
              Step {step} of 3 · Structured follow-up for official BMC submission
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-line/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-danger-bg text-danger-ink text-xs">{error}</div>
          )}

          {/* STEP 1: Confirm Ground Reality */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-ink mb-1">
                  1. Is this issue still persisting on the ground?
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  CivicProof prepares escalation records only for verified ongoing issues.
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-line hover:border-primary/50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="statusCheck"
                    value="yes"
                    checked={stillPresent === 'yes'}
                    onChange={() => setStillPresent('yes')}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-ink">
                      Yes, the issue is completely unresolved
                    </span>
                    <span className="block text-[11px] text-muted">
                      No repairs or cleanup have occurred since the report.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-line hover:border-primary/50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="statusCheck"
                    value="partly"
                    checked={stillPresent === 'partly'}
                    onChange={() => setStillPresent('partly')}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-ink">
                      It has been only partly fixed or defectively repaired
                    </span>
                    <span className="block text-[11px] text-muted">
                      A repair was claimed or started, but the hazard remains.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-line hover:border-primary/50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="statusCheck"
                    value="resolved"
                    checked={stillPresent === 'resolved'}
                    onChange={() => setStillPresent('resolved')}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-ink">
                      The issue has actually been fixed
                    </span>
                    <span className="block text-[11px] text-muted">
                      You can mark this report as verified resolved instead of escalating.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Current Condition Notes
                </label>
                <textarea
                  rows="3"
                  value={conditionNote}
                  onChange={(e) => setConditionNote(e.target.value)}
                  placeholder="Describe the current state, e.g. pothole widened after rain, garbage overflowing into roadway..."
                  className="w-full p-3 text-xs rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Link Official Reference */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-ink mb-1">
                  2. Link Official Grievance Token or Reference
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  Adding your official BMC token enables the generated dossier to cite the prior grievance reference for official accountability.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  CivicProof cannot submit this complaint automatically without an authorized BMC integration. The generated draft must be submitted by you via the official portal or helpline.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Responsible Authority
                </label>
                <select
                  value={authority}
                  onChange={(e) => setAuthority(e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                >
                  <option value="BMC">Brihanmumbai Municipal Corporation (BMC)</option>
                  <option value="Maharashtra grievance portal">Maharashtra Grievance Portal (Aaple Sarkar)</option>
                  <option value="other">Other Official Agency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Official Complaint Reference Number (Optional but recommended)
                </label>
                <input
                  type="text"
                  value={officialReference}
                  onChange={(e) => setOfficialReference(e.target.value)}
                  placeholder="e.g. BMC-2026-HW-99824"
                  className="w-full h-11 px-3.5 text-sm font-mono rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Preview and Copy Neutral Draft */}
          {step === 3 && generatedPacket && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-ink mb-1">
                    3. Generated Official Follow-Up Dossier
                  </h4>
                  <span className="font-mono text-xs text-primary font-bold">
                    {generatedPacket.packetId}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Neutral, formal draft referencing your evidence, timestamps, and official tokens.
                </p>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to clipboard!' : 'Copy follow-up text'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas transition"
                >
                  <Download className="w-3.5 h-3.5 text-muted" />
                  <span>Download file (.txt)</span>
                </button>
              </div>

              {/* Text Area Draft */}
              <div className="rounded-xl border border-line bg-canvas p-4">
                <pre className="text-xs font-mono text-ink whitespace-pre-wrap leading-relaxed select-all">
                  {generatedPacket.neutralDraftText}
                </pre>
              </div>

              {/* Official Submission Links */}
              <div className="p-4 rounded-xl border border-line bg-surface space-y-2 text-xs">
                <span className="font-semibold text-ink block">
                  Next Step: Submit via Official BMC Channels
                </span>
                <p className="text-muted leading-relaxed">
                  Paste this neutral draft directly into the description field of the official portal:
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href="https://portal.mcgm.gov.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-info hover:underline font-medium"
                  >
                    <span>BMC Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://marg.mcgm.gov.in/MARG/welcomePage.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-info hover:underline font-medium"
                  >
                    <span>MARG Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-ink">Helpline: <strong>1916</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-canvas shrink-0">
          {step > 1 && step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition"
            >
              <span>Continue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              disabled={loading}
              onClick={handleGeneratePacket}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition disabled:opacity-50"
            >
              <span>{loading ? 'Compiling dossier...' : 'Generate follow-up draft'}</span>
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-ink/90 transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
