/**
 * NeuronSkeleton — Reusable skeleton loading components
 * Follows Neuron design system: stroke borders, no shadows, deep green accents
 * 
 * Part of: Performance Optimization Phase 1
 */

import { memo } from "react";

// ─── Base Shimmer ───────────────────────────────────────────
const shimmerClass = "animate-pulse bg-[#EEF3F1] rounded";

/** A single rectangular shimmer bar */
export const SkeletonBar = memo(({ 
  width = "100%", 
  height = "14px",
  className = ""
}: { 
  width?: string | number; 
  height?: string | number;
  className?: string;
}) => (
  <div 
    className={`${shimmerClass} ${className}`} 
    style={{ width, height, minWidth: typeof width === 'number' ? width : undefined }} 
  />
));
SkeletonBar.displayName = "SkeletonBar";

/** A circular shimmer (for avatars, icons) */
export const SkeletonCircle = memo(({ size = 32 }: { size?: number }) => (
  <div 
    className="animate-pulse bg-[#EEF3F1] rounded-full shrink-0"
    style={{ width: size, height: size }} 
  />
));
SkeletonCircle.displayName = "SkeletonCircle";

// ─── Bank Card Skeleton (for Transactions carousel) ────────
export const SkeletonBankCard = memo(({ isSelected = false }: { isSelected?: boolean }) => (
  <div 
    className={`shrink-0 rounded-lg border p-4 transition-all ${
      isSelected 
        ? "border-[#0F766E] bg-[#F0FDFA]" 
        : "border-[#E5ECE9] bg-white"
    }`}
    style={{ width: 200, height: 90 }}
  >
    <SkeletonBar width="70%" height={12} />
    <div className="mt-3">
      <SkeletonBar width="90%" height={20} />
    </div>
    <div className="mt-2">
      <SkeletonBar width="50%" height={10} />
    </div>
  </div>
));
SkeletonBankCard.displayName = "SkeletonBankCard";

/** Carousel of skeleton bank cards */
export const SkeletonBankCarousel = memo(() => (
  <div className="flex gap-3 overflow-hidden px-1">
    <SkeletonBankCard isSelected />
    <SkeletonBankCard />
    <SkeletonBankCard />
  </div>
));
SkeletonBankCarousel.displayName = "SkeletonBankCarousel";

// ─── Table Skeleton ─────────────────────────────────────────
export const SkeletonTableRow = memo(({ cols = 5 }: { cols?: number }) => {
  // Vary widths to look realistic
  const widths = ["60%", "80%", "45%", "70%", "55%", "40%", "65%"];
  return (
    <div 
      className="flex items-center gap-4 px-4 py-3 border-b border-[#F3F4F6]"
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1">
          <SkeletonBar 
            width={widths[i % widths.length]} 
            height={13} 
          />
        </div>
      ))}
    </div>
  );
});
SkeletonTableRow.displayName = "SkeletonTableRow";

export const SkeletonTableHeader = memo(({ cols = 5 }: { cols?: number }) => (
  <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5ECE9] bg-[#F9FAFB]">
    {Array.from({ length: cols }).map((_, i) => (
      <div key={i} className="flex-1">
        <SkeletonBar width="50%" height={11} className="opacity-60" />
      </div>
    ))}
  </div>
));
SkeletonTableHeader.displayName = "SkeletonTableHeader";

export const SkeletonTable = memo(({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) => (
  <div className="border border-[#E5ECE9] rounded-lg overflow-hidden bg-white">
    <SkeletonTableHeader cols={cols} />
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonTableRow key={i} cols={cols} />
    ))}
  </div>
));
SkeletonTable.displayName = "SkeletonTable";

// ─── KPI Card Skeleton (for Dashboard) ─────────────────────
export const SkeletonKPICard = memo(() => (
  <div className="border border-[#E5ECE9] rounded-xl p-5 bg-white">
    <div className="flex items-center justify-between mb-3">
      <SkeletonBar width="40%" height={12} />
      <SkeletonCircle size={28} />
    </div>
    <SkeletonBar width="60%" height={28} />
    <div className="mt-2">
      <SkeletonBar width="35%" height={11} />
    </div>
  </div>
));
SkeletonKPICard.displayName = "SkeletonKPICard";

/** Row of KPI skeleton cards */
export const SkeletonKPIRow = memo(({ count = 4 }: { count?: number }) => (
  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonKPICard key={i} />
    ))}
  </div>
));
SkeletonKPIRow.displayName = "SkeletonKPIRow";

// ─── Chart Skeleton (for Dashboard) ─────────────────────────
export const SkeletonChart = memo(({ height = 240 }: { height?: number }) => (
  <div 
    className="border border-[#E5ECE9] rounded-xl p-5 bg-white"
  >
    <div className="flex items-center justify-between mb-4">
      <SkeletonBar width="30%" height={14} />
      <SkeletonBar width="15%" height={12} />
    </div>
    <div 
      className="animate-pulse bg-[#EEF3F1] rounded-lg" 
      style={{ height }} 
    />
  </div>
));
SkeletonChart.displayName = "SkeletonChart";

// ─── List Item Skeleton (for Contacts, Customers, etc.) ────
export const SkeletonListItem = memo(() => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F3F4F6]">
    <SkeletonCircle size={36} />
    <div className="flex-1 space-y-1.5">
      <SkeletonBar width="45%" height={13} />
      <SkeletonBar width="70%" height={11} />
    </div>
    <SkeletonBar width={60} height={22} className="rounded-full" />
  </div>
));
SkeletonListItem.displayName = "SkeletonListItem";

// ─── Control Bar Skeleton (tabs + search + filters) ────────
export const SkeletonControlBar = memo(() => (
  <div className="flex items-center justify-between px-0 py-3">
    <div className="flex items-center gap-6">
      <SkeletonBar width={80} height={14} />
      <SkeletonBar width={80} height={14} />
      <SkeletonBar width={80} height={14} />
    </div>
    <div className="flex items-center gap-3">
      <SkeletonBar width={200} height={36} className="rounded-lg" />
      <SkeletonBar width={100} height={36} className="rounded-lg" />
    </div>
  </div>
));
SkeletonControlBar.displayName = "SkeletonControlBar";

// ─── Full Page Skeletons (Composite) ────────────────────────

/** Transactions Module skeleton */
export const SkeletonTransactionsPage = memo(() => (
  <div className="px-12 pt-8 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBar width={200} height={28} />
        <SkeletonBar width={300} height={14} />
      </div>
      <div className="flex gap-3">
        <SkeletonBar width={120} height={36} className="rounded-lg" />
        <SkeletonBar width={140} height={36} className="rounded-lg" />
      </div>
    </div>
    {/* Bank Cards Carousel */}
    <SkeletonBankCarousel />
    {/* Summary Bar */}
    <div className="flex items-center gap-4">
      <SkeletonBar width={160} height={16} />
      <SkeletonBar width={120} height={16} />
    </div>
    {/* Control Bar */}
    <SkeletonControlBar />
    {/* Table */}
    <SkeletonTable rows={8} cols={6} />
  </div>
));
SkeletonTransactionsPage.displayName = "SkeletonTransactionsPage";

/** Projects list skeleton */
export const SkeletonProjectsPage = memo(() => (
  <div className="px-12 pt-8 space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBar width={160} height={28} />
        <SkeletonBar width={260} height={14} />
      </div>
      <SkeletonBar width={140} height={36} className="rounded-lg" />
    </div>
    <SkeletonControlBar />
    <SkeletonTable rows={10} cols={7} />
  </div>
));
SkeletonProjectsPage.displayName = "SkeletonProjectsPage";

/** Bookings list skeleton (Operations) */
export const SkeletonBookingsPage = memo(() => (
  <div className="px-12 pt-8 space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBar width={220} height={28} />
        <SkeletonBar width={320} height={14} />
      </div>
      <SkeletonBar width={160} height={36} className="rounded-lg" />
    </div>
    <SkeletonControlBar />
    <SkeletonTable rows={10} cols={6} />
  </div>
));
SkeletonBookingsPage.displayName = "SkeletonBookingsPage";

/** E-Vouchers list skeleton */
export const SkeletonEVouchersPage = memo(() => (
  <div className="px-12 pt-8 space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBar width={160} height={28} />
        <SkeletonBar width={360} height={14} />
      </div>
      <SkeletonBar width={150} height={36} className="rounded-lg" />
    </div>
    {/* Tabs */}
    <div className="flex items-center gap-8 border-b border-[#E5E9F0] pb-0">
      <SkeletonBar width={130} height={16} />
      <SkeletonBar width={100} height={16} />
      <SkeletonBar width={80} height={16} />
    </div>
    <SkeletonTable rows={8} cols={7} />
  </div>
));
SkeletonEVouchersPage.displayName = "SkeletonEVouchersPage";

/** Dashboard skeleton */
export const SkeletonDashboardPage = memo(() => (
  <div className="px-12 pt-8 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBar width={280} height={28} />
        <SkeletonBar width={200} height={14} />
      </div>
      <SkeletonBar width={150} height={36} className="rounded-lg" />
    </div>
    {/* KPI Cards */}
    <SkeletonKPIRow count={4} />
    {/* Charts */}
    <div className="grid grid-cols-2 gap-4">
      <SkeletonChart height={220} />
      <SkeletonChart height={220} />
    </div>
    {/* Table */}
    <SkeletonTable rows={5} cols={5} />
  </div>
));
SkeletonDashboardPage.displayName = "SkeletonDashboardPage";
