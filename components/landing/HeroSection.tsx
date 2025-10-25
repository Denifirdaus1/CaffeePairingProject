import React from 'react';
import { Link } from 'react-router-dom';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative py-20 px-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/70 via-brand-primary/30 to-transparent opacity-80" />
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-accent/20 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl text-center">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary/40 px-4 py-2 text-sm uppercase tracking-[0.3em] text-brand-text/60">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            AI-Powered Café Management
          </span>
        </div>

        <h1 className="mb-6 text-5xl font-bold text-white md:text-7xl">
          Transform Your Café with
          <span className="block bg-gradient-to-r from-brand-accent via-amber-400 to-brand-accent bg-clip-text text-transparent">
            Intelligent Pairings
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-3xl text-xl text-brand-text/80">
          For café owners: Discover the perfect coffee-pastry combinations using AI-powered analysis. 
          Manage your inventory, optimize your menu, and create unforgettable customer experiences.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/register"
            className="button-primary-pulse inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-accent via-brand-accent/90 to-amber-400/70 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:shadow-[0_30px_60px_-25px_rgba(162,123,92,0.85)]"
          >
            <span>Start Free Trial (Café Owners)</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          
          <Link
            to="/login"
            className="inline-flex items-center gap-3 rounded-2xl border border-brand-accent/30 bg-brand-surface/40 px-8 py-4 text-lg font-semibold text-brand-text transition-all hover:bg-brand-surface/60 hover:text-white"
          >
            <span>Sign In (Café Owners)</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-brand-text/60">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Free 14-day trial</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Cancel anytime</span>
          </div>
        </div>

        {/* Demo Public Shops */}
        <div className="mt-16">
          <div className="glass-panel rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">For Customers: Try Our Demo Shops</h3>
            <p className="text-brand-text-muted text-center mb-6">
              Experience how customers discover coffee pairings in our partner cafés. 
              No signup required - just browse and explore!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/s/kaffecihuy-1ed74a49"
                className="flex items-center gap-3 p-4 rounded-xl bg-brand-primary/50 hover:bg-brand-primary/70 transition-colors"
              >
                <div className="w-12 h-12 bg-brand-accent rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">☕</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">kaffeCihuy</h4>
                  <p className="text-sm text-brand-text-muted">Demo café with coffee collection</p>
                </div>
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link
                to="/s/my-café-98b73baa"
                className="flex items-center gap-3 p-4 rounded-xl bg-brand-primary/50 hover:bg-brand-primary/70 transition-colors"
              >
                <div className="w-12 h-12 bg-brand-accent rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🏪</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">My Café</h4>
                  <p className="text-sm text-brand-text-muted">Another demo café experience</p>
                </div>
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
