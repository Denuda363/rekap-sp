import React, { useState, useMemo, useRef } from 'react';
import { DataRow, UploadedFile } from '../types';
import { Download, FileText, Printer, Plus, Filter, ChevronDown, ChevronUp, Search, Settings, Trash2, PlusCircle, RefreshCw } from 'lucide-react';
import { exportToExcel, exportToCSV, parseExcelFile } from '../utils/dataProcessor';
import { exportToPDF, printData } from '../utils/pdfProcessor';

interface DataTableProps {
  data: DataRow[];
  initialHeaders: string[];
  onAddFiles?: (files: UploadedFile[]) => void;
  onReplaceFiles?: (files: UploadedFile[]) => void;
  onNavigateToUpload?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  data: initialData, 
  initialHeaders,
  onAddFiles,
  onReplaceFiles,
  onNavigateToUpload
}) => {
  const [data, setData] = useState<DataRow[]>(initialData);
  const [headers, setHeaders] = useState<string[]>(initialHeaders);
  const [excludedHeaders, setExcludedHeaders] = useState<Record<string, boolean>>({});
  const [showColMenu, setShowColMenu] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [newColName, setNewColName] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [groupByCol, setGroupByCol] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [paperSize, setPaperSize] = useState<string>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const appendInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleQuickFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'append' | 'replace') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsProcessingFile(true);
    try {
      const parsedFiles: UploadedFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const parsed = await parseExcelFile(file);
        parsedFiles.push(parsed);
      }
      if (mode === 'append' && onAddFiles) {
        onAddFiles(parsedFiles);
      } else if (mode === 'replace' && onReplaceFiles) {
        onReplaceFiles(parsedFiles);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal membaca file Excel');
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Update state when props change
  React.useEffect(() => {
    setData(initialData);
    setHeaders(initialHeaders);
    setFilters({});
    setGroupByCol('');
    setCollapsedGroups({});
    setExcludedHeaders({});
    setShowColMenu(false);
    setPaperSize('A4');
    setOrientation('landscape');
  }, [initialData, initialHeaders]);

  const activeHeaders = useMemo(() => {
    return headers.filter(h => !excludedHeaders[h]);
  }, [headers, excludedHeaders]);

  const handleFilterChange = (header: string, value: string) => {
    setFilters(prev => ({ ...prev, [header]: value }));
  };

  const handleAddColumn = () => {
    if (newColName && !headers.includes(newColName)) {
      setHeaders(prev => [...prev, newColName]);
      setData(prev => prev.map(row => ({ ...row, [newColName]: '' })));
      setNewColName('');
      setIsAddingCol(false);
    }
  };

  const handleDeleteColumn = (headerName: string) => {
    setHeaders(prev => prev.filter(h => h !== headerName));
    setData(prev => prev.map(row => {
      const copy = { ...row };
      delete copy[headerName];
      return copy;
    }));
    setFilters(prev => {
      const copy = { ...prev };
      delete copy[headerName];
      return copy;
    });
    if (groupByCol === headerName) {
      setGroupByCol('');
    }
  };

  const handleCellChange = (rowIndex: number, header: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [header]: value };
    setData(newData);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let processed = [...data];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        processed = processed.filter(row => 
          String(row[key] || '').toLowerCase().includes((value as string).toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig) {
      processed.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        
        // Basic numeric sort if both are numbers
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processed;
  }, [data, filters, sortConfig]);

  const groupedData = useMemo(() => {
    if (!groupByCol) return null;
    const groups: Record<string, DataRow[]> = {};
    filteredAndSortedData.forEach(row => {
      const val = String(row[groupByCol] === undefined || row[groupByCol] === null || row[groupByCol] === '' ? '(Tanpa Kategori)' : row[groupByCol]);
      if (!groups[val]) {
        groups[val] = [];
      }
      groups[val].push(row);
    });
    return groups;
  }, [filteredAndSortedData, groupByCol]);

  if (headers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
          <Filter size={24} />
        </div>
        <h2 className="text-sm font-bold text-slate-800 mb-1">Belum Ada Data</h2>
        <p className="text-xs text-slate-500 max-w-md mb-4">Silakan upload file Excel atau CSV terlebih dahulu untuk melihat dan mengelola data Anda.</p>
        {onNavigateToUpload && (
          <button
            onClick={onNavigateToUpload}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <PlusCircle size={14} /> Upload File Excel Sekarang
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Hidden File Inputs for Quick Upload */}
      <input
        ref={appendInputRef}
        type="file"
        multiple
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={(e) => handleQuickFileSelect(e, 'append')}
      />
      <input
        ref={replaceInputRef}
        type="file"
        multiple
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={(e) => handleQuickFileSelect(e, 'replace')}
      />

      {/* Header / Actions */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-none">
        <div className="flex items-center space-x-4">
          <nav className="text-xs text-slate-400 font-medium space-x-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Merged_Master_Data</span>
          </nav>
        </div>
        <div className="flex items-center space-x-2">
          {/* Quick Excel Action Buttons */}
          <div className="flex items-center space-x-1.5 mr-2 pr-2 border-r border-slate-200">
            <button
              onClick={() => appendInputRef.current?.click()}
              disabled={isProcessingFile}
              className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold flex items-center transition-colors shadow-xs"
              title="Tambah data dari file Excel lain (gabung)"
            >
              <PlusCircle size={14} className="mr-1.5 text-blue-600" />
              Tambah Excel
            </button>
            <button
              onClick={() => replaceInputRef.current?.click()}
              disabled={isProcessingFile}
              className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded text-xs font-semibold flex items-center transition-colors shadow-xs"
              title="Ganti seluruh data dengan file Excel baru"
            >
              <RefreshCw size={14} className={`mr-1.5 text-amber-600 ${isProcessingFile ? 'animate-spin' : ''}`} />
              Ganti Excel
            </button>
          </div>

          {/* Paper Settings */}
          <div className="flex items-center space-x-1.5 mr-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kertas:</span>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="A4">A4</option>
              <option value="F4">F4 / Folio</option>
              <option value="LETTER">Letter</option>
              <option value="LEGAL">Legal</option>
            </select>
            <div className="h-4 w-px bg-slate-200 mx-1.5" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Layout:</span>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
          </div>

          <button 
            onClick={() => printData(filteredAndSortedData, activeHeaders, groupByCol, paperSize, orientation)}
            className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50 flex items-center"
          >
            <Printer size={14} className="mr-1.5 text-slate-500" /> Print
          </button>
          <button 
            onClick={() => exportToPDF(filteredAndSortedData, activeHeaders, 'merged_data.pdf', groupByCol, paperSize, orientation)}
            className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50 flex items-center"
          >
            <FileText size={14} className="mr-1.5 text-slate-500" /> PDF
          </button>
          <button 
            onClick={() => exportToCSV(filteredAndSortedData, activeHeaders, 'merged_data.csv', groupByCol)}
            className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50 flex items-center text-slate-700"
          >
            <Download size={14} className="mr-1.5 text-slate-500" /> CSV
          </button>
          <button 
            onClick={() => exportToExcel(filteredAndSortedData, activeHeaders, 'merged_data.xlsx', groupByCol)}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 flex items-center shadow-sm"
          >
            <Download size={14} className="mr-1.5" /> Export XLSX
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <section className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between flex-none">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Search size={14} />
            <span className="font-semibold">Quick Filters</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Group By:</span>
            <select
              value={groupByCol}
              onChange={(e) => setGroupByCol(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="">None (Tidak Dikelompokkan)</option>
              {activeHeaders.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Kelola Kolom Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className={`px-3 py-1.5 border rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showColMenu 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Settings size={14} />
              <span>Kelola Kolom</span>
            </button>
            {showColMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-30 p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-xs font-bold text-slate-800">Tampilkan / Hapus Kolom</h4>
                  <span className="text-[10px] text-slate-400 font-medium">({activeHeaders.length} aktif)</span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {headers.map(h => (
                    <div key={h} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-slate-50 group">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={!excludedHeaders[h]}
                          onChange={() => setExcludedHeaders(prev => ({ ...prev, [h]: !prev[h] }))}
                          className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="truncate text-slate-700 font-medium" title={h}>{h}</span>
                      </label>
                      <button
                        onClick={() => handleDeleteColumn(h)}
                        className="text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                        title="Hapus Kolom Permanen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {isAddingCol ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                placeholder="Nama kolom baru"
                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 text-slate-700"
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                autoFocus
              />
              <button
                onClick={handleAddColumn}
                className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => setIsAddingCol(false)}
                className="text-slate-500 hover:text-slate-700 px-2 py-1 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCol(true)}
              className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded text-xs font-semibold hover:bg-blue-50 flex items-center"
            >
              <Plus size={14} className="mr-1" /> Add Custom Column
            </button>
          )}
        </div>
      </section>

      {/* Data Grid */}
      <section className="flex-1 bg-white overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-12 border-r border-slate-200 text-center">ID</th>
                {activeHeaders.map((header, idx) => (
                  <th key={idx} className="px-4 py-2 border-r border-slate-200 bg-slate-50 align-top min-w-[120px]">
                    <div className="flex flex-col gap-1.5">
                      <div 
                        className="flex items-center justify-between cursor-pointer group text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                        onClick={() => handleSort(header)}
                      >
                        <span className="truncate">{header}</span>
                        <div className="text-slate-300 group-hover:text-slate-500">
                          {sortConfig?.key === header ? (
                            sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                          ) : (
                            <ChevronDown size={12} className="opacity-0 group-hover:opacity-100" />
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Filter..."
                        className="w-full px-1.5 py-0.5 text-[10px] font-normal text-slate-700 bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                        value={filters[header] || ''}
                        onChange={e => handleFilterChange(header, e.target.value)}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupByCol && groupedData ? (
                Object.entries(groupedData).map(([groupName, groupRows]) => {
                  const isCollapsed = collapsedGroups[groupName];
                  return (
                    <React.Fragment key={groupName}>
                      {/* Collapsible Group Header Row */}
                      <tr 
                        className="bg-slate-50 hover:bg-slate-100/80 font-semibold text-xs text-slate-700 cursor-pointer select-none border-y border-slate-200"
                        onClick={() => setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}
                      >
                        <td colSpan={activeHeaders.length + 1} className="px-4 py-2 flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[10px]">
                            {isCollapsed ? '▶' : '▼'}
                          </span>
                          <span>{groupByCol}: <strong className="text-slate-900 font-bold">{groupName}</strong></span>
                          <span className="text-slate-400 text-[10px] font-normal">({(groupRows as any[]).length} baris)</span>
                        </td>
                      </tr>
                      {/* Group Rows */}
                      {!isCollapsed && (groupRows as any[]).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-slate-400 font-mono border-r border-slate-100 text-center">
                            #{rowIndex + 1}
                          </td>
                          {activeHeaders.map((header, colIndex) => (
                            <td key={colIndex} className="px-4 py-2.5 text-xs text-slate-600 border-r border-slate-100 relative group">
                              <input 
                                type="text"
                                value={row[header] || ''}
                                onChange={(e) => {
                                  const originalIndex = data.indexOf(row);
                                  if (originalIndex !== -1) {
                                    handleCellChange(originalIndex, header, e.target.value);
                                  }
                                }}
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white rounded px-1 py-0.5"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              ) : (
                filteredAndSortedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-slate-400 font-mono border-r border-slate-100 text-center">
                      #{rowIndex + 1}
                    </td>
                    {activeHeaders.map((header, colIndex) => (
                      <td key={colIndex} className="px-4 py-2.5 text-xs text-slate-600 border-r border-slate-100 relative group">
                        <input 
                          type="text"
                          value={row[header] || ''}
                          onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white rounded px-1 py-0.5"
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {filteredAndSortedData.length === 0 && (
                <tr>
                  <td colSpan={activeHeaders.length + 1} className="px-4 py-8 text-center text-xs text-slate-500">
                    No records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <footer className="mt-auto border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50 flex-none">
          <span className="text-xs text-slate-500">
            Showing {filteredAndSortedData.length} records
            {Object.keys(filters).length > 0 && Object.values(filters).some(Boolean) && (
              <span className="ml-1">(filtered from {data.length})</span>
            )}
          </span>
        </footer>
      </section>
    </div>
  );
};
