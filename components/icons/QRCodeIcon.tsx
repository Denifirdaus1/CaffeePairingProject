import React from 'react';

export const QRCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="3" y="3" width="5" height="5" />
    <rect x="16" y="3" width="5" height="5" />
    <rect x="3" y="16" width="5" height="5" />
    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
    <path d="M21 21v.01" />
    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
    <path d="M21 12v.01" />
    <path d="M12 21h.01" />
    <path d="M12 16h.01" />
    <path d="M16 16h.01" />
    <path d="M12 12h.01" />
  </svg>
);
