import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  CheckCircle,
  PlusCircle,
  User,
  LogOut,
  ShieldAlert,
  BarChart2,
  ChevronDown,
  Layers
} from 'lucide-react';

export default function AppHeader() {
  const { user, logout, openAuthModal } = useAuth();
  const location = useLocation();
  const [profileDropdown, setProfileDropdown] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-primary-hover transition">
            <div className="relative">
              <MapPin className="w-4 h-4" />
              <CheckCircle className="w-2.5 h-2.5 text-white absolute -bottom-1 -right-1" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-ink block leading-none">
              CivicProof
            </span>
            <span className="text-[10px] text-muted font-medium tracking-wider uppercase block">
              Mumbai
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive('/')
                ? 'text-primary bg-primary/8 font-semibold'
                : 'text-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            Explore map
          </Link>
          <Link
            to="/my-reports"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive('/my-reports')
                ? 'text-primary bg-primary/8 font-semibold'
                : 'text-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            My reports
          </Link>
          <Link
            to="/insights"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive('/insights')
                ? 'text-primary bg-primary/8 font-semibold'
                : 'text-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            Public insights
          </Link>
          {user && (user.role === 'moderator' || user.role === 'admin') && (
            <Link
              to="/moderation"
              className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition ${
                isActive('/moderation')
                  ? 'text-primary bg-primary/8 font-semibold'
                  : 'text-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Moderation
            </Link>
          )}
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/report"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition active:translate-y-px shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report issue</span>
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-line hover:border-muted/40 transition bg-surface"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-semibold text-ink leading-tight truncate max-w-[100px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-muted capitalize leading-none">{user.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted" />
              </button>

              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl border border-line shadow-floating py-2 z-50">
                  <div className="px-4 py-2 border-b border-line text-xs">
                    <div className="font-semibold text-ink">{user.name}</div>
                    <div className="text-muted truncate">{user.email}</div>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-canvas text-muted capitalize font-medium">
                      {user.role}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/my-reports"
                      onClick={() => setProfileDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-ink hover:bg-canvas transition"
                    >
                      <Layers className="w-3.5 h-3.5 text-muted" />
                      <span>My Reports</span>
                    </Link>
                    {['moderator', 'admin'].includes(user.role) && (
                      <Link
                        to="/moderation"
                        onClick={() => setProfileDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-ink hover:bg-canvas transition"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-muted" />
                        <span>Moderation Queue</span>
                      </Link>
                    )}
                  </div>


                  <div className="border-t border-line pt-1">
                    <button
                      onClick={() => { logout(); setProfileDropdown(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-danger-ink hover:bg-danger-bg transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="h-10 px-3.5 rounded-xl border border-line hover:border-muted/50 text-sm font-medium text-ink transition bg-surface"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
