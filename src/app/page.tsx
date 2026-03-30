'use client';

/**
 * src/app/page.tsx
 *
 * Root page — redirects to the calendar screen for the POC.
 *
 * During the POC there is no home screen yet (that is step 15).
 * This page simply provides a landing point with a link to the
 * calendar screen so testers do not have to type /calendar manually.
 */

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-950 gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">STRATA</h1>
        <p className="text-zinc-400 text-sm">Mental performance platform — POC</p>
      </div>
      <Link
        href="/calendar"
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Open Calendar →
      </Link>
    </div>
  );
}
