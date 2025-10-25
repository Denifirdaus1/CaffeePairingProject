
import React from 'react';

export const Spinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-accent/20"></div>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-brand-accent absolute top-0 left-0"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);
