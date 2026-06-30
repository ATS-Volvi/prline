import React, { useState } from 'react';
import { exportPDF, exportPNG, exportCSV, exportJSON, exportExcel } from '../../utils/exportUtils';

interface ExportToolbarProps {
  /** ID of the DOM element to screenshot for PDF/PNG */
  elementId: string;
  /** Title for the PDF header */
  reportTitle?: string;
  /** Optional raw rows for Excel/CSV download */
  csvRows?: Record<string, unknown>[];
  /** Optional raw object for JSON download */
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
  csvRows,
  jsonData,
  filename = 'PlantOps_Report',
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

      {/* PNG */}
      <button
        className={btnClass}
        onClick={() => handle('png', () => exportPNG(elementId, filename))}
        title="Export PNG"
        disabled={loading === 'png'}
      >
        <span className={`material-symbols-outlined ${iconSize}`}>image</span>
        {!compact && 'PNG'}
      </button>

      {/* Excel */}
      {csvRows && (
        <button
          className={btnClass}
          onClick={() => handle('excel', () => exportExcel(csvRows, filename))}
          title="Export Excel"
          disabled={loading === 'excel'}
        >
          <span className={`material-symbols-outlined ${iconSize}`}>table_chart</span>
          {!compact && 'Excel'}
        </button>
      )}

      {/* CSV */}
      {csvRows && (
        <button
          className={btnClass}
          onClick={() => handle('csv', () => exportCSV(csvRows, filename))}
          title="Export CSV"
          disabled={loading === 'csv'}
        >
          <span className={`material-symbols-outlined ${iconSize}`}>download</span>
          {!compact && 'CSV'}
        </button>
      )}

      {/* JSON */}
      {jsonData !== undefined && (
        <button
          className={btnClass}
          onClick={() => handle('json', () => exportJSON(jsonData, filename))}
          title="Export JSON"
          disabled={loading === 'json'}
        >
          <span className={`material-symbols-outlined ${iconSize}`}>data_object</span>
          {!compact && 'JSON'}
        </button>
      )}

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
