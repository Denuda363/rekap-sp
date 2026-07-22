import * as XLSX from 'xlsx';
import { DataRow, UploadedFile } from '../types';

export const parseExcelFile = async (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Ensure raw string output for headers if possible, though json gets it by default
        const jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: '' });
        
        // Extract headers from the first row or sheet
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

        resolve({
          name: file.name,
          data: jsonData,
          headers,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const mergeData = (files: UploadedFile[]): { mergedData: DataRow[], allHeaders: string[] } => {
  const mergedData: DataRow[] = [];
  const headerSet = new Set<string>();

  files.forEach(file => {
    file.headers.forEach(header => headerSet.add(header));
    mergedData.push(...file.data);
  });

  return {
    mergedData,
    allHeaders: Array.from(headerSet),
  };
};

export const exportToExcel = (data: DataRow[], headers: string[], filename: string, groupByCol?: string) => {
  const sheetRows: any[][] = [];

  if (groupByCol) {
    const groups: Record<string, DataRow[]> = {};
    data.forEach(row => {
      const val = String(row[groupByCol] === undefined || row[groupByCol] === null || row[groupByCol] === '' ? '(Tanpa Kategori)' : row[groupByCol]);
      if (!groups[val]) {
        groups[val] = [];
      }
      groups[val].push(row);
    });

    Object.entries(groups).forEach(([groupName, groupRows], index) => {
      // Add empty space before subsequent groups for clean structure
      if (index > 0) {
        sheetRows.push([]);
      }

      // Add a special group label row
      const labelRow = Array(headers.length).fill('');
      labelRow[0] = `[Grup] ${groupByCol}: ${groupName} (${groupRows.length} baris)`;
      sheetRows.push(labelRow);

      // Add headers for this group
      sheetRows.push(headers);

      // Add actual data rows
      groupRows.forEach(row => {
        sheetRows.push(headers.map(h => row[h] === undefined ? '' : row[h]));
      });
    });
  } else {
    sheetRows.push(headers);
    data.forEach(row => {
      sheetRows.push(headers.map(h => row[h] === undefined ? '' : row[h]));
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);

  // Auto-fit columns to prevent truncation or ### error in Excel
  const colWidths = headers.map((header, colIndex) => {
    let maxLen = header.length;
    sheetRows.forEach(row => {
      if (row && row[colIndex] !== undefined && row[colIndex] !== null) {
        // Avoid calculating based on group label rows that span everything
        const isGroupLabelRow = String(row[0]).startsWith('[Grup]');
        if (!isGroupLabelRow) {
          const valStr = String(row[colIndex]);
          if (valStr.length > maxLen) {
            maxLen = valStr.length;
          }
        }
      }
    });
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Merged Data");
  XLSX.writeFile(workbook, filename);
};

export const exportToCSV = (data: DataRow[], headers: string[], filename: string, groupByCol?: string) => {
  const sheetRows: any[][] = [];

  if (groupByCol) {
    const groups: Record<string, DataRow[]> = {};
    data.forEach(row => {
      const val = String(row[groupByCol] === undefined || row[groupByCol] === null || row[groupByCol] === '' ? '(Tanpa Kategori)' : row[groupByCol]);
      if (!groups[val]) {
        groups[val] = [];
      }
      groups[val].push(row);
    });

    Object.entries(groups).forEach(([groupName, groupRows], index) => {
      if (index > 0) {
        sheetRows.push([]);
      }

      const labelRow = Array(headers.length).fill('');
      labelRow[0] = `[Grup] ${groupByCol}: ${groupName} (${groupRows.length} baris)`;
      sheetRows.push(labelRow);

      // Add headers for this group
      sheetRows.push(headers);

      groupRows.forEach(row => {
        sheetRows.push(headers.map(h => row[h] === undefined ? '' : row[h]));
      });
    });
  } else {
    sheetRows.push(headers);
    data.forEach(row => {
      sheetRows.push(headers.map(h => row[h] === undefined ? '' : row[h]));
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  
  // Set column widths for CSV template as well
  const colWidths = headers.map((header, colIndex) => {
    let maxLen = header.length;
    sheetRows.forEach(row => {
      if (row && row[colIndex] !== undefined && row[colIndex] !== null) {
        const isGroupLabelRow = String(row[0]).startsWith('[Grup]');
        if (!isGroupLabelRow) {
          const valStr = String(row[colIndex]);
          if (valStr.length > maxLen) {
            maxLen = valStr.length;
          }
        }
      }
    });
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
  });
  worksheet['!cols'] = colWidths;

  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
