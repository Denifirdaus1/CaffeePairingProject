import React from 'react';

interface LocationPermissionPromptProps {
  onRequestPermission: () => void;
  onSkip: () => void;
}

export const LocationPermissionPrompt: React.FC<LocationPermissionPromptProps> = ({
  onRequestPermission,
  onSkip,
}) => {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div className="glass-panel rounded-3xl p-8">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-accent/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-brand-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Find Cafés Near You
          </h2>
          <p className="text-brand-text/80 text-lg">
            Allow us to access your location to show you the nearest partner cafés and their perfect coffee pairings.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onRequestPermission}
            className="w-full button-primary-pulse rounded-xl bg-gradient-to-r from-brand-accent via-brand-accent/90 to-amber-400/70 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:brightness-110"
          >
            Allow Location Access
          </button>
          <button
            onClick={onSkip}
            className="w-full rounded-xl bg-brand-surface/50 border border-brand-accent/30 px-6 py-4 text-base font-medium text-brand-text hover:bg-brand-surface/70 transition-colors"
          >
            Search by City or Area Instead
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-brand-accent/20">
          <p className="text-sm text-brand-text-muted">
            Your location data is only used to find nearby cafés and is never stored or shared.
          </p>
        </div>
      </div>
    </div>
  );
};

