import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, AlertCircle } from 'lucide-react';

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState(authModalMode || 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
    setError('');
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-line shadow-floating overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-canvas">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              CP
            </div>
            <div>
              <h3 className="font-semibold text-ink text-sm">
                {mode === 'login' ? 'Sign in to CivicProof' : 'Create an account'}
              </h3>
              <p className="text-xs text-muted">Verified municipal issue resolution</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-line/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Mode Switch Tabs */}
          <div className="flex rounded-lg bg-canvas p-1 mb-5 border border-line">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                mode === 'login' ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                mode === 'register' ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger-bg border border-danger-ink/20 text-danger-ink text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full h-11 px-3.5 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition"
                >
                  <option value="citizen">Citizen (Report, upload evidence & dispute)</option>
                  <option value="moderator">Moderator (Review reports & merge duplicates)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition active:translate-y-px disabled:opacity-50 mt-2 cursor-pointer"
            >
              {submitting ? 'Authenticating...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
