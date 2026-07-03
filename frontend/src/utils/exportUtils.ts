// ─── Export Utilities ─────────────────────────────────────────────────────
// Client-side export: PDF (jsPDF + html2canvas), Excel (xlsx), CSV, JSON.
// All functions are async and return a Promise<void>.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';

const BRAND_COLOR = '#182c47';
const ACCENT_COLOR = '#14b8a6';

const MARGIN_LEFT = 20; // Shared left margin pt

function drawHorizontalBarChart(
  pdf: jsPDF,
  data: { label: string; value: number; color: string }[],
  opts: { x: number; y: number; width: number; barHeight?: number; gap?: number; axisTitle?: string }
): number {
  const barHeight = opts.barHeight ?? 12;
  const gap = opts.gap ?? 8;
  const labelColW = opts.width * 0.35; // reserve portion for labels
  const plotW = opts.width - labelColW - 60; // room for value labels
  const plotX = opts.x + labelColW;
  const rawMax = Math.max(1, ...data.map(d => d.value));

  // Determine a nice max limit for axis ticks
  let maxVal = rawMax;
  if (rawMax > 100) {
    maxVal = Math.ceil(rawMax / 50) * 50;
  } else if (rawMax > 10) {
    maxVal = Math.ceil(rawMax / 10) * 10;
  } else {
    maxVal = Math.ceil(rawMax / 2) * 2;
  }

  let y = opts.y;

  data.forEach(d => {
    const barW = (d.value / maxVal) * plotW;
    
    // Label right-aligned
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor('#334155');
    
    // Truncate label if too long for layout
    let cleanLabel = d.label;
    if (cleanLabel.length > 25) {
      cleanLabel = cleanLabel.substring(0, 22) + '...';
    }
    
    pdf.text(cleanLabel, plotX - 8, y + barHeight / 2 + 3, { align: 'right' });
    
    // Colored Bar
    pdf.setFillColor(d.color);
    pdf.rect(plotX, y, barW, barHeight, 'F');
    
    // Value text
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor('#1e293b');
    pdf.text(`${d.value} days`, plotX + barW + 8, y + barHeight / 2 + 3);
    
    y += barHeight + gap;
  });

  // Draw axis line
  const axisY = y + 2;
  pdf.setDrawColor('#cbd5e1');
  pdf.setLineWidth(0.5);
  pdf.line(plotX, axisY, plotX + plotW, axisY);

  // Axis ticks
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    const tickVal = Math.round((maxVal / tickCount) * i);
    const tickX = plotX + (tickVal / maxVal) * plotW;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor('#64748b');
    pdf.text(String(tickVal), tickX, axisY + 11, { align: 'center' });
    
    // tick mark tick
    pdf.line(tickX, axisY, tickX, axisY + 3);
  }

  if (opts.axisTitle) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor('#64748b');
    pdf.text(opts.axisTitle, plotX + plotW / 2, axisY + 22, { align: 'center' });
  }

  return axisY + 28;
}

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
      pdf.text(title, MARGIN_LEFT, 26);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(subtitle, MARGIN_LEFT, 40);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, MARGIN_LEFT, 52);

      // Logo
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor('#14b8a6');
      pdf.text('PLANTOPS', pageW - MARGIN_LEFT, 30, { align: 'right' });
      pdf.setFontSize(7);
      pdf.setTextColor('#94a3b8');
      pdf.text('AI Operations Platform', pageW - MARGIN_LEFT, 42, { align: 'right' });

      // Image
      const imgW = pageW - MARGIN_LEFT * 2;
      const imgH = Math.min(contentH - 10, (canvas.height / canvas.width) * imgW);
      pdf.addImage(imgData, 'PNG', MARGIN_LEFT, headerH + 10, imgW, imgH);

      // Footer
      pdf.setFillColor('#f8fafc');
      pdf.rect(0, pageH - footerH, pageW, footerH, 'F');
      pdf.setTextColor('#64748b');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('CONFIDENTIAL — PepsiCo Internal Document', pageW / 2, pageH - 10, { align: 'center' });
      pdf.text(`Page 1`, pageW - MARGIN_LEFT, pageH - 10, { align: 'right' });

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
    const CONTENT_WIDTH = pageW - MARGIN_LEFT * 2;

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
      pdf.text(title, MARGIN_LEFT, 26);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(subtitle, MARGIN_LEFT, 40);
      pdf.text(`Report Generated: ${new Date().toLocaleString()}`, MARGIN_LEFT, 52);

      // Logo
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor('#14b8a6');
      pdf.text('PLANTOPS', pageW - MARGIN_LEFT, 30, { align: 'right' });
      pdf.setFontSize(7);
      pdf.setTextColor('#94a3b8');
      pdf.text('AI Operations Platform', pageW - MARGIN_LEFT, 42, { align: 'right' });

      // Footer
      pdf.setFillColor('#f8fafc');
      pdf.rect(0, pageH - footerH, pageW, footerH, 'F');
      pdf.setTextColor('#64748b');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('CONFIDENTIAL — PepsiCo Internal Document', pageW / 2, pageH - 10, { align: 'center' });
      pdf.text(`Page ${pageNum}`, pageW - MARGIN_LEFT, pageH - 10, { align: 'right' });
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
        pdf.text(titleText, MARGIN_LEFT, y + 5);
        y += 20;
      } else if (line.startsWith('####')) {
        const subTitleText = line.replace(/^####\s+/, '').replace(/\*\*/g, '');
        checkPageBreak(20);
        pdf.setTextColor('#475569');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(subTitleText, MARGIN_LEFT, y + 3);
        y += 15;
      } else if (line.startsWith('-')) {
        const bulletText = line.replace(/^-\s+/, '').replace(/\*\*/g, '');
        const wrapped = pdf.splitTextToSize(bulletText, CONTENT_WIDTH - 20);
        checkPageBreak(wrapped.length * 11 + 5);
        pdf.setTextColor('#334155');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        wrapped.forEach((wLine: string, idx: number) => {
          if (idx === 0) {
            pdf.text('•', MARGIN_LEFT + 2, y + 2);
          }
          pdf.text(wLine, MARGIN_LEFT + 12, y + 2);
          y += 10.5;
        });
        y += 3;
      } else if (line !== '') {
        const cleanLine = line.replace(/\*\*/g, '');
        const wrapped = pdf.splitTextToSize(cleanLine, CONTENT_WIDTH);
        checkPageBreak(wrapped.length * 11 + 5);
        pdf.setTextColor('#334155');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        wrapped.forEach((wLine: string) => {
          pdf.text(wLine, MARGIN_LEFT, y + 2);
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
        margin: { left: MARGIN_LEFT, right: MARGIN_LEFT },
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

    // 3. Render chart natively via jsPDF vector primitives
    if (messageData.chart && messageData.chart.data) {
      const chartData = messageData.chart.data.map((d: any) => ({
        label: d.name,
        value: d.days,
        color: d.color
      }));

      const barHeight = 12;
      const gap = 8;
      const chartBoxHeight = 15 + chartData.length * (barHeight + gap) - gap + 40;

      // Check space, reserve for insights (around 120pt)
      const insightsSectionH = postTableLines.length * 11.5 + 40;
      const remainingSpace = pageH - footerH - y - 20;

      if (remainingSpace < chartBoxHeight + insightsSectionH) {
        checkPageBreak(chartBoxHeight + insightsSectionH);
      }

      // Draw background container card aligned to MARGIN_LEFT
      pdf.setFillColor('#f8fafc');
      pdf.setDrawColor('#e2e8f0');
      pdf.setLineWidth(0.5);
      pdf.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, chartBoxHeight, 4, 4, 'FD');

      // Draw native horizontal vector chart
      y = drawHorizontalBarChart(pdf, chartData, {
        x: MARGIN_LEFT + 15,
        y: y + 15,
        width: CONTENT_WIDTH - 30,
        barHeight,
        gap,
        axisTitle: messageData.chart.xAxisTitle || 'Days Overdue'
      });

      y += 20; // spacing below chart container
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
        pdf.text(titleText, MARGIN_LEFT, y + 5);
        y += 20;
      } else if (line.startsWith('####')) {
        const subTitleText = line.replace(/^####\s+/, '').replace(/\*\*/g, '');
        checkPageBreak(20);
        pdf.setTextColor('#475569');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(subTitleText, MARGIN_LEFT, y + 3);
        y += 15;
      } else if (line.startsWith('-')) {
        const bulletText = line.replace(/^-\s+/, '').replace(/\*\*/g, '');
        const wrapped = pdf.splitTextToSize(bulletText, CONTENT_WIDTH - 20);
        checkPageBreak(wrapped.length * 11 + 5);
        pdf.setTextColor('#334155');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        wrapped.forEach((wLine: string, idx: number) => {
          if (idx === 0) {
            pdf.text('•', MARGIN_LEFT + 2, y + 2);
          }
          pdf.text(wLine, MARGIN_LEFT + 12, y + 2);
          y += 10.5;
        });
        y += 3;
      } else if (line !== '') {
        const cleanLine = line.replace(/\*\*/g, '');
        const wrapped = pdf.splitTextToSize(cleanLine, CONTENT_WIDTH);
        checkPageBreak(wrapped.length * 11 + 5);
        pdf.setTextColor('#334155');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        wrapped.forEach((wLine: string) => {
          pdf.text(wLine, MARGIN_LEFT, y + 2);
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
