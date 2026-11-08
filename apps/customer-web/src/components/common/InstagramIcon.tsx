import React from 'react';

export const InstagramIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size = 16,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" strokeWidth="2.5" />
  </svg>
);

export const InstagramGradientIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size = 16,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <defs>
      <linearGradient id="instaGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" fill="none" stroke="url(#instaGrad)" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" fill="none" stroke="url(#instaGrad)" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="url(#instaGrad)" />
  </svg>
);
