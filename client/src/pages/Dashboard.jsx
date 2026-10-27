import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import {
  BarChart3,
  Flame,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Info,
  MapPin,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sumRes, hotRes] = await Promise.all([
          api.getSummary(days),
          api.getRecurringHotspots({ minReports: 1 })
        ]);

        if (sumRes.success) setSummary(sumRes);
        if (hotRes.success) setHotspots(hotRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-primary block mb-1">
            PUBLIC INSIGHTS & MUNICIPAL TRANSPARENCY
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Mumbai Civic Issue Insights
          </h1>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Independent community reporting metrics, verified resolution rates, and persistent defect clusters.
          </p>
        </div>

        {/* Time period filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted font-medium">Time period:</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 px-3 rounded-xl border border-line bg-surface text-ink text-xs font-semibold outline-none focus:border-primary shadow-xs"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Past year</option>
          </select>
        </div>
      </div>

      {/* Mandatory Disclaimer Box (Section 9) */}
      <div className="p-4 rounded-2xl bg-canvas border border-line flex items-start gap-3 text-xs text-muted leading-relaxed">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-ink">Methodology & Transparency Note:</strong> These statistics represent community-logged observations in CivicProof. CivicProof incident counts are not official municipal complaint totals. Unresolved statuses do not automatically imply administrative fault.
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-muted flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
          <span>Compiling civic analytics...</span>
        </div>
      ) : (
        <>
          {/* Key Metric Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-line shadow-xs space-y-1">
              <span className="text-xs text-muted font-medium">Citizen Reports Logged</span>
              <div className="text-3xl font-bold text-ink tabular-nums">
                {summary?.metrics?.totalReports || 0}
              </div>
              <span className="text-[11px] text-muted">Across Mumbai municipal wards</span>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-line shadow-xs space-y-1">
              <span className="text-xs text-muted font-medium">Verified Resolution Rate</span>
              <div className="text-3xl font-bold text-success-ink tabular-nums">
                {summary?.metrics?.resolutionRatePercent || 0}%
              </div>
              <span className="text-[11px] text-muted">Confirmed resolved on-ground</span>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-line shadow-xs space-y-1">
              <span className="text-xs text-muted font-medium">In Progress / Logged</span>
              <div className="text-3xl font-bold text-info tabular-nums">
                {summary?.metrics?.inProgressReports || 0}
              </div>
              <span className="text-[11px] text-muted">Active municipal follow-ups</span>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-line shadow-xs space-y-1">
              <span className="text-xs text-muted font-medium">Verified Resolved</span>
              <div className="text-3xl font-bold text-ink tabular-nums">
                {summary?.metrics?.resolvedReports || 0}
              </div>
              <span className="text-[11px] text-muted">Closed with reviewed proof</span>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reports by Category */}
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-xs space-y-4">
              <h3 className="text-sm font-semibold text-ink">Reports by Category</h3>
              <div className="space-y-3">
                {summary?.breakdowns?.byCategory?.map((item) => {
                  const max = Math.max(...summary.breakdowns.byCategory.map((i) => i.count), 1);
                  const pct = Math.round((item.count / max) * 100);
                  return (
                    <div key={item.category} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="capitalize text-ink">{item.category}</span>
                        <span className="text-muted tabular-nums">{item.count}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-canvas overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reports by Ward */}
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-xs space-y-4">
              <h3 className="text-sm font-semibold text-ink">Top Mumbai Wards Reported</h3>
              <div className="space-y-3">
                {summary?.breakdowns?.topWards?.map((item) => {
                  const max = Math.max(...summary.breakdowns.topWards.map((i) => i.count), 1);
                  const pct = Math.round((item.count / max) * 100);
                  return (
                    <div key={item.ward} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-ink">{item.ward}</span>
                        <span className="text-muted tabular-nums">{item.count} reports</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-canvas overflow-hidden">
                        <div
                          className="h-full bg-info/80 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Persistent Defect Hotspots Table */}
          <div className="p-6 rounded-2xl bg-surface border border-line shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-danger-ink" />
                  <span>Recurring Defect Hotspots</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Locations in Mumbai where repeated civic defects have been observed in close proximity.
                </p>
              </div>
              <span className="text-xs text-muted font-medium">
                {hotspots.length} clusters identified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="py-2.5 font-semibold">Ward & Locality</th>
                    <th className="py-2.5 font-semibold">Category</th>
                    <th className="py-2.5 font-semibold">Report Count</th>
                    <th className="py-2.5 font-semibold">Sample Issues</th>
                    <th className="py-2.5 font-semibold">Coordinates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {hotspots.map((h, idx) => (
                    <tr key={idx} className="hover:bg-canvas/60 transition">
                      <td className="py-3 font-semibold text-ink">
                        <div>{h.ward}</div>
                        <div className="text-[11px] font-normal text-muted truncate max-w-xs">
                          {h.addressSummary}
                        </div>
                      </td>
                      <td className="py-3 capitalize text-muted">{h.category}</td>
                      <td className="py-3 font-mono font-bold text-ink">
                        <span className="px-2 py-0.5 rounded bg-line/40">{h.reportCount}</span>
                      </td>
                      <td className="py-3 text-muted text-[11px] truncate max-w-xs">
                        {h.sampleIncidents?.join(' · ')}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-muted">
                        [{h.coordinates[0]?.toFixed(3)}, {h.coordinates[1]?.toFixed(3)}]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
