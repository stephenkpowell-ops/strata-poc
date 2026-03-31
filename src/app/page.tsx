import { redirect } from 'next/navigation';

/**
 * src/app/page.tsx
 *
 * Root route — immediately redirects to /home.
 *
 * Now that the NavBar is in place, there is no need for a separate
 * landing page. Visiting localhost:3000 drops the user straight
 * into the home screen.
 *
 * This is a server component (no 'use client') so the redirect
 * happens on the server before anything is sent to the browser.
 */

export default function RootPage() {
  redirect('/home');
}
