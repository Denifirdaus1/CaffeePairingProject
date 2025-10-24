import React from 'react';

export const TextureIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M2 2l7 7-4 4 7 7" />
    <path d="M13 13l7 7-4 4 7 7" />
  </svg>
);