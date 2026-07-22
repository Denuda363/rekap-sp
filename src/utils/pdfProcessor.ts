import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataRow } from '../types';

export const exportToPDF = (
  data: DataRow[],
  headers: string[],
  filename: string,
  groupByCol?: string,
  paperSize: string = 'A4',
  orientation: 'portrait' | 'landscape' = 'landscape'
) => {
  // Map paper size to jsPDF format
  let format: string | [number, number] = 'a4';
  const sizeUpper = paperSize.toUpperCase();
  if (sizeUpper === 'LETTER') {
    format = 'letter';
  } else if (sizeUpper === 'LEGAL') {
    format = 'legal';
  } else if (sizeUpper === 'F4') {
    format = [215.9, 330]; // F4 / Folio size in mm
  }

  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: format
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const limitY = pageHeight - 35; // Dynamically calculated limit for new group table

  if (groupByCol) {
    const groups: Record<string, DataRow[]> = {};
    data.forEach(row => {
      const val = String(row[groupByCol] === undefined || row[groupByCol] === null || row[groupByCol] === '' ? '(Tanpa Kategori)' : row[groupByCol]);
      if (!groups[val]) {
        groups[val] = [];
      }
      groups[val].push(row);
    });

    let first = true;
    Object.entries(groups).forEach(([groupName, groupRows]) => {
      let startY = 20;
      if (!first) {
        if ((doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY) {
          const lastY = (doc as any).lastAutoTable.finalY;
          if (lastY > limitY) {
            doc.addPage();
            startY = 20;
          } else {
            startY = lastY + 12;
          }
        } else {
          startY = 20;
        }
      }
      first = false;

      // Group label title
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text(`${groupByCol}: ${groupName} (${groupRows.length} baris)`, 14, startY);

      autoTable(doc, {
        startY: startY + 5,
        head: [headers],
        body: groupRows.map(row => headers.map(header => row[header] || '')),
        theme: 'grid',
        styles: { 
          fontSize: 8, 
          cellPadding: 2.5, 
          valign: 'middle',
          textColor: [51, 65, 85], // Slate-700
          lineColor: [226, 232, 240], // Slate-200 lines
          lineWidth: 0.15,
        },
        headStyles: { 
          fillColor: [37, 99, 235], // Royal Blue-600
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          lineColor: [37, 99, 235],
          lineWidth: 0.15
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate-50 alternating rows
        },
        margin: { top: 15, left: 14, right: 14 },
      });
    });
  } else {
    autoTable(doc, {
      head: [headers],
      body: data.map(row => headers.map(header => row[header] || '')),
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 2.5, 
        valign: 'middle',
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: { 
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        lineColor: [37, 99, 235],
        lineWidth: 0.15
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 15, left: 14, right: 14 },
    });
  }

  // Add page numbers at the bottom right corner of each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate-500
    const text = `Halaman ${i} dari ${pageCount}`;
    const textWidth = doc.getTextWidth(text);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.text(text, pw - textWidth - 14, ph - 10);
  }

  doc.save(filename);
};

export const printData = (
  data: DataRow[],
  headers: string[],
  groupByCol?: string,
  paperSize: string = 'A4',
  orientation: 'portrait' | 'landscape' = 'landscape'
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups for printing");
    return;
  }

  let tablesHtml = '';

  if (groupByCol) {
    const groups: Record<string, DataRow[]> = {};
    data.forEach(row => {
      const val = String(row[groupByCol] === undefined || row[groupByCol] === null || row[groupByCol] === '' ? '(Tanpa Kategori)' : row[groupByCol]);
      if (!groups[val]) {
        groups[val] = [];
      }
      groups[val].push(row);
    });

    Object.entries(groups).forEach(([groupName, groupRows]) => {
      tablesHtml += `
        <div class="group-container">
          <h3 class="group-title">
            <span>${groupByCol}: <strong style="color: #0f172a;">${groupName}</strong></span>
            <span class="row-count">(${groupRows.length} baris)</span>
          </h3>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${groupRows.map(row => `
                <tr>
                  ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    });
  } else {
    tablesHtml = `
      <div class="group-container">
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Map CSS page size
  let cssPageSize = 'A4';
  const sizeUpper = paperSize.toUpperCase();
  if (sizeUpper === 'LETTER') {
    cssPageSize = 'letter';
  } else if (sizeUpper === 'LEGAL') {
    cssPageSize = 'legal';
  } else if (sizeUpper === 'F4') {
    cssPageSize = '215.9mm 330mm'; // Standard F4 dimensions
  }
  
  const html = `
    <html>
      <head>
        <title>Print Data</title>
        <style>
          @page {
            size: ${cssPageSize} ${orientation};
            margin: 15mm 12mm 15mm 12mm;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            color: #1e293b; 
            padding: 10px; 
            background: #ffffff;
            counter-reset: page;
          }
          .report-header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .print-footer {
            display: none;
          }
          @media print {
            .print-footer {
              display: block;
              position: fixed;
              bottom: 0;
              right: 0;
              font-size: 10px;
              color: #64748b;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-weight: 500;
              background: transparent;
            }
            .print-footer::after {
              counter-increment: page;
              content: "Halaman " counter(page);
            }
          }
          h2 { 
            margin: 0 0 4px 0; 
            font-weight: 800; 
            color: #0f172a; 
            font-size: 18px;
            letter-spacing: -0.02em;
          }
          .meta { 
            margin: 0; 
            font-size: 11px; 
            color: #64748b; 
          }
          .group-container {
            margin-bottom: 24px; 
            page-break-inside: avoid;
          }
          .group-title { 
            font-size: 12px; 
            font-weight: 600; 
            margin-top: 16px; 
            margin-bottom: 8px; 
            color: #2563eb; 
            border-left: 3px solid #2563eb; 
            padding-left: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .row-count { 
            font-size: 10px; 
            font-weight: normal; 
            color: #64748b; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 10px; 
            border: 1px solid #cbd5e1;
            margin-top: 4px;
          }
          th, td { 
            border: 1px solid #cbd5e1; 
            padding: 6px 8px; 
            text-align: left; 
          }
          th { 
            background-color: #2563eb; 
            color: #ffffff; 
            font-weight: 700; 
            text-transform: uppercase; 
            letter-spacing: 0.03em; 
            font-size: 9px; 
          }
          tr:nth-child(even) { 
            background-color: #f8fafc; 
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h2>Merged Master Data Report</h2>
          <p class="meta">Diprint pada ${new Date().toLocaleString()}</p>
        </div>
        ${tablesHtml}
        <div class="print-footer"></div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
