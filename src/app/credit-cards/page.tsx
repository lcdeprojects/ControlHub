'use client';

import React, { useEffect, useState } from 'react';
import { CreditCardVisual, CreditCardData } from '@/components/credit-cards/CreditCardVisual';
import { InvoiceDetailModal, InvoiceDetailItem } from '@/components/credit-cards/InvoiceDetailModal';
import { PayInvoiceModal } from '@/components/credit-cards/PayInvoiceModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatMonthYear } from '@/lib/utils';
import {
  CreditCard,
  Plus,
  Receipt,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';
import { usePeriod } from '@/contexts/PeriodContext';

export default function CreditCardsPage() {
  const { month, year } = usePeriod();
  const [cards, setCards] = useState<CreditCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // New Card Modal
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBank, setNewBank] = useState('');
  const [newBrand, setNewBrand] = useState('Mastercard');
  const [newLast4, setNewLast4] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [newClosingDay, setNewClosingDay] = useState('3');
  const [newDueDay, setNewDueDay] = useState('10');
  const [newColor, setNewColor] = useState('#18181b');
  const [isSaving, setIsSaving] = useState(false);

  // Edit Card Modal
  const [editingCard, setEditingCard] = useState<CreditCardData | null>(null);
  const [editName, setEditName] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editBrand, setEditBrand] = useState('Mastercard');
  const [editLast4, setEditLast4] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editClosingDay, setEditClosingDay] = useState('3');
  const [editDueDay, setEditDueDay] = useState('10');

  // Modal States
  const [selectedCardForInvoice, setSelectedCardForInvoice] = useState<CreditCardData | null>(null);
  const [selectedCardForPayment, setSelectedCardForPayment] = useState<CreditCardData | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceDetailItem[]>([]);
  const [loadingInvoiceItems, setLoadingInvoiceItems] = useState(false);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cards?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setCards(data.cards);
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [month, year]);

  useEffect(() => {
    if (selectedCardForInvoice) {
      setLoadingInvoiceItems(true);
      fetch(`/api/cards/${selectedCardForInvoice.id}/items?month=${month}&year=${year}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.items) {
            setInvoiceItems(data.items);
          } else {
            setInvoiceItems([]);
          }
        })
        .catch((err) => {
          console.error('Error fetching invoice items:', err);
          setInvoiceItems([]);
        })
        .finally(() => setLoadingInvoiceItems(false));
    } else {
      setInvoiceItems([]);
    }
  }, [selectedCardForInvoice, month, year]);

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newLimit) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          bank: newBank || 'Banco',
          brand: newBrand,
          last4Digits: newLast4 || '0000',
          creditLimit: parseFloat(newLimit.replace(',', '.')),
          closingDay: parseInt(newClosingDay, 10),
          dueDay: parseInt(newDueDay, 10),
          color: newColor,
        }),
      });

      if (res.ok) {
        setIsNewCardOpen(false);
        setNewName('');
        setNewBank('');
        setNewLimit('');
        setNewLast4('');
        await fetchCards();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (card: CreditCardData) => {
    setEditingCard(card);
    setEditName(card.name);
    setEditBank(card.bank);
    setEditBrand(card.brand);
    setEditLast4(card.last4Digits);
    setEditLimit(card.creditLimit.toString());
    setEditClosingDay(card.closingDay.toString());
    setEditDueDay(card.dueDay.toString());
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          bank: editBank,
          brand: editBrand,
          last4Digits: editLast4,
          creditLimit: parseFloat(editLimit.replace(',', '.')),
          closingDay: parseInt(editClosingDay, 10),
          dueDay: parseInt(editDueDay, 10),
        }),
      });

      if (res.ok) {
        setEditingCard(null);
        await fetchCards();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Deseja realmente remover este cartão de crédito?')) return;

    try {
      const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCards();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sampleInvoiceItems: InvoiceDetailItem[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-widest">
              {formatMonthYear(month, year)}
            </span>
            <span className="text-xs text-zinc-400">Ciclos de Faturamento</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Meus Cartões de Crédito</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cadastre, edite ou exclua cartões, configure dias de corte e acompanhe limites e faturas
          </p>
        </div>
        <button
          onClick={() => setIsNewCardOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-lg shadow-zinc-950/40 border border-white/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cartão</span>
        </button>
      </div>

      {/* Golden Rule Highlight */}
      <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-start gap-3">
        <Receipt className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 leading-relaxed">
          <strong>Arquitetura de Ciclo Inteligente:</strong> O NexumHub diferencia com precisão:{' '}
          <span className="text-white font-semibold">Compra</span> (Data do Fato Gerador) ≠{' '}
          <span className="text-white font-semibold">Parcela</span> (Projeção) ≠{' '}
          <span className="text-white font-semibold">Fatura</span> (Ciclo de Corte) ≠{' '}
          <span className="text-white font-semibold">Pagamento da Fatura</span> (Liquidação Bancária).
        </div>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <Card className="py-8 text-center text-xs text-slate-500">
          Nenhum cartão cadastrado. Clique em "+ Novo Cartão" para adicionar seu primeiro cartão.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="relative group">
              <CreditCardVisual
                card={card}
                onOpenInvoice={() => setSelectedCardForInvoice(card)}
                onPayInvoice={() => setSelectedCardForPayment(card)}
              />
              {/* Quick Card Edit/Delete Action Bar */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEdit(card)}
                  className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Editar Cartão"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Excluir Cartão"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Card Modal */}
      <Modal
        isOpen={isNewCardOpen}
        onClose={() => setIsNewCardOpen(false)}
        title="Cadastrar Novo Cartão de Crédito"
        description="Configure o limite, banco, bandeira e os dias de corte e vencimento."
      >
        <form onSubmit={handleCreateCard} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nome do Cartão
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Nubank Ultravioleta, Itaú Personnalité..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Banco Emissor
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank, Itaú, Santander..."
                value={newBank}
                onChange={(e) => setNewBank(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Bandeira
              </label>
              <select
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
              >
                <option value="Mastercard">Mastercard</option>
                <option value="Visa">Visa</option>
                <option value="Elo">Elo</option>
                <option value="Amex">American Express</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Limite Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="5000,00"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Dia de Corte / Fechamento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={newClosingDay}
                onChange={(e) => setNewClosingDay(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Dia de Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={newDueDay}
                onChange={(e) => setNewDueDay(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Últimos 4 Dígitos
            </label>
            <input
              type="text"
              maxLength={4}
              placeholder="Ex: 8842"
              value={newLast4}
              onChange={(e) => setNewLast4(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsNewCardOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-lg shadow-zinc-950/40 border border-white/20 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Cartão</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Card Modal */}
      {editingCard && (
        <Modal
          isOpen={!!editingCard}
          onClose={() => setEditingCard(null)}
          title="Editar Cartão de Crédito"
          description="Altere os limites e regras de fechamento e vencimento do cartão."
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome do Cartão
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Banco Emissor
                </label>
                <input
                  type="text"
                  required
                  value={editBank}
                  onChange={(e) => setEditBank(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Bandeira
                </label>
                <select
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:border-zinc-400 focus:outline-none"
                >
                  <option value="Mastercard">Mastercard</option>
                  <option value="Visa">Visa</option>
                  <option value="Elo">Elo</option>
                  <option value="Amex">American Express</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Limite Total (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Dia de Corte
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={editClosingDay}
                  onChange={(e) => setEditClosingDay(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Dia de Vencimento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={editDueDay}
                  onChange={(e) => setEditDueDay(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-lg shadow-zinc-950/40 border border-white/20 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invoice Detail Modal */}
      {selectedCardForInvoice && (
        <InvoiceDetailModal
          isOpen={!!selectedCardForInvoice}
          onClose={() => setSelectedCardForInvoice(null)}
          cardName={selectedCardForInvoice.name}
          referenceMonthYear={formatMonthYear(month, year)}
          dueDate={`2026-${String(month).padStart(2, '0')}-${String(selectedCardForInvoice.dueDay).padStart(2, '0')}`}
          status="OPEN"
          totalAmount={selectedCardForInvoice.currentInvoiceAmount}
          items={invoiceItems}
          onPay={() => {
            setSelectedCardForPayment(selectedCardForInvoice);
            setSelectedCardForInvoice(null);
          }}
        />
      )}

      {/* Pay Invoice Modal */}
      {selectedCardForPayment && (
        <PayInvoiceModal
          isOpen={!!selectedCardForPayment}
          onClose={() => setSelectedCardForPayment(null)}
          invoiceId="inv_current"
          cardName={selectedCardForPayment.name}
          amount={selectedCardForPayment.currentInvoiceAmount}
          onSuccess={fetchCards}
        />
      )}
    </div>
  );
}
