import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, PlusCircle, RefreshCw, Trash2, Check } from 'lucide-react';
import { UploadedFile } from '../types';
import { parseExcelFile } from '../utils/dataProcessor';

interface FileUploaderProps {
  onUpload: (files: UploadedFile[], mode: 'replace' | 'append') => void;
  existingFiles: UploadedFile[];
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUpload, 
  existingFiles, 
  onRemoveFile,
  onClearAll
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const processFiles = async (files: FileList | File[], mode: 'replace' | 'append') => {
    setIsProcessing(true);
    setError(null);
    try {
      const parsedFiles: UploadedFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
          const parsed = await parseExcelFile(file);
          parsedFiles.push(parsed);
        } else {
          throw new Error(`File "${file.name}" bukan file Excel (.xlsx, .xls) atau CSV yang valid.`);
        }
      }
      onUpload(parsedFiles, mode);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses file Excel.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, uploadMode);
    }
  }, [onUpload, uploadMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, uploadMode);
    }
  };

  const triggerFileInput = (mode: 'append' | 'replace') => {
    setUploadMode(mode);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Upload & Kelola Data Excel</h2>
          <p className="text-xs text-slate-500 mt-0.5">Upload file Excel (.xlsx, .xls) atau CSV. Anda dapat mengganti seluruh data atau menambah data baru.</p>
        </div>

        {existingFiles.length > 0 && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => triggerFileInput('append')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center transition-colors shadow-sm"
            >
              <PlusCircle size={14} className="mr-1.5" />
              Tambah Data Excel
            </button>
            <button
              onClick={() => triggerFileInput('replace')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold flex items-center transition-colors shadow-sm"
            >
              <RefreshCw size={14} className="mr-1.5" />
              Ganti Semua Data
            </button>
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded text-xs font-semibold flex items-center transition-colors"
              title="Hapus Semua File"
            >
              <Trash2 size={14} className="mr-1.5" />
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="text-xs">
          <span className="font-bold text-slate-700 block sm:inline">Opsi Pengunggah:</span>{' '}
          <span className="text-slate-500">
            {uploadMode === 'append' 
              ? 'Data baru akan ditambahkan (digabung) dengan data yang sudah ada.' 
              : 'Data lama akan dihapus dan digantikan seluruhnya dengan file Excel baru.'}
          </span>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setUploadMode('append')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              uploadMode === 'append'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle size={14} className={uploadMode === 'append' ? 'text-blue-600' : ''} />
            Tambah Data (Append)
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('replace')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              uploadMode === 'replace'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw size={14} className={uploadMode === 'replace' ? 'text-amber-600' : ''} />
            Ganti Data (Replace)
          </button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all relative overflow-hidden
          ${uploadMode === 'replace' 
            ? (isDragging ? 'border-amber-400 bg-amber-50/70' : 'border-amber-200 hover:border-amber-400 bg-amber-50/20')
            : (isDragging ? 'border-blue-400 bg-blue-50/70' : 'border-slate-200 hover:border-blue-400 bg-slate-50/50')}
          cursor-pointer`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex justify-center mb-3">
          {uploadMode === 'replace' ? (
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
              <RefreshCw size={28} strokeWidth={1.75} />
            </div>
          ) : (
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Upload size={28} strokeWidth={1.75} />
            </div>
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-800 mb-1">
          {uploadMode === 'replace' 
            ? 'Drag & drop file Excel untuk MENGGANTI data saat ini' 
            : 'Drag & drop file Excel untuk MENAMBAH data'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">Format yang didukung: .xlsx, .xls, atau .csv</p>
        
        <div className="flex items-center justify-center gap-3">
          <label className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm inline-flex items-center gap-2 text-white ${
            uploadMode === 'replace' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}>
            {uploadMode === 'replace' ? <RefreshCw size={14} /> : <PlusCircle size={14} />}
            Pilih File Excel ({uploadMode === 'replace' ? 'Mode Ganti' : 'Mode Tambah'})
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleChange}
              disabled={isProcessing}
            />
          </label>
        </div>
        
        {isProcessing && (
          <div className="mt-4 flex items-center justify-center gap-2 text-blue-600 text-xs font-bold animate-pulse">
            <RefreshCw size={14} className="animate-spin" /> Memproses file Excel...
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-start gap-2 shadow-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={16} />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Existing Files List */}
      {existingFiles.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-slate-400" />
              File Terpasang ({existingFiles.length})
            </label>
            <button
              onClick={onClearAll}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
            >
              <Trash2 size={12} /> Hapus Semua
            </button>
          </div>
          <div className="space-y-2">
            {existingFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:border-slate-300 rounded-lg border border-slate-200 bg-white shadow-sm transition-all">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold truncate text-slate-800 block">{file.name}</span>
                    <span className="text-[10px] text-slate-500 block">{file.headers.length} Kolom Header • {file.data.length} Baris</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                    {file.data.length} baris
                  </span>
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                    title="Hapus file ini"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

