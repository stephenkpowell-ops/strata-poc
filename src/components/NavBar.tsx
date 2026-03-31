'use client';

/**
 * NavBar.tsx
 *
 * Fixed bottom navigation tab bar.
 *
 * Four tabs:
 *   Home       → /home
 *   Calendar   → /calendar
 *   Recovery   → /recovery   (placeholder for step 22)
 *   History    → /history    (placeholder for step 25)
 *
 * The active tab is determined by the current pathname via usePathname().
 * Active tab label and icon render in indigo. Inactive tabs render in zinc-500.
 *
 * Usage:
 *   Add <NavBar /> to src/app/layout.tsx inside <body> so it appears
 *   on every page automatically.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// TAB DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  {
    label: 'Home',
    href:  '/home',
    icon:  (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    label: 'Calendar',
    href:  '/calendar',
    icon:  (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: 'Recovery',
    href:  '/recovery',
    icon:  (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M8 12h4l2-4 2 8 2-4h2" />
      </svg>
    ),
  },
  {
    label: 'History',
    href:  '/history',
    icon:  (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 4-6" />
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-900 border-t border-zinc-800">
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {TABS.map(tab => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-indigo-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.icon(isActive)}
              <span className={`text-[10px] font-medium ${
                isActive ? 'text-indigo-400' : 'text-zinc-500'
              }`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
