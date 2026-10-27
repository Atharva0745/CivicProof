import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { getSocket } from '../api/socket';
import IncidentListRow from '../components/IncidentListRow';
import IncidentMap from '../components/IncidentMap';
import {
  Search,
  SlidersHorizontal,
  Map as MapIcon,
  List as ListIcon,
  RefreshCw,
  AlertCircle,
  Plus
} from 'lucide-react';

const categories = [
  { id: '', label: 'All issues' },
  { id: 'pothole', label: 'Potholes' },
  { id: 'garbage', label: 'Garbage' },
  { id: 'drainage', label: 'Drainage' },
  { id: 'streetlight', label: 'Streetlights' },
  { id: 'other', label: 'Other' }
];

export default function Explore() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'map'
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0 });
  const navigate = useNavigate();

  // Load incidents from backend API
  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (status) params.status = status;
      if (search) params.search = search;

      const res = await api.getIncidents(params);
      if (res.success && res.data) {
        setIncidents(res.data);
        if (res.data.length > 0 && !selectedIncidentId) {
          setSelectedIncidentId(res.data[0]._id);
        }

        // Quick summary counts
        const total = res.data.length;
        const verified = res.data.filter((i) => i.status === 'VerifiedResolved').length;
        const pending = res.data.filter((i) =>
          ['Submitted', 'UnderReview', 'RepairClaimed', 'Disputed'].includes(i.status)
        ).length;
        setStats({ total, pending, verified });
      }
    } catch (err) {
      console.error('[Explore] Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIncidents();
    }, 200);
    return () => clearTimeout(timer);
  }, [category, status, search]);

  // Real-time Socket.IO updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCreated = (payload) => {
      console.log('[Socket] Incident created:', payload);
      fetchIncidents();
    };

    const handleUpdated = (payload) => {
      console.log('[Socket] Incident updated:', payload);
      fetchIncidents();
    };

    socket.on('incident:created', handleCreated);
    socket.on('incident:updated', handleUpdated);
    socket.on('incident:status-changed', handleUpdated);
    socket.on('incident:resolution-claimed', handleUpdated);
    socket.on('incident:verification-updated', handleUpdated);

    return () => {
      socket.off('incident:created', handleCreated);
      socket.off('incident:updated', handleUpdated);
      socket.off('incident:status-changed', handleUpdated);
      socket.off('incident:resolution-claimed', handleUpdated);
      socket.off('incident:verification-updated', handleUpdated);
    };
  }, []);

  const handleSelectRow = (inc) => {
    setSelectedIncidentId(inc._id);
    if (window.innerWidth < 768) {
      setMobileTab('map');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Mobile Map / List Toggle */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-surface border-b border-line">
        <span className="text-xs font-semibold text-ink">
          {incidents.length} Issues in Mumbai
        </span>
        <div className="flex rounded-lg bg-canvas p-0.5 border border-line">
          <button
            onClick={() => setMobileTab('list')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
              mobileTab === 'list' ? 'bg-surface text-ink shadow-xs' : 'text-muted'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
              mobileTab === 'map' ? 'bg-surface text-ink shadow-xs' : 'text-muted'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left 44% List, Right 56% Sticky Map */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1440px] w-full mx-auto md:px-8">
        {/* Left Panel: Filters & Issue List (approx 44%) */}
        <div
          className={`w-full md:w-[44%] md:max-w-[560px] flex flex-col border-r border-line bg-surface ${
            mobileTab === 'map' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header Copy */}
          <div className="p-4 md:p-6 pb-3 border-b border-line">
            <span className="text-[11px] font-bold tracking-wider uppercase text-primary block mb-1">
              MUMBAI · COMMUNITY ISSUE MAP
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
              See what needs fixing.
            </h1>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Local reports, verified evidence, and structured BMC follow-ups in one place.
            </p>

            {/* Compact Metric Strip */}
            <div className="mt-3.5 pt-3 border-t border-line/60 flex items-center gap-4 text-xs">
              <div>
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">Total</span>
                <span className="font-semibold text-ink text-sm tabular-nums">{stats.total}</span>
              </div>
              <div className="w-px h-6 bg-line" />
              <div>
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">Awaiting review</span>
                <span className="font-semibold text-warning-ink text-sm tabular-nums">{stats.pending}</span>
              </div>
              <div className="w-px h-6 bg-line" />
              <div>
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">Verified resolved</span>
                <span className="font-semibold text-success-ink text-sm tabular-nums">{stats.verified}</span>
              </div>
            </div>

            {/* Search Input */}
            <div className="mt-4">
              <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-canvas px-3.5 transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/10">
                <Search className="w-4 h-4 text-muted shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search a locality, street or issue"
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-xs text-muted hover:text-ink">
                    Clear
                  </button>
                )}
              </label>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto mt-3 pb-1 no-scrollbar">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    category === c.id
                      ? 'bg-primary text-white font-semibold shadow-xs'
                      : 'bg-canvas text-muted hover:text-ink hover:bg-line/40'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-muted font-medium">Status filter:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-line bg-canvas text-ink outline-none focus:border-primary"
              >
                <option value="">Any status</option>
                <option value="Submitted">Reported (Pending)</option>
                <option value="OfficialComplaintRecorded">Official logged</option>
                <option value="InProgress">In progress</option>
                <option value="RepairClaimed">Repair claimed</option>
                <option value="VerifiedResolved">Verified resolved</option>
                <option value="Disputed">Disputed repair</option>
              </select>
            </div>
          </div>

          {/* Issue List Rows */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span>Loading Mumbai civic records...</span>
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-12 text-center text-muted space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto text-muted/60" />
                <p className="text-sm font-semibold text-ink">No reports match your filters</p>
                <p className="text-xs text-muted max-w-xs mx-auto">
                  Try clearing filters or search to explore other municipal wards in Mumbai.
                </p>
                <button
                  onClick={() => { setCategory(''); setStatus(''); setSearch(''); }}
                  className="px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink hover:bg-canvas transition"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div>
                {incidents.map((inc) => (
                  <IncidentListRow
                    key={inc._id}
                    incident={inc}
                    isSelected={selectedIncidentId === inc._id}
                    onClick={handleSelectRow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Interactive Sticky Map (approx 56%) */}
        <div
          className={`w-full md:w-[56%] md:flex-1 h-[calc(100vh-120px)] md:h-[calc(100vh-64px)] sticky top-16 ${
            mobileTab === 'list' ? 'hidden md:block' : 'block'
          }`}
        >
          <IncidentMap
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(inc) => setSelectedIncidentId(inc._id)}
          />
        </div>
      </div>
    </div>
  );
}
