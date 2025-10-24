import React from 'react';

export const FlavorIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M16 4a2 2 0 0 0-2-2h- 건물 2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V4Z" />
    <path d="M8 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
    <path d="M16 12h4" />
  </svg>
);