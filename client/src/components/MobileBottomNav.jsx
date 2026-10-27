import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, Layers, PlusCircle, BarChart2 } from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/98 backdrop-blur border-t border-line px-3 py-2 flex items-center justify-around shadow-sm">
      <Link
        to="/"
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
          isActive('/') ? 'text-primary' : 'text-muted'
        }`}
      >
        <Map className="w-5 h-5" />
        <span>Explore</span>
      </Link>

      <Link
        to="/report"
        className="flex flex-col items-center -mt-5"
      >
        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-hover active:scale-95 transition">
          <PlusCircle className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-semibold text-primary mt-0.5">Report</span>
      </Link>

      <Link
        to="/my-reports"
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
          isActive('/my-reports') ? 'text-primary' : 'text-muted'
        }`}
      >
        <Layers className="w-5 h-5" />
        <span>My Reports</span>
      </Link>

      <Link
        to="/insights"
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
          isActive('/insights') ? 'text-primary' : 'text-muted'
        }`}
      >
        <BarChart2 className="w-5 h-5" />
        <span>Insights</span>
      </Link>
    </nav>
  );
}
