import React, { useEffect, useRef, useState } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendUp?: boolean;   // true = green, false = red, undefined = neutral
  icon?: string;       // material symbol name
  accentColor?: string; // left border color
  subtitle?: string;
  ring?: number;       // 0-100 for a progress ring overlay
  animate?: boolean;   // animate count-up for numeric values
  onClick?: () => void;
}

/** Animated enterprise KPI card — matches the app's light color system */
const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  trend,
  trendUp,
  icon,
  accentColor = '#14b8a6',
  subtitle,
  ring,
  animate = true,
  onClick,
}) => {
  const [displayValue, setDisplayValue] = useState<string | number>(value);
  const prevValue = useRef<string | number>(value);
  const rafRef = useRef<number>(0);

  // Animated number counter on value change
  useEffect(() => {
    const numericNew = typeof value === 'number' ? value : parseFloat(String(value));
    const numericPrev = typeof prevValue.current === 'number'
      ? prevValue.current
      : parseFloat(String(prevValue.current));

    if (animate && !isNaN(numericNew) && !isNaN(numericPrev) && numericNew !== numericPrev) {
      const start = numericPrev;
      const end = numericNew;
      const duration = 600;
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);
        setDisplayValue(current);
        if (progress < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    } else {
      setDisplayValue(value);
    }
    prevValue.current = value;
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, animate]);

  const trendColor = trendUp === true
    ? 'text-emerald-600'
    : trendUp === false
    ? 'text-red-500'
    : 'text-slate-500';

  const trendIcon = trendUp === true ? '▲' : trendUp === false ? '▼' : '–';

  return (
    <div
      onClick={onClick}
      className={`relative bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      } overflow-hidden`}
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      {/* Background accent glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 pointer-events-none"
        style={{ background: accentColor, transform: 'translate(30%, -30%)' }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold font-mono text-secondary uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <span
            className="material-symbols-outlined text-base"
            style={{ color: accentColor, fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold text-primary font-mono leading-none tabular-nums">
          {displayValue}
        </span>
        {unit && (
          <span className="text-xs font-mono text-secondary mb-0.5">{unit}</span>
        )}
      </div>

      {/* Progress ring overlay (optional) */}
      {ring !== undefined && (
        <div className="mt-1">
          <div className="flex justify-between text-[9px] font-mono text-secondary mb-0.5">
            <span>Progress</span>
            <span>{ring}%</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${ring}%`, background: accentColor }}
            />
          </div>
        </div>
      )}

      {/* Trend */}
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-bold ${trendColor}`}>
          <span>{trendIcon}</span>
          <span>{trend}</span>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[9px] text-secondary leading-tight mt-auto">{subtitle}</p>
      )}
    </div>
  );
};

export default React.memo(KpiCard);
