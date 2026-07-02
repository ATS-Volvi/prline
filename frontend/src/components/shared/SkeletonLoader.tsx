import React from 'react';

interface SkeletonCardProps {
  lines?: number;
  height?: number;
}

/** Animated skeleton loading card */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3, height = 120 }) => (
  <div
    className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm animate-pulse"
    style={{ minHeight: height }}
  >
    <div className="h-3 bg-surface-container-high rounded w-1/3 mb-3" />
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`h-2.5 bg-surface-container rounded mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);

/** Skeleton for KPI grid */
export const SkeletonKpiGrid: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} lines={2} height={90} />
    ))}
  </div>
);

/** Skeleton for chart area */
export const SkeletonChart: React.FC<{ height?: number }> = ({ height = 280 }) => (
  <div
    className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm animate-pulse flex flex-col gap-3"
    style={{ height }}
  >
    <div className="h-3 bg-surface-container-high rounded w-1/4" />
    <div className="flex-1 bg-surface-container rounded-lg" />
  </div>
);

/** Full page skeleton — header + KPI grid + 2 charts */
const SkeletonLoader: React.FC = () => (
  <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-surface-container-low/40 animate-fade-in">
    {/* Header */}
    <div className="flex items-center gap-4">
      <div className="h-6 w-6 bg-surface-container-high rounded animate-pulse" />
      <div>
        <div className="h-4 bg-surface-container-high rounded w-48 mb-2 animate-pulse" />
        <div className="h-2.5 bg-surface-container rounded w-32 animate-pulse" />
      </div>
    </div>

    {/* KPI cards */}
    <SkeletonKpiGrid count={4} />

    {/* Charts */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>
  </div>
);

export default SkeletonLoader;
