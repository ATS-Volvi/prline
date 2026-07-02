import React, { useState } from 'react';
import { exportPDF } from '../../utils/exportUtils';

interface ExportToolbarProps {
  /** ID of the DOM element to screenshot for PDF */
  elementId: string;
  /** Title for the PDF header */
  reportTitle?: string;
  /** Unused — kept for call-site compatibility */
  csvRows?: Record<string, unknown>[];
  /** Unused — kept for call-site compatibility */
  jsonData?: unknown;
  /** Base filename (no extension) */
  filename?: string;
  /** Compact mode — icon buttons only */
  compact?: boolean;
  onPrint?: () => void;
}

const ExportToolbar: React.FC<ExportToolbarProps> = ({
  elementId,
  reportTitle = 'PlantOps Report',
  compact = false,
  onPrint,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handle = async (action: string, fn: () => Promise<void> | void) => {
    setLoading(action);
    try {
      await fn();
    } finally {
      setLoading(null);
    }
  };

  const btnClass = compact
    ? 'p-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-secondary text-xs flex items-center justify-center transition-all cursor-pointer'
    : 'px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-secondary text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap';

  const iconSize = 'text-sm';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* PDF */}
      <button
        className={btnClass}
        onClick={() => handle('pdf', () => exportPDF(elementId, reportTitle))}
        title="Export PDF"
        disabled={loading === 'pdf'}
      >
        <span className={`material-symbols-outlined ${iconSize}`}>picture_as_pdf</span>
        {!compact && (loading === 'pdf' ? 'Generating...' : 'PDF')}
      </button>

      {/* Print */}
      <button
        className={btnClass}
        onClick={onPrint ?? (() => window.print())}
        title="Print"
      >
        <span className={`material-symbols-outlined ${iconSize}`}>print</span>
        {!compact && 'Print'}
      </button>
    </div>
  );
};

export default ExportToolbar;
