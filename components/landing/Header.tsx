import React from 'react';
import { Link } from 'react-router-dom';
import { CoffeeIcon } from '../icons/CoffeeIcon';

export const Header: React.FC = () => {
  return (
    <header className="relative z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-primary/80 p-3 text-brand-accent shadow-xl ring-1 ring-brand-accent/40">
              <CoffeeIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Café AI</h1>
              <p className="text-xs text-brand-text/60">Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="rounded-xl bg-brand-surface/40 px-4 py-2 text-sm font-medium text-brand-text transition-all hover:bg-brand-surface/60 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="button-primary-pulse rounded-xl bg-gradient-to-r from-brand-accent via-brand-accent/90 to-amber-400/70 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
