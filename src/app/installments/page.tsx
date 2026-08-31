'use client';

import React, { useEffect, useState } from 'react';
import { InstallmentProgressBar, InstallmentProgressItem } from '@/components/installments/InstallmentProgressBar';
import { FutureCommitmentChart } from '@/components/installments/FutureCommitmentChart';
import { InstallmentDetailModal } from '@/components/installments/InstallmentDetailModal';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatMonthYear } from '@/lib/utils';
import { Layers, Plus } from 'lucide-react';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { usePeriod } from '@/contexts/PeriodContext';

export default function InstallmentsPage() {
  const { month, year } = usePeriod();
  const [purchases, setPurchases] = useState<InstallmentProgressItem[]>([]);
  const [futureProjection, setFutureProjection] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalOriginalAmount: 0,
    totalPaid: 0,
    totalCommitted: 0,
    monthlyInstallmentTotal: 0,
    activeCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/installments?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setPurchases(data.purchases);
        setFutureProjection(data.futureProjection);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching installments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, [month, year]);

  const handleDeleteDirect = async (id: string) => {
    if (!confirm('Deseja realmente remover este parcelamento e suas parcelas?')) return;

    try {
      const res = await fetch(`/api/installments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchInstallments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest">
              {formatMonthYear(month, year)}
            </span>
            <span className="text-xs text-slate-400">Projeção e Cronograma</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Compras Parceladas</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe o cronograma de faturas de cada compra, visualize o progresso e saiba quando sua renda será liberada
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Parcelamento</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">Originalmente Parcelado</span>
          <h3 className="text-2xl font-black text-white mt-2">
            {formatCurrency(stats.totalOriginalAmount)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Soma de todas as compras</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Já Pago</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">
            {formatCurrency(stats.totalPaid)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Parcelas já liquidadas</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">Ainda Comprometido</span>
          <h3 className="text-2xl font-black text-purple-400 mt-2">
            {formatCurrency(stats.totalCommitted)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Saldo devedor futuro</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Parcelas de {formatMonthYear(month, year)}
          </span>
          <h3 className="text-2xl font-black text-rose-400 mt-2">
            {formatCurrency(stats.monthlyInstallmentTotal)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{stats.activeCount} compras no sistema</p>
        </Card>
      </div>

      {/* Future Commitment Projection Chart */}
      <FutureCommitmentChart data={futureProjection} />

      {/* Progress Cards List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Progresso dos Parcelamentos Ativos</h3>
        {purchases.length === 0 ? (
          <Card className="py-8 text-center text-xs text-slate-500">
            Nenhum parcelamento ativo cadastrado.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchases.map((item) => (
              <InstallmentProgressBar
                key={item.id}
                item={item}
                onViewDetails={(id) => setSelectedPurchaseId(id)}
                onDelete={(id) => handleDeleteDirect(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Installment Detail Breakdown Modal */}
      {selectedPurchaseId && (
        <InstallmentDetailModal
          isOpen={!!selectedPurchaseId}
          onClose={() => setSelectedPurchaseId(null)}
          purchaseId={selectedPurchaseId}
          onDeleteSuccess={fetchInstallments}
        />
      )}

      {/* Quick Transaction / New Installment Modal */}
      <QuickActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchInstallments}
      />
    </div>
  );
}
