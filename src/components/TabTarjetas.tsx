import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  FileUp,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Account, CreditCardAccount, CreditCardConsumption } from '../types/finance';
import { formatARS, formatDate, safeNumber } from '../utils/formatters';

export function TabTarjetas({
  creditCards,
  accounts,
  monthLabel,
  onOpenGeminiScanner,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onPayCardStatement,
}: {
  creditCards: CreditCardAccount[];
  accounts: Account[];
  monthLabel: string;
  onOpenGeminiScanner: () => void;
  onAddCard: (card: CreditCardAccount) => void;
  onUpdateCard: (cardId: string, patch: Partial<CreditCardAccount>) => void;
  onDeleteCard: (cardId: string) => void;
  onPayCardStatement: (card: CreditCardAccount, accountId: string, amount: number) => void;
}) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(
    creditCards[0]?.id || null
  );
  const [newConsumptionCardId, setNewConsumptionCardId] = useState<string | null>(null);
  const [consDesc, setConsDesc] = useState('');
  const [consAmount, setConsAmount] = useState('');
  const [consInstallments, setConsInstallments] = useState('');

  const [payingCard, setPayingCard] = useState<CreditCardAccount | null>(null);
  const [payAccountId, setPayAccountId] = useState<string>(accounts[0]?.id || 'banco_macro');

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardBank, setCardBank] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState('25');
  const [cardDueDay, setCardDueDay] = useState('5');

  const summary = useMemo(() => {
    const total = creditCards.reduce((acc, c) => acc + safeNumber(c.totalAmount), 0);
    const paid = creditCards
      .filter((c) => c.status === 'paid')
      .reduce((acc, c) => acc + safeNumber(c.totalAmount), 0);
    const pending = total - paid;
    return { total, paid, pending };
  }, [creditCards]);

  const handleAddConsumption = (e: React.FormEvent, card: CreditCardAccount) => {
    e.preventDefault();
    const val = safeNumber(consAmount);
    if (!consDesc.trim() || val < 0) return;

    const newItem: CreditCardConsumption = {
      id: 'cc_item_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: consDesc.trim(),
      amount: val,
      installments: consInstallments.trim() || undefined,
    };

    const nextConsumptions = [newItem, ...card.consumptions];
    const nextTotal = nextConsumptions.reduce((s, item) => s + safeNumber(item.amount), 0);

    onUpdateCard(card.id, {
      consumptions: nextConsumptions,
      totalAmount: Math.max(nextTotal, safeNumber(card.totalAmount) === 0 ? nextTotal : nextTotal),
    });

    setConsDesc('');
    setConsAmount('');
    setConsInstallments('');
    setNewConsumptionCardId(null);
  };

  const handleRemoveConsumption = (card: CreditCardAccount, itemId: string) => {
    const nextConsumptions = card.consumptions.filter((i) => i.id !== itemId);
    const nextTotal = nextConsumptions.reduce((s, item) => s + safeNumber(item.amount), 0);
    onUpdateCard(card.id, {
      consumptions: nextConsumptions,
      totalAmount: nextTotal,
    });
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;
    const newCard: CreditCardAccount = {
      id: 'cc_' + Date.now(),
      name: cardName.trim(),
      bank: cardBank.trim() || 'Banco',
      brand: 'visa',
      closingDay: Math.min(31, Math.max(1, safeNumber(cardClosingDay) || 25)),
      dueDay: Math.min(31, Math.max(1, safeNumber(cardDueDay) || 5)),
      totalAmount: 0,
      status: 'pending',
      consumptions: [],
      accentColor: '#0EA5E9',
    };
    onAddCard(newCard);
    setCardName('');
    setCardBank('');
    setIsAddingCard(false);
    setExpandedCardId(newCard.id);
  };

  return (
    <div className="space-y-6">
      {/* Hero Cards Summary + Gemini PDF/Screenshot Scanner CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-sky-500/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-white/85 font-medium">
              <span>Tarjetas y Resúmenes</span>
              <span>{monthLabel}</span>
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
              {formatARS(summary.total)}
            </div>
            <p className="text-xs text-white/80 mt-1">
              Total consolidado de resúmenes de tarjetas del período
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/20">
            <div>
              <span className="text-[11px] text-white/80 block">Pendiente de pago</span>
              <span className="text-lg font-extrabold tabular-nums">
                {formatARS(summary.pending)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-white/80 block">Resúmenes pagados</span>
              <span className="text-lg font-extrabold tabular-nums text-emerald-200">
                {formatARS(summary.paid)}
              </span>
            </div>
          </div>
        </div>

        {/* Gemini Statement Upload Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm shadow-slate-200/70 flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Importar Resumen con IA
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Subí el PDF o una captura del resumen de Visa Macro, Nativa o Mercado Pago. Gemini extrae cierres, vencimientos, cuotas y consumos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onOpenGeminiScanner}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
            >
              <FileUp className="w-4 h-4" />
              <span>Subir PDF o Captura</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCard((v) => !v)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Tarjeta</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Card Quick Form */}
      {isAddingCard && (
        <form
          onSubmit={handleCreateCard}
          className="bg-white rounded-3xl p-5 shadow-sm shadow-slate-200/70 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Nombre de la Tarjeta
            </label>
            <input
              type="text"
              required
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Ej: Visa Galicia"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Banco / Emisor
            </label>
            <input
              type="text"
              value={cardBank}
              onChange={(e) => setCardBank(e.target.value)}
              placeholder="Ej: Macro / BNA"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Día Cierre
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={cardClosingDay}
                onChange={(e) => setCardClosingDay(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-sm font-bold text-slate-900 tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Día Vto.
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={cardDueDay}
                onChange={(e) => setCardDueDay(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-sm font-bold text-slate-900 tabular-nums"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold cursor-pointer min-h-[44px]"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCard(false)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer min-h-[44px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Credit Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {creditCards.map((card) => {
          const isExpanded = expandedCardId === card.id;
          const isPaid = card.status === 'paid';

          return (
            <div
              key={card.id}
              className="bg-white rounded-3xl p-5 shadow-sm shadow-slate-200/70 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-full text-white flex items-center justify-center shrink-0"
                    style={{ backgroundColor: card.accentColor || '#0EA5E9' }}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {card.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span>{card.bank}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Cierre {card.closingDate ? formatDate(card.closingDate) : `día ${card.closingDay}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Vto {card.dueDate ? formatDate(card.dueDate) : `día ${card.dueDay}`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteCard(card.id)}
                  title="Eliminar tarjeta"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Editable Total & Status */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block">
                    Total Resumen del Mes ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={card.totalAmount === 0 ? '' : card.totalAmount}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdateCard(card.id, {
                        totalAmount: Math.max(0, safeNumber(e.target.value)),
                      })
                    }
                    className="mt-0.5 w-36 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-base font-extrabold text-slate-900 tabular-nums focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {isPaid ? (
                    <button
                      type="button"
                      onClick={() => onUpdateCard(card.id, { status: 'pending', paidAt: undefined })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold cursor-pointer min-h-[40px]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Pagado</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPayingCard(card);
                        setPayAccountId(accounts[0]?.id || 'banco_macro');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors cursor-pointer min-h-[40px]"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Pagar Resumen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Toggle Consumptions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer py-1"
                >
                  {isExpanded
                    ? `Ocultar consumos y cuotas (${card.consumptions.length})`
                    : `Ver consumos y cuotas (${card.consumptions.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedCardId(card.id);
                    setNewConsumptionCardId(
                      newConsumptionCardId === card.id ? null : card.id
                    );
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer py-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar consumo
                </button>
              </div>

              {/* Add Consumption Inline Form */}
              {newConsumptionCardId === card.id && (
                <form
                  onSubmit={(e) => handleAddConsumption(e, card)}
                  className="bg-slate-50 rounded-2xl p-3 space-y-2.5"
                >
                  <input
                    type="text"
                    required
                    value={consDesc}
                    onChange={(e) => setConsDesc(e.target.value)}
                    placeholder="Comercio o concepto (ej: Starlink, Supermercado)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      required
                      value={consAmount}
                      onChange={(e) => setConsAmount(e.target.value)}
                      placeholder="Importe ($)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 tabular-nums focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      value={consInstallments}
                      onChange={(e) => setConsInstallments(e.target.value)}
                      placeholder="Cuotas (ej: 3/6)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Guardar Consumo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewConsumptionCardId(null)}
                      className="px-3 py-2 rounded-xl bg-white text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Consumptions List */}
              {isExpanded && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {card.consumptions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">
                      Sin consumos detallados ($0). Agregá consumos manuales o subí el PDF del resumen con IA.
                    </p>
                  ) : (
                    card.consumptions.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 py-1.5 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {item.description}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {formatDate(item.date)}
                            {item.installments ? ` · Cuota ${item.installments}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {formatARS(item.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveConsumption(card, item.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pay Card Statement Quick Modal */}
      {payingCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Pagar Resumen {payingCard.name}
            </h3>
            <p className="text-xs text-slate-500">
              Se descontará el importe de la cuenta elegida y se registrará el egreso del mes.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Importe a pagar ($)
                </label>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {formatARS(payingCard.totalAmount)}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Debitar desde cuenta
                </label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatARS(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onPayCardStatement(payingCard, payAccountId, safeNumber(payingCard.totalAmount));
                  setPayingCard(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold cursor-pointer min-h-[44px]"
              >
                Confirmar Pago
              </button>
              <button
                type="button"
                onClick={() => setPayingCard(null)}
                className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
