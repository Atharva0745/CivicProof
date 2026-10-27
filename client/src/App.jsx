import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import IndependentNotice from './components/IndependentNotice';
import AppHeader from './components/AppHeader';
import MobileBottomNav from './components/MobileBottomNav';
import AuthModal from './components/AuthModal';

import Explore from './pages/Explore';
import ReportIssue from './pages/ReportIssue';
import IncidentDetails from './pages/IncidentDetails';
import MyReports from './pages/MyReports';
import Dashboard from './pages/Dashboard';
import AdminQueue from './pages/AdminQueue';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-canvas text-ink font-sans flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
          {/* Top persistent notice as per section 3 */}
          <IndependentNotice />

          {/* Slim top bar navbar */}
          <AppHeader />

          {/* Page Routing */}
          <main className="flex-1 pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Explore />} />
              <Route path="/report" element={<ReportIssue />} />
              <Route path="/incidents/:id" element={<IncidentDetails />} />
              <Route path="/my-reports" element={<MyReports />} />
              <Route path="/insights" element={<Dashboard />} />
              <Route path="/moderation" element={<AdminQueue />} />
              <Route path="*" element={<Explore />} />
            </Routes>
          </main>

          {/* Subtle civic footer */}
          <footer className="border-t border-line bg-surface py-6 px-4 md:px-8 text-xs text-muted">
            <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-ink">CivicProof Mumbai</span> — Verified Municipal Issue Resolution
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <a
                  href="https://portal.mcgm.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-info"
                >
                  BMC Portal
                </a>
                <span>•</span>
                <a
                  href="https://marg.mcgm.gov.in/MARG/welcomePage.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-info"
                >
                  MARG Portal
                </a>
                <span>•</span>
                <span>Helpline 1916</span>
              </div>
            </div>
          </footer>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />

          {/* Global Auth Modal */}
          <AuthModal />
        </div>
      </Router>
    </AuthProvider>
  );
}
