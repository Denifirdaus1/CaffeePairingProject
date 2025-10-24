
import React from 'react';

export const PastryIcon: React.FC<{ className?: string }> = ({ className }) => (
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
        <path d="M12 2.5a2.5 2.5 0 0 1 2.5 2.5V8h-5V5a2.5 2.5 0 0 1 2.5-2.5Z" />
        <path d="M12 2.5a2.5 2.5 0 0 0-2.5 2.5V8h5V5a2.5 2.5 0 0 0-2.5-2.5Z" />
        <path d="M12 17.5a2.5 2.5 0 0 1-2.5-2.5V8h5v7a2.5 2.5 0 0 1-2.5 2.5Z" />
        <path d="M12 17.5a2.5 2.5 0 0 0 2.5-2.5V8h-5v7a2.5 2.5 0 0 0 2.5 2.5Z" />
        <path d="M20 12a2.5 2.5 0 0 1-2.5 2.5H8v-5h9.5a2.5 2.5 0 0 1 2.5 2.5Z" />
        <path d="M4 12a2.5 2.5 0 0 0 2.5 2.5H16v-5H6.5A2.5 2.5 0 0 0 4 12Z" />
    </svg>
);
