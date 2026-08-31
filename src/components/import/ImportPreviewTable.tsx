'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ImportParsedRow } from '@/lib/types';
import { CheckCircle2, Copy, Layers, HelpCircle } from 'lucide-react';

interface ImportPreviewTableProps {
  rows: ImportParsedRow[];
  onConfirmMatch?: (row: ImportParsedRow) => void;
  onRejectMatch?: (row: ImportParsedRow) => void;
}

export function ImportPreviewTable({ rows }: ImportPreviewTableProps) {
  const totalCount = rows.length;
  const newCount = rows.filter((r) => !r.isDuplicate && (!r.matchScore || r.matchScore.action !== 'NEEDS_CONFIRMATION')).length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;
  const autoLinkedCount = rows.filter((r) => r.matchScore?.action === 'AUTO_LINK').length;
  const pendingCount = rows.filter((r) => r.matchScore?.action === 'NEEDS_CONFIRMATION').length;

  return (
    <div className="space-y-6">
      {/* Counters Header (Requisito 50) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Analisadas</span>
          <p className="text-xl font-bold text-white mt-0.5">{totalCount}</p>
        </div>
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <span className="text-[10px] text-emerald-300 font-semibold uppercase">Novas Transações</span>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">{newCount}</p>
        </div>
        <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Já Existentes</span>
          <p className="text-xl font-bold text-slate-400 mt-0.5">{duplicateCount}</p>
        </div>
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <span className="text-[10px] text-purple-300 font-semibold uppercase">Parcelas Auto</span>
          <p className="text-xl font-bold text-purple-400 mt-0.5">{autoLinkedCount}</p>
        </div>
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <span className="text-[10px] text-amber-300 font-semibold uppercase">Confirmar Match</span>
          <p className="text-xl font-bold text-amber-400 mt-0.5">{pendingCount}</p>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição no Extrato</th>
                <th className="py-3 px-4">Merchant Normalizado</th>
                <th className="py-3 px-4">Parcela</th>
                <th className="py-3 px-4 text-right">Valor (R$)</th>
                <th className="py-3 px-4 text-center">Status / Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    row.isDuplicate ? 'opacity-40 bg-slate-950/40' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono text-slate-300">{formatDate(row.date)}</td>
                  <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                    {row.description}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-semibold">
                    {row.normalizedDescription}
                  </td>
                  <td className="py-3 px-4">
                    {row.isInstallment ? (
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold font-mono">
                        {row.currentInstallment}/{row.totalInstallments}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">À vista</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-100 font-mono">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.isDuplicate ? (
                      <Badge variant="default">
                        <Copy className="w-3 h-3" /> Duplicata Ignorada
                      </Badge>
                    ) : row.matchScore?.action === 'AUTO_LINK' ? (
                      <Badge variant="purple">
                        <Layers className="w-3 h-3" /> Parcela Vinculada ({row.matchScore.score} pts)
                      </Badge>
                    ) : row.matchScore?.action === 'NEEDS_CONFIRMATION' ? (
                      <Badge variant="warning">
                        <HelpCircle className="w-3 h-3" /> Confirmar Match ({row.matchScore.score} pts)
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3" /> Novo Lançamento
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
