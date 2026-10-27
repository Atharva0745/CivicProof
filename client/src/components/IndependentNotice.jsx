import React from 'react';
import { Info, ExternalLink } from 'lucide-react';

export default function IndependentNotice() {
  return (
    <aside aria-label="Official channel notice" className="bg-[#EEF2F0] border-b border-line py-2 px-4 text-xs text-muted">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            <strong className="font-semibold text-ink">Independent Civic Tool:</strong> CivicProof records citizen evidence and follow-ups. Official complaints must be filed with the Brihanmumbai Municipal Corporation (BMC).
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://portal.mcgm.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-info hover:underline inline-flex items-center gap-1 font-medium"
          >
            BMC Portal <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-line">|</span>
          <a
            href="https://marg.mcgm.gov.in/MARG/welcomePage.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-info hover:underline inline-flex items-center gap-1 font-medium"
          >
            MARG Pothole Portal <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-line">|</span>
          <span className="text-ink font-medium">Helpline: <strong>1916</strong></span>
        </div>
      </div>
    </aside>
  );
}
