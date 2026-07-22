import React, { useState, useMemo } from 'react';
import { UploadedFile, DataRow } from './types';
import { mergeData } from './utils/dataProcessor';
import { FileUploader } from './components/FileUploader';
import { DataTable } from './components/DataTable';
import { Dashboard } from './components/Dashboard';
import { LayoutDashboard, Table, UploadCloud, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'table' | 'dashboard'>('upload');

  const { mergedData, allHeaders } = useMemo(() => {
    return mergeData(files);
  }, [files]);

  const handleFilesUploaded = (newFiles: UploadedFile[], mode: 'replace' | 'append' = 'append') => {
    if (mode === 'replace') {
      setFiles(newFiles);
    } else {
      setFiles(prev => [...prev, ...newFiles]);
    }
    setActiveTab('table');
  };

  const handleAppendFiles = (newFiles: UploadedFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleReplaceFiles = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
            XL
          </div>
          <span className="font-bold text-slate-800 tracking-tight">XLSX Merged Pro</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors text-xs font-semibold ${activeTab === 'upload' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <UploadCloud size={16} />
            Kelola & Upload
          </button>
          
          <button
            onClick={() => setActiveTab('table')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors text-xs font-semibold ${activeTab === 'table' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
            disabled={files.length === 0}
          >
            <Table size={16} />
            Tabel Data
            {files.length > 0 && (
              <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                {files.length} FILE
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors text-xs font-semibold ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
            disabled={files.length === 0}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'upload' && (
          <div className="p-6 h-full overflow-auto">
            <FileUploader 
              onUpload={handleFilesUploaded} 
              existingFiles={files} 
              onRemoveFile={(index) => setFiles(f => f.filter((_, i) => i !== index))}
              onClearAll={handleClearAll}
            />
          </div>
        )}
        
        {activeTab === 'table' && (
          <div className="flex-1 overflow-hidden flex flex-col bg-white">
            <DataTable 
              data={mergedData} 
              initialHeaders={allHeaders}
              onAddFiles={handleAppendFiles}
              onReplaceFiles={handleReplaceFiles}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          </div>
        )}
        
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-auto bg-slate-50">
            <Dashboard data={mergedData} headers={allHeaders} />
          </div>
        )}
      </main>
    </div>
  );
}
