// ─── Export Utilities ─────────────────────────────────────────────────────
// Client-side export: PDF (jsPDF + html2canvas), Excel (xlsx), CSV, JSON.
// All functions are async and return a Promise<void>.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';

const BRAND_COLOR = '#182c47';
const ACCENT_COLOR = '#14b8a6';

/** Generate a structured, professional, vector-text based PDF with charts embedded */
export async function exportPDF(
  elementId: string,
  title = 'PlantOps Report',
  subtitle = 'PepsiCo Kolkata Plant',
  messageData?: any
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`exportPDF: element #${elementId} not found`);
    return;
  }

  // Fallback to legacy screenshot export if no structured message data is present
  if (!messageData || !messageData.text) {
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

      // Logo
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor('#14b8a6');
      pdf.text('PLANTOPS', pageW - 20, 30, { align: 'right' });
      pdf.setFontSize(7);
      pdf.setTextColor('#94a3b8');
      pdf.text('AI Operations Platform', pageW - 20, 42, { align: 'right' });

      // Image
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
      console.error('Legacy screenshot PDF fallback failed:', err);
    }
    return;
  }

  // Structured professional vector layout
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const headerH = 60;
    const footerH = 30;

    const drawHeaderFooter = (pageNum: number) => {
      // Header
      pdf.setFillColor(BRAND_COLOR);
      pdf.rect(0, 0, pageW, headerH, 'F');
      pdf.setFillColor(ACCENT_COLOR);
      pdf.rect(0, headerH - 3, pageW, 3, 'F');

      // Title & metadata
      pdf.setTextColor('#ffffff');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text(title, 20, 26);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(subtitle, 20, 40);
      pdf.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 52);

      // Logo
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor('#14b8a6');
      pdf.text('PLANTOPS', pageW - 20, 30, { align: 'right' });
      pdf.setFontSize(7);
      pdf.setTextColor('#94a3b8');
      pdf.text('AI Operations Platform', pageW - 20, 42, { align: 'right' });

      // Footer
      pdf.setFillColor('#f8fafc');
      pdf.rect(0, pageH - footerH, pageW, footerH, 'F');
      pdf.setTextColor('#64748b');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('CONFIDENTIAL — PepsiCo Internal Document', pageW / 2, pageH - 10, { align: 'center' });
      pdf.text(`Page ${pageNum}`, pageW - 20, pageH - 10, { align: 'right' });
    };

    let y = headerH + 25;
    let pageNum = 1;
    drawHeaderFooter(pageNum);

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageH - footerH - 15) {
        pdf.addPage();
        pageNum++;
        drawHeaderFooter(pageNum);
        y = headerH + 25;
      }
    };

    // Split text into pre-table, table, and post-table lines
    const lines = messageData.text.split('\n');
    let preTableLines: string[] = [];
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];
    let postTableLines: string[] = [];
    let seenTable = false;
    let finishedTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|')) {
        seenTable = true;
        const cols = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (line.includes(':---') || line.includes('---')) {
          continue;
        }
        if (tableHeaders.length === 0) {
          tableHeaders = cols;
        } else {
          tableRows.push(cols);
        }
      } else {
        if (seenTable) {
          finishedTable = true;
        }
        if (finishedTable) {
          postTableLines.push(line);
        } else {
          preTableLines.push(line);
        }
      }
    }

    // 1. Render pre-table text (Summary, title, etc.)
    for (let i = 0; i < preTableLines.length; i++) {
      const line = preTableLines[i].trim();
      if (line.startsWith('###')) {
        const titleText = line.replace(/^###\s+/, '').replace(/\*\*/g, '');
        checkPageBreak(25);
        pdf.setTextColor(BRAND_COLOR);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.text(titleText, 20, y + 5);
        y += 20;
      } else if (line.startsWith('####')) {
        const subTitleText = line.replace(/^####\s+/, '').replace(/\*\*/g, '');
        checkPageBreak(20);
        pdf.setTextColor('#475569');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(subTitleText, 20, y + 3);
        y += 15;
      } else if (line.startsWith('-')) {
        const bulletText = line.replace(/^-\s+/, '').replace(/\*\*/g, '');
        const wrapped = pdf.splitTextToSize(bulletText, pageW - 60);
        checkPageBreak(wrapped.length * 11 + 5);
        pdf.setTextColor('#334155');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        wrapped.forEach((wLine: string, idx: number) => {
          if (idx === 0) {
            pdf.text('•', 22, y + 2);
          }
          pdf.text(wLine, 32, y + 2);
          y += 10.5;
        });
        y += 3;
      } else if (line !== '') {
        const cleanLine = line.replace(/\*\*/g, '');
        const wrapped = pdf.splitTextToSize(cleanLine, pageW - 40);
        checkPageBreak(wrapped.length * 11 + 5);
        pdf.setTextColor('#334155');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        wrapped.forEach((wLine: string) => {
          pdf.text(wLine, 20, y + 2);
          y += 10.5;
        });
        y += 4;
      }
    }

    // 2. Render table using jspdf-autotable
    if (tableHeaders.length > 0) {
      const cleanHeaders = tableHeaders.map(h => h.replace(/\*\*/g, '').trim());
      const cleanRows = tableRows.map(row => 
        row.map(cell => cell.replace(/\*\*/g, '').trim())
      );

      checkPageBreak(30);

      autoTable(pdf, {
        startY: y,
        head: [cleanHeaders],
        body: cleanRows,
        theme: 'striped',
        headStyles: { fillColor: [24, 44, 71] }, // BRAND_COLOR
        styles: { fontSize: 8.5, cellPadding: 6, font: 'helvetica' },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const cellText = String(data.cell.raw || '');
            const cellTextLower = cellText.toLowerCase();
            
            // Color the Status column matching our StatusBadge colors
            if (cellTextLower.includes('expired')) {
              data.cell.styles.fillColor = '#FEE2E2';
              data.cell.styles.textColor = '#B91C1C';
              data.cell.styles.fontStyle = 'bold';
            } else if (cellTextLower.includes('expiring') || cellTextLower.includes('soon')) {
              data.cell.styles.fillColor = '#FEF3C7';
              data.cell.styles.textColor = '#B45309';
              data.cell.styles.fontStyle = 'bold';
            } else if (cellTextLower.includes('valid')) {
              data.cell.styles.fillColor = '#D1FAE5';
              data.cell.styles.textColor = '#047857';
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      y = (pdf as any).lastAutoTable.finalY + 15;
    }

    // 3. Render chart with height bound to remaining space
    if (messageData.chart) {
      const chartEl = element.querySelector('.recharts-responsive-container') || element.querySelector('.chart-container');
      if (chartEl) {
        const canvas = await html2canvas(chartEl as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        const imgW = pageW - 60;
        
        // Estimate post-table insights height to reserve space
        const insightsSectionH = postTableLines.length * 11.5 + 40;
        
        // Push chart to next page if remaining space is too tight
        const remainingSpace = pageH - footerH - y - 20;
        if (remainingSpace < 120) {
          checkPageBreak(120);
        }

        const chartMaxH = Math.max(100, pageH - footerH - y - insightsSectionH - 25);
        const imgH = Math.min(chartMaxH, (canvas.height / canvas.width) * imgW);
        
        pdf.setFillColor('#f8fafc');
        pdf.rect(20, y, pageW - 40, imgH + 15, 'F');
        pdf.setDrawColor('#e2e8f0');
        pdf.rect(20, y, pageW - 40, imgH + 15);
        pdf.addImage(imgData, 'PNG', 30, y + 7, imgW, imgH);
        y += imgH + 25;
      }
    }

    // 4. Render post-table text (Key Insights & Recommended Actions)
    for (let i = 0; i < postTableLines.length; i++) {
      const line = postTableLines[i].trim();
      if (line.startsWith('###')) {
        const titleText = line.replace(/^###\s+/, '').replace(/\*\*/g, '');
        checkPageBreak(25);
        pdf.setTextColor(BRAND_COLOR);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.text(titleText, 20, y + 5);
        y += 20;
      } else if (line.startsWith('####')) {
        const subTitleText = line.replace(/^####\s+/, '').replace(/\*\*/g, '');
        checkPageBreak(20);
        pdf.setTextColor('#475569');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(subTitleText, 20, y + 3);
        y += 15;
      } else if (line.startsWith('-')) {
        const bulletText = line.replace(/^-\s+/, '').replace(/\*\*/g, '');
        const wrapped = pdf.splitTextToSize(bulletText, pageW - 60);
        checkPageBreak(wrapped.length * 11 + 5);
        pdf.setTextColor('#334155');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        wrapped.forEach((wLine: string, idx: number) => {
          if (idx === 0) {
            pdf.text('•', 22, y + 2);
          }
          pdf.text(wLine, 32, y + 2);
          y += 10.5;
        });
        y += 3;
      } else if (line !== '') {
        const cleanLine = line.replace(/\*\*/g, '');
        const wrapped = pdf.splitTextToSize(cleanLine, pageW - 40);
        checkPageBreak(wrapped.length * 11 + 5);
        pdf.setTextColor('#334155');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        wrapped.forEach((wLine: string) => {
          pdf.text(wLine, 20, y + 2);
          y += 10.5;
        });
        y += 4;
      }
    }

    const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  } catch (err) {
    console.error('Structured PDF export failed:', err);
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
