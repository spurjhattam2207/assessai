"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function PerformanceFilters() {
  const router = useRouter();
  const params = useSearchParams();
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/student/performance?${next.toString()}`);
  }
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <select
        className="h-11 rounded-md border border-line bg-white px-3 text-sm"
        defaultValue={params.get("audience") || ""}
        onChange={(e) => update("audience", e.target.value)}
      >
        <option value="">All tracks</option>
        <option value="JEE">JEE</option>
        <option value="UPSC">UPSC</option>
        <option value="COLLEGE">College</option>
      </select>
      <input
        className="h-11 rounded-md border border-line px-3 text-sm"
        placeholder="Subject / course"
        defaultValue={params.get("subject") || ""}
        onBlur={(e) => update("subject", e.target.value)}
      />
      <input
        className="h-11 rounded-md border border-line px-3 text-sm"
        placeholder="Topic"
        defaultValue={params.get("topic") || ""}
        onBlur={(e) => update("topic", e.target.value)}
      />
    </div>
  );
}
