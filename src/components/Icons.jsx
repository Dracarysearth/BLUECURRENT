import React from 'react';

const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="8" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="15" width="7" height="6" rx="1.5" /></>,
  token: <><path d="M12 2.8 20 7v10l-8 4.2L4 17V7l8-4.2Z" /><path d="m4.4 7.2 7.6 4 7.6-4M12 11.2v9.5" /></>,
  liquidity: <><path d="M12 2.5s6.2 6.5 6.2 11.3a6.2 6.2 0 1 1-12.4 0C5.8 9 12 2.5 12 2.5Z" /><path d="M9 15.2c.4 1.1 1.3 1.7 2.7 1.8" /></>,
  preview: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 13h6M7 17h3" /></>,
  vault: <><path d="M4 5.5h16v13H4z" /><circle cx="12" cy="12" r="3.2" /><path d="M12 8.8v6.4M8.8 12h6.4" /></>,
  activity: <><path d="M3 12h4l2.1-6 4.1 12 2.1-6H21" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="2.3" /><path d="M3 8h18M16 14h2" /><path d="M6 5V3h12" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  check: <><path d="m5 12 4.2 4.2L19 6.5" /></>,
  external: <><path d="M13 5h6v6M19 5l-9 9" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  copy: <><rect x="8" y="8" width="11" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  shield: <><path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
};

export default function Icon({ name, size = 18, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.dashboard}
    </svg>
  );
}