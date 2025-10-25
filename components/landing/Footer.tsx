import React from 'react';
import { CoffeeIcon } from '../icons/CoffeeIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-brand-border/30 bg-brand-primary/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-brand-primary/80 p-3 text-brand-accent shadow-xl ring-1 ring-brand-accent/40">
                <CoffeeIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Café AI Dashboard</h3>
                <p className="text-sm text-brand-text/60">Powered by Gemini & Supabase</p>
              </div>
            </div>
            <p className="text-brand-text/70 mb-6 max-w-md">
              Transform your café with AI-powered coffee-pastry pairings, 
              intelligent inventory management, and data-driven insights.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-brand-text/70 hover:text-brand-accent transition-colors">Features</a></li>
              <li><a href="#" className="text-brand-text/70 hover:text-brand-accent transition-colors">Pricing</a></li>
              <li><a href="#" className="text-brand-text/70 hover:text-brand-accent transition-colors">API</a></li>
              <li><a href="#" className="text-brand-text/70 hover:text-brand-accent transition-colors">Integrations</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-brand-text/70 hover:text-brand-accent transition-colors">Documentation</a></li>
              <li><a href="#" className="text-brand-text/70 hover:text-brand-accent transition-colors">Help Center</a></li>
              <li><a href="#" className="text-brand-text/70 hover:text-brand-accent transition-colors">Contact</a></li>
              <li><a href="#" className="text-brand-text/70 hover:text-brand-accent transition-colors">Status</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-brand-border/30 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-brand-text/60">
              © 2024 Café AI Dashboard. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-brand-text/60 hover:text-brand-accent transition-colors">Privacy</a>
              <a href="#" className="text-sm text-brand-text/60 hover:text-brand-accent transition-colors">Terms</a>
              <a href="#" className="text-sm text-brand-text/60 hover:text-brand-accent transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
