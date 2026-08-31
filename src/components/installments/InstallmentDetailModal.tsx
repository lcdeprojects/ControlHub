'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, getShortMonth } from '@/lib/utils';
import { Layers, CreditCard, Calendar, Trash2, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

interface InstallmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string;
  onDeleteSuccess?: () => void;
}

export function InstallmentDetailModal({
  isOpen,
  onClose,
  purchaseId,
  onDeleteSuccess,
}: InstallmentDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!purchaseId || !isOpen) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/installments/${purchaseId}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [purchaseId, isOpen]);

  const handleDelete = async () => {
    if (!confirm('Deseja realmente excluir este parcelamento e todas as suas parcelas vinculadas?')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/installments/${purchaseId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleteSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const purchase = data?.purchase;
  const installments = data?.installments || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={purchase?.description || 'Detalhes do Parcelamento'}
      description="Visão detalhada de todas as parcelas e cronograma de faturamento"
      maxWidth="max-w-2xl"
    >
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Carregando parcelas...</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Valor Total:</span>
              <p className="text-base font-black text-white mt-0.5">
                {formatCurrency(purchase?.totalAmount || 0)}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Parcelamento:</span>
              <p className="text-base font-bold text-purple-400 mt-0.5">
                {purchase?.installmentCount}x de {formatCurrency(purchase?.installmentValue || 0)}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Cartão:</span>
              <p className="text-sm font-bold text-slate-200 mt-0.5 truncate">
                {purchase?.cardName || 'Mastercard'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Data da Compra:</span>
              <p className="text-sm font-bold text-slate-200 mt-0.5">
                {formatDate(purchase?.purchaseDate)}
              </p>
            </div>
          </div>

          {/* Installments Table */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Cronograma de Faturas ({installments.length} Parcelas)</span>
              </h4>
            </div>

            <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5">
              {installments.map((inst: any) => {
                const isPaid = inst.status === 'PAID';
                const isBilled = inst.status === 'BILLED';

                return (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 font-mono font-bold text-[11px]">
                        {inst.installmentNumber}/{inst.totalInstallments}
                      </span>
                      <span className="text-slate-300 font-medium">
                        Fatura de {getShortMonth(inst.billingMonth)}/{inst.billingYear}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-slate-100">
                        {formatCurrency(inst.amount)}
                      </span>
                      {isPaid ? (
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3" /> Paga
                        </Badge>
                      ) : isBilled ? (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3" /> Faturada
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          <Clock className="w-3 h-3 text-slate-500" /> Pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Excluindo...' : 'Excluir Parcelamento'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
