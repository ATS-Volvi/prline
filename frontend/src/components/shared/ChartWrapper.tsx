import React, { useState, useId } from 'react';
import { exportPNG } from '../../utils/exportUtils';

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  children: React.ReactNode;
  height?: number;
  /** Optional rows for CSV download of underlying chart data */
  csvRows?: Record<string, unknown>[];
}

/**
 * Wraps any Recharts chart with:
 * - Labeled header
 * - Fullscreen modal (ESC or X to close)
 * - Export as PNG button
 * - Matches app light design system
 */
const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  accentColor = '#14b8a6',
  children,
  height = 260,
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const uid = useId().replace(/:/g, '');
  const chartId = `chart-wrap-${uid}`;
  const modalId = `chart-modal-${uid}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setFullscreen(false);
  };

  return (
    <>
      {/* Normal card */}
      <div
        id={chartId}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all"
        style={{ borderLeft: `4px solid ${accentColor}` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] text-secondary mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button
              onClick={() => exportPNG(chartId, title)}
              className="p-1 rounded hover:bg-surface-container text-secondary cursor-pointer transition-all"
              title="Export PNG"
            >
              <span className="material-symbols-outlined text-sm">image</span>
            </button>
            <button
              onClick={() => setFullscreen(true)}
              className="p-1 rounded hover:bg-surface-container text-secondary cursor-pointer transition-all"
              title="Fullscreen"
            >
              <span className="material-symbols-outlined text-sm">fullscreen</span>
            </button>
          </div>
        </div>

        {/* Chart content */}
        <div style={{ height }} className="w-full">
          {children}
        </div>
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setFullscreen(false); }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div
            id={modalId}
            className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <div>
                <h2 className="text-sm font-bold text-primary">{title}</h2>
                {subtitle && <p className="text-[10px] text-secondary">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportPNG(modalId, title)}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container text-secondary text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-sm">image</span>
                  Export PNG
                </button>
                <button
                  onClick={() => setFullscreen(false)}
                  className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container text-secondary cursor-pointer transition-all"
                  title="Close"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>

            {/* Chart enlarged */}
            <div className="p-6" style={{ height: 480 }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(ChartWrapper);
