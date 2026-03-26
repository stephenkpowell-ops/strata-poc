'use client';

import { useStrata } from "@/lib/store";

export default function Home() {
  const { dailyResult } = useStrata();

  return (
    <main className="p-8 font-mono text-sm">
      <h1 className="text-lg font-bold mb-4">Strata — Store verification</h1>
      <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded overflow-auto">
        {JSON.stringify(dailyResult, null, 2)}
      </pre>
    </main>
  );
}
