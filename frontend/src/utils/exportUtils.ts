// ─── Export Utilities ─────────────────────────────────────────────────────
// Client-side export: PDF (jsPDF + html2canvas), Excel (xlsx), CSV, JSON.
// All functions are async and return a Promise<void>.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const BRAND_COLOR = '#182c47';
const ACCENT_COLOR = '#14b8a6';

/** Screenshot a DOM element and save as PDF with branding header */
export async function exportPDF(
  elementId: string,
  title = 'PlantOps Report',
  subtitle = 'PepsiCo Kolkata Plant'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`exportPDF: element #${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const headerH = 60;
    const footerH = 30;
    const contentH = pageH - headerH - footerH;

    // Header bar
    pdf.setFillColor(BRAND_COLOR);
    pdf.rect(0, 0, pageW, headerH, 'F');

    // Accent stripe
    pdf.setFillColor(ACCENT_COLOR);
    pdf.rect(0, headerH - 3, pageW, 3, 'F');

    // Header text
    pdf.setTextColor('#ffffff');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(title, 20, 26);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(subtitle, 20, 40);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 52);

    // Logo placeholder (right side)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor('#14b8a6');
    pdf.text('PLANTOPS', pageW - 20, 30, { align: 'right' });
    pdf.setFontSize(7);
    pdf.setTextColor('#94a3b8');
    pdf.text('AI Operations Platform', pageW - 20, 42, { align: 'right' });

    // Content image
    const imgW = pageW - 40;
    const imgH = Math.min(contentH - 10, (canvas.height / canvas.width) * imgW);
    pdf.addImage(imgData, 'PNG', 20, headerH + 10, imgW, imgH);

    // Footer
    pdf.setFillColor('#f8fafc');
    pdf.rect(0, pageH - footerH, pageW, footerH, 'F');
    pdf.setTextColor('#64748b');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('CONFIDENTIAL — PepsiCo Internal Document', pageW / 2, pageH - 10, { align: 'center' });
    pdf.text(`Page 1`, pageW - 20, pageH - 10, { align: 'right' });

    const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  } catch (err) {
    console.error('exportPDF failed:', err);
  }
}

/** Export rows as Excel .xlsx file */
export function exportExcel(
  rows: Record<string, unknown>[],
  filename = 'PlantOps_Report',
  sheetName = 'Data'
): void {
  if (!rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/** Export rows as CSV */
export function exportCSV(
  rows: Record<string, unknown>[],
  filename = 'PlantOps_Export'
): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '');
        return val.includes(',') ? `"${val}"` : val;
      }).join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export any object as JSON */
export function exportJSON(data: unknown, filename = 'PlantOps_Data'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Screenshot a DOM element and download as PNG */
export async function exportPNG(elementId: string, filename = 'PlantOps_Chart'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;
  try {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
    a.click();
  } catch (err) {
    console.error('exportPNG failed:', err);
  }
}
