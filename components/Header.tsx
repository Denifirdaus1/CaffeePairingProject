import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CoffeeIcon } from './icons/CoffeeIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

type AccentPillProps = {
  children: React.ReactNode;
};

const AccentPill: React.FC<AccentPillProps> = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary/40 px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-text/60">
    <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
    {children}
  </span>
);

export const Header: React.FC = () => {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/70 via-brand-primary/30 to-transparent opacity-80" />
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-accent/20 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex max-w-2xl items-start gap-5">
          <div className="rounded-3xl bg-brand-primary/80 p-4 text-brand-accent shadow-2xl ring-1 ring-brand-accent/40">
            <CoffeeIcon className="h-9 w-9" />
          </div>
          <div className="space-y-4 flex-1">
            <AccentPill>AI PAIRING ENGINE</AccentPill>
            <div className="space-y-3">
              {user?.cafe_profile?.cafe_name && (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold text-white md:text-4xl md:leading-tight">
                    {user.cafe_profile.cafe_name}
                  </h1>
                  {user.cafe_profile.shop_slug && (
                    <Link
                      to={`/s/${user.cafe_profile.shop_slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-brand-accent hover:text-brand-accent/80 text-sm font-semibold transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Shop
                    </Link>
                  )}
                </div>
              )}
              <h2 className="text-xl font-medium text-brand-text">
                Dashboard
              </h2>
              <p className="text-sm text-brand-text/80 md:text-base">
                Manage your coffee & pastry inventory, then let Gemini create unforgettable customer experiences.
                All real-time insights in one sleek dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-surface/40 px-4 py-2 text-sm font-medium text-brand-text hover:text-white hover:bg-brand-surface/60 transition-all"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Landing
            </Link>
            {user && (
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 px-4 py-2 text-sm font-medium text-red-300 hover:text-white transition-all border border-red-600/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            )}
          </div>

          {/* System Status */}
          <div className="w-full lg:w-auto rounded-3xl bg-brand-primary/50 p-5 text-sm text-brand-text/70 shadow-xl ring-1 ring-brand-accent/20 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-text/50">Live system status</p>
            <div className="flex items-center gap-3 rounded-2xl bg-brand-bg/60 px-4 py-2 text-xs font-semibold text-white shadow-inner ring-1 ring-white/10">
              <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.65)]" />
              Smart pairing service operating 24/7
            </div>
            <p className="text-xs text-brand-text/50">Powered by Gemini & Supabase</p>
          </div>
        </div>
      </div>
    </header>
  );
};
