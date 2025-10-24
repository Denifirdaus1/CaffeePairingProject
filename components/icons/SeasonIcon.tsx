import React from 'react';

export const SeasonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12a10 10 0 0 0 5 8.66" />
    <path d="M2 12a10 10 0 0 1 5-8.66" />
    <path d="M12 2a10 10 0 0 0-5 8.66" />
    <path d="M12 2a10 10 0 0 1 5 8.66" />
    <path d="M22 12a10 10 0 0 0-5-8.66" />
    <path d="M22 12a10 10 0 0 1-5 8.66" />
    <path d="M12 22a10 10 0 0 0 5-8.66" />
    <path d="M12 22a10 10 0 0 1-5-8.66" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);