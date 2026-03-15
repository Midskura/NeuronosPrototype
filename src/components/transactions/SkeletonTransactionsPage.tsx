// src/components/transactions/SkeletonTransactionsPage.tsx
export function SkeletonTransactionsPage() {
  return (
    <div className="h-full flex flex-col bg-[#F7FAF8] overflow-hidden animate-pulse">
      {/* Bank cards carousel skeleton */}
      <div className="px-6 py-4 border-b border-[#E5E9F0] bg-white flex gap-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 w-56 rounded-xl bg-[#E5E9F0] flex-shrink-0" />
        ))}
      </div>

      {/* Control bar skeleton */}
      <div className="px-6 py-3 border-b border-[#E5E9F0] bg-white flex items-center gap-3">
        <div className="h-8 w-48 rounded-md bg-[#E5E9F0]" />
        <div className="h-8 w-32 rounded-md bg-[#E5E9F0]" />
        <div className="ml-auto h-8 w-28 rounded-md bg-[#E5E9F0]" />
      </div>

      {/* Table skeleton */}
      <div className="flex-1 overflow-hidden px-6 py-4 flex flex-col gap-2">
        {/* Header row */}
        <div className="flex gap-4 pb-2 border-b border-[#E5E9F0]">
          {[40, 80, 120, 100, 80, 60].map((w, i) => (
            <div key={i} className="h-4 rounded bg-[#E5E9F0]" style={{ width: w }} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-[#E5E9F0]">
            {[40, 80, 120, 100, 80, 60].map((w, j) => (
              <div key={j} className="h-4 rounded bg-[#E5E9F0]" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
