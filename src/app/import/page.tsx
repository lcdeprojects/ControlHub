'use client';

import React, { useState } from 'react';
import { FileUploadZone } from '@/components/import/FileUploadZone';
import { ImportPreviewTable } from '@/components/import/ImportPreviewTable';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { ImportParsedRow } from '@/lib/types';
import { FileSpreadsheet, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, UploadCloud, RefreshCw } from 'lucide-react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetType, setTargetType] = useState<'CARD' | 'ACCOUNT'>('CARD');
  const [targetCardId, setTargetCardId] = useState('card_master_black');
  const [targetAccountId, setTargetAccountId] = useState('acc_nubank');
  const [parsedRows, setParsedRows] = useState<ImportParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState<any>(null);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setLoading(true);
    setImportSuccess(null);

    const formData = new FormData();
    formData.append('file', selected);
    if (targetType === 'CARD') {
      formData.append('targetCardId', targetCardId);
    } else {
      formData.append('targetAccountId', targetAccountId);
    }

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setParsedRows(data.rows);
      }
    } catch (err) {
      console.error('Import parse error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedRows,
          targetCardId: targetType === 'CARD' ? targetCardId : undefined,
          targetAccountId: targetType === 'ACCOUNT' ? targetAccountId : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImportSuccess(data);
        setParsedRows([]);
        setFile(null);
      }
    } catch (err) {
      console.error('Confirm error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simular arquivo de teste para demonstração rápida sem precisar de upload
  const handleLoadDemoSpreadsheet = () => {
    const demoRows: ImportParsedRow[] = [
      {
        date: '2026-08-02',
        description: 'APPLE STORE 02/10',
        amount: 500.0,
        type: 'CREDIT',
        normalizedDescription: 'APPLE STORE',
        merchantName: 'APPLE STORE',
        currentInstallment: 2,
        totalInstallments: 10,
        isInstallment: true,
        fingerprint: 'fp_demo_apple_2',
        matchScore: {
          score: 100,
          details: { cardMatch: 30, merchantMatch: 30, amountMatch: 20, installmentSequenceMatch: 20 },
          action: 'AUTO_LINK',
          reason: 'Score 100/100 — Vinculação automática com "APPLE STORE" (2/10)',
        },
        isDuplicate: false,
      },
      {
        date: '2026-08-04',
        description: 'SUPERMERCADO CONDOR',
        amount: 450.25,
        type: 'CREDIT',
        normalizedDescription: 'SUPERMERCADO CONDOR',
        merchantName: 'SUPERMERCADO CONDOR',
        isInstallment: false,
        fingerprint: 'fp_demo_condor',
        isDuplicate: false,
      },
      {
        date: '2026-08-06',
        description: 'UBER *VIAGEM',
        amount: 34.9,
        type: 'CREDIT',
        normalizedDescription: 'VIAGEM',
        merchantName: 'VIAGEM',
        isInstallment: false,
        fingerprint: 'fp_demo_uber',
        isDuplicate: false,
      },
      {
        date: '2026-08-08',
        description: 'NETFLIX 4K PREMIUM',
        amount: 59.9,
        type: 'CREDIT',
        normalizedDescription: 'NETFLIX',
        merchantName: 'NETFLIX',
        isInstallment: false,
        fingerprint: 'fp_demo_netflix_dup',
        isDuplicate: true, // Teste do motor anti-duplicidade
      },
      {
        date: '2026-08-10',
        description: 'MAGAZINE LUIZA 04/10',
        amount: 299.9,
        type: 'CREDIT',
        normalizedDescription: 'MAGAZINE LUIZA',
        merchantName: 'MAGAZINE LUIZA',
        currentInstallment: 4,
        totalInstallments: 10,
        isInstallment: true,
        fingerprint: 'fp_demo_magalu',
        matchScore: {
          score: 75,
          details: { cardMatch: 30, merchantMatch: 25, amountMatch: 20, installmentSequenceMatch: 0 },
          action: 'NEEDS_CONFIRMATION',
          reason: 'Score 75/100 — Possível parcela 4/10 de "MAGAZINE LUIZA". Requer confirmação.',
        },
        isDuplicate: false,
      },
    ];

    setFile(new File([''], 'fatura_agosto_nubank.xlsx'));
    setParsedRows(demoRows);
    setImportSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Importador Inteligente de Faturas & Extratos</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Suporte a planilhas XLS, XLSX e CSV com algoritmo anti-duplicidade e auto-matching de parcelas
          </p>
        </div>

        <button
          onClick={handleLoadDemoSpreadsheet}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Carregar Exemplo Pré-formatado</span>
        </button>
      </div>

      {/* Target Destination Selector */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300">Destino da Importação:</span>
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTargetType('CARD')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                targetType === 'CARD' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fatura de Cartão
            </button>
            <button
              onClick={() => setTargetType('ACCOUNT')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                targetType === 'ACCOUNT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Extrato de Conta Bancária
            </button>
          </div>
        </div>

        {targetType === 'CARD' ? (
          <select
            value={targetCardId}
            onChange={(e) => setTargetCardId(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="card_master_black">Mastercard Ultravioleta (Fecha dia 03 / Vence dia 10)</option>
            <option value="card_visa_infinite">Visa Infinite Itaú (Fecha dia 20 / Vence dia 28)</option>
          </select>
        ) : (
          <select
            value={targetAccountId}
            onChange={(e) => setTargetAccountId(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="acc_nubank">Conta Nubank</option>
            <option value="acc_itau">Itaú Uniclass</option>
          </select>
        )}
      </Card>

      {/* Upload Zone */}
      <FileUploadZone
        onFileSelect={handleFileSelect}
        selectedFile={file}
        loading={loading}
      />

      {/* Success Notification */}
      {importSuccess && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-base font-bold text-white">Importação Concluída com Sucesso!</h4>
              <p className="text-xs text-emerald-300 mt-0.5">
                {importSuccess.importedCount} novos registros inseridos com integridade contábil garantida.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {parsedRows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Prévia da Análise dos Lançamentos</h3>
            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <span>{loading ? 'Processando...' : 'Confirmar e Importar para o Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <ImportPreviewTable rows={parsedRows} />
        </div>
      )}
    </div>
  );
}
