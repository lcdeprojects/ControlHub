'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  loading?: boolean;
}

export function FileUploadZone({ onFileSelect, selectedFile, loading }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-8 text-center ${
        isDragOver
          ? 'border-blue-500 bg-blue-500/10'
          : selectedFile
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${
          selectedFile
            ? 'bg-emerald-500/20 text-emerald-400 scale-105'
            : 'bg-blue-500/10 text-blue-400'
        }`}
      >
        {selectedFile ? (
          <CheckCircle2 className="w-8 h-8" />
        ) : (
          <UploadCloud className="w-8 h-8" />
        )}
      </div>

      {selectedFile ? (
        <div>
          <h4 className="text-base font-bold text-white flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            {selectedFile.name}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {(selectedFile.size / 1024).toFixed(1)} KB • Clique ou arraste para substituir
          </p>
        </div>
      ) : (
        <div>
          <h4 className="text-base font-bold text-white">
            Selecione ou arraste seu extrato ou fatura
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Formatos suportados: <strong>XLSX, XLS ou CSV</strong>
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-500 font-medium">
            <span>Nubank</span> • <span>Itaú</span> • <span>Bradesco</span> • <span>Santander</span> • <span>Inter</span> • <span>C6</span> • <span>BTG</span>
          </div>
        </div>
      )}
    </Card>
  );
}
