import React, { useState } from 'react';
import { ShieldCheck, Image as ImageIcon, Calendar } from 'lucide-react';

export default function EvidenceGallery({ evidenceList = [] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!evidenceList || evidenceList.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-canvas p-8 text-center text-muted">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted/60" />
        <p className="text-sm font-medium">No photographic evidence attached</p>
        <p className="text-xs text-muted/80 mt-1">
          Evidence photos submitted by citizens appear here with verifiable cryptographic hashes.
        </p>
      </div>
    );
  }

  const activeEvidence = evidenceList[selectedIdx] || evidenceList[0];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      {/* Featured Photo Viewer */}
      <div className="relative rounded-2xl overflow-hidden border border-line bg-ink/5 aspect-video sm:aspect-16/10">
        <img
          src={activeEvidence.publicUrl}
          alt={activeEvidence.caption || 'Evidence photo'}
          className="w-full h-full object-contain bg-black/90"
        />

        {/* Kind badge: before_photo vs after_photo */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs ${
              activeEvidence.kind === 'after_photo'
                ? 'bg-success-bg text-success-ink border border-success-ink/20'
                : 'bg-surface/90 backdrop-blur-xs text-ink border border-line'
            }`}
          >
            {activeEvidence.kind === 'after_photo' ? 'Claimed After-Photo' : 'Before-Photo Evidence'}
          </span>
        </div>

        {/* Timestamp */}
        <div className="absolute bottom-3 left-3 bg-ink/75 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono">
          <Calendar className="w-3 h-3 text-muted" />
          <span>{formatDate(activeEvidence.uploadedAt || activeEvidence.createdAt)}</span>
        </div>
      </div>

      {/* Caption & SHA-256 Tamper Evident Verification */}
      <div className="bg-canvas border border-line rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-ink">
          <span className="font-semibold text-muted mr-1.5">Caption:</span>
          <span>{activeEvidence.caption || 'No caption provided by reporter.'}</span>
        </div>

        {activeEvidence.contentHash && (
          <div className="flex items-center gap-1.5 text-muted shrink-0 text-[11px] font-mono" title={`SHA-256: ${activeEvidence.contentHash}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[10px] uppercase font-bold text-primary">SHA-256:</span>
            <span>{activeEvidence.contentHash.substring(0, 16)}...</span>
          </div>
        )}
      </div>

      {/* Thumbnails Strip if multiple */}
      {evidenceList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {evidenceList.map((ev, idx) => (
            <button
              key={ev._id || idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                selectedIdx === idx ? 'border-primary shadow-xs' : 'border-line opacity-70 hover:opacity-100'
              }`}
            >
              <img src={ev.publicUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
