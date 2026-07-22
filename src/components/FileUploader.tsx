import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { UploadedFile } from '../types';
import { parseExcelFile } from '../utils/dataProcessor';

interface FileUploaderProps {
  onUpload: (files: UploadedFile[]) => void;
  existingFiles: UploadedFile[];
  onRemoveFile: (index: number) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, existingFiles, onRemoveFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const processFiles = async (files: FileList | File[]) => {
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
          throw new Error(`File ${file.name} is not a valid Excel or CSV file.`);
        }
      }
      onUpload(parsedFiles);
    } catch (err: any) {
      setError(err.message || "An error occurred while processing files.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [onUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Upload Data</h2>
        <p className="text-xs text-slate-500 mt-1">Upload multiple Excel (.xlsx, .xls) or CSV files to merge them automatically.</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-400 bg-slate-50 cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex justify-center mb-3 text-blue-500">
          <Upload size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Drag and drop files here</h3>
        <p className="text-xs text-slate-500 mb-4">or click to browse your computer</p>
        
        <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-semibold cursor-pointer transition-colors inline-block">
          Select Files
          <input
            type="file"
            multiple
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleChange}
            disabled={isProcessing}
          />
        </label>
        
        {isProcessing && (
          <p className="mt-4 text-blue-600 text-xs font-bold animate-pulse">Processing files...</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 flex items-start gap-2">
          <AlertCircle className="shrink-0 mt-0.5" size={16} />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Uploaded Files ({existingFiles.length})</label>
          <div className="space-y-1">
            {existingFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded border border-slate-100 bg-white">
                <div className="flex items-center space-x-2 overflow-hidden">
                  <div className="text-blue-600">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium truncate text-slate-700 block">{file.name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-[10px] text-slate-400">{file.data.length} rows</span>
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                    title="Remove file"
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
