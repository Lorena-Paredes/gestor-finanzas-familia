import React, { useMemo, useState } from 'react';
import {
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Footprints,
  HeartHandshake,
  Home,
  Pencil,
  Plus,
  Tractor,
  Trash2,
} from 'lucide-react';
import {
  Account,
  Bill,
  BillGroup,
  TerritoryLoanState,
  Transaction,
} from '../types/finance';
import { formatARS, formatDate, getDaysDiff, safeNumber } from '../utils/formatters';
import { isLegacyRollerBill } from '../data/defaults';

export function TabCampoFamilia({
  transactions,
  bills,
  accounts,
  mamaAccounts,
  territoryLoan,
  monthLabel,
  onOpenNewMovement,
  onDeleteTransaction,
  onOpenNewBill,
  onUpdateBill,
  onPayBill,
  onDeleteBill,
  onEditAccountBalance,
  onUpdateTerritoryLoan,
  onPayTerritoryInstallment,
  onRegisterRobertClass,
}: {
  transactions: Transaction[];
  bills: Bill[];
  accounts: Account[];
  mamaAccounts: Account[];
  territoryLoan: TerritoryLoanState;
  monthLabel: string;
  onOpenNewMovement: (opts: {
    type: 'income' | 'expense';
    costCenter: Transaction['costCenter'];
    owner: 'personal' | 'mama';
  }) => void;
  onDeleteTransaction: (txId: string) => void;
  onOpenNewBill: (defaultGroup: BillGroup) => void;
  onUpdateBill: (billId: string, patch: Partial<Bill>) => void;
  onPayBill: (bill: Bill) => void;
  onDeleteBill: (billId: string) => void;
  onEditAccountBalance: (account: Account, isMama: boolean) => void;
  onUpdateTerritoryLoan: (patch: Partial<TerritoryLoanState>) => void;
  onPayTerritoryInstallment: (installmentNumber: number) => void;
  onRegisterRobertClass: (opts: {
    date: string;
    amount: number;
    accountId: string;
    note?: string;
  }) => void;
}) {
  const [openSection, setOpenSection] = useState<{
    campo: boolean;
    mama: boolean;
    fijos: boolean;
  }>({
    campo: true,
    mama: true,
    fijos: true,
  });

  const [fijosFilter, setFijosFilter] = useState<
    'all' | 'movilidad' | 'renato' | 'hogar' | 'tarjetas' | 'lorena'
  >('all');

  // Quick class form for Robert / Fútbol Renato
  const [robertDate, setRobertDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [robertAmount, setRobertAmount] = useState('');
  const [robertAccountId, setRobertAccountId] = useState(
    accounts[0]?.id || 'mercado_pago'
  );
  const [robertNote, setRobertNote] = useState('');

  // 1. CAMPO Y CEREALES CALCULATIONS (EXPLICIT + vs -)
  const campoData = useMemo(() => {
    const campoTxs = transactions.filter((t) => t.costCenter === 'campo');
    const ingresos = campoTxs
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + safeNumber(t.amount), 0);
    const egresos = campoTxs
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + safeNumber(t.amount), 0);
    const neto = ingresos - egresos;
    const campoBills = bills.filter((b) => b.group === 'campo');
    return { campoTxs, ingresos, egresos, neto, campoBills };
  }, [transactions, bills]);

  // 2. MARIA ESTER (IAIA) CALCULATIONS
  const mamaData = useMemo(() => {
    const totalBalance = mamaAccounts.reduce((s, a) => s + safeNumber(a.balance), 0);
    const mamaTxs = transactions.filter(
      (t) => t.owner === 'mama' || t.costCenter === 'mama'
    );
    const ingresos = mamaTxs
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + safeNumber(t.amount), 0);
    const egresos = mamaTxs
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + safeNumber(t.amount), 0);
    const mamaBills = bills.filter((b) => b.group === 'mama');
    const pendingTotal = mamaBills
      .filter((b) => b.status === 'pending')
      .reduce((s, b) => s + safeNumber(b.amount), 0);
    return { totalBalance, mamaTxs, ingresos, egresos, mamaBills, pendingTotal };
  }, [mamaAccounts, transactions, bills]);

  // 3. FIJOS, SUSCRIPCIONES Y FAMILIA
  const fijosData = useMemo(() => {
    const familyGroups: BillGroup[] = ['movilidad', 'renato', 'hogar', 'tarjetas', 'lorena'];
    const allFamilyBills = bills.filter(
      (b) => familyGroups.includes(b.group) && !isLegacyRollerBill(b)
    );
    const filtered =
      fijosFilter === 'all'
        ? allFamilyBills
        : allFamilyBills.filter((b) => b.group === fijosFilter);
    const total = allFamilyBills.reduce((s, b) => s + safeNumber(b.amount), 0);
    const pending = allFamilyBills
      .filter((b) => b.status === 'pending')
      .reduce((s, b) => s + safeNumber(b.amount), 0);
    return { allFamilyBills, filtered, total, pending };
  }, [bills, fijosFilter]);

  // 4. TERRITORY LOAN METRICS
  const loanMetrics = useMemo(() => {
    const paidCount = territoryLoan.paidInstallmentNumbers.length;
    const remainingInstallments = Math.max(
      0,
      territoryLoan.totalInstallments - paidCount
    );
    const pure = safeNumber(territoryLoan.pureInstallment);
    const mapfre = safeNumber(territoryLoan.mapfreInsurance);
    const totalInstallment = pure + mapfre;
    const remainingDebt = remainingInstallments * pure;
    const nextInstallment =
      Array.from({ length: territoryLoan.totalInstallments }, (_, i) => i + 1).find(
        (n) => !territoryLoan.paidInstallmentNumbers.includes(n)
      ) || null;
    const icbcBalance =
      accounts.find((a) => a.id === territoryLoan.accountId)?.balance ?? 0;

    return {
      paidCount,
      remainingInstallments,
      pure,
      mapfre,
      totalInstallment,
      remainingDebt,
      nextInstallment,
      icbcBalance,
    };
  }, [territoryLoan, accounts]);

  // 5. ROBERT / FÚTBOL RENATO (VARIABLE PER CLASS)
  const robertClasses = useMemo(() => {
    const items = transactions.filter(
      (t) =>
        t.costCenter === 'renato' &&
        (t.renatoSubcategory === 'robert_futbol' ||
          t.description.toLowerCase().includes('robert'))
    );
    const total = items.reduce((s, i) => s + safeNumber(i.amount), 0);
    return { items, total };
  }, [transactions]);

  const toggleSection = (key: 'campo' | 'mama' | 'fijos') => {
    setOpenSection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderBillRow = (bill: Bill) => {
    const isPaid = bill.status === 'paid';
    const days = getDaysDiff(bill.dueDate);

    return (
      <div
        key={bill.id}
        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 last:border-b-0"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{bill.title}</span>
            <span
              className={`text-xs font-semibold ${
                isPaid
                  ? 'text-emerald-600'
                  : days <= 2 && bill.dueDate
                  ? 'text-rose-600'
                  : 'text-amber-600'
              }`}
            >
              {isPaid ? 'Pagado' : 'Pendiente'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
            <span>{bill.provider}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Vto {bill.dueDate ? formatDate(bill.dueDate) : `día ${bill.dueDay || '-'}`}
            </span>
            <span aria-hidden="true">·</span>
            <span>{bill.paymentMethodDetail}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
              $
            </span>
            <input
              type="number"
              min="0"
              value={safeNumber(bill.amount) === 0 ? '' : safeNumber(bill.amount)}
              placeholder="0"
              onChange={(e) =>
                onUpdateBill(bill.id, {
                  amount: Math.max(0, safeNumber(e.target.value)),
                })
              }
              className="w-28 bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-2.5 py-2 text-xs font-extrabold text-slate-900 tabular-nums focus:outline-none focus:border-emerald-500"
            />
          </div>

          {isPaid ? (
            <button
              type="button"
              onClick={() => onUpdateBill(bill.id, { status: 'pending', paidAt: undefined })}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold cursor-pointer min-h-[40px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pagado</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onPayBill(bill)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer min-h-[40px]"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pagar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onDeleteBill(bill.id)}
            title="Eliminar ítem"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* ================================================================ */}
      {/* SUB-SECCIÓN 1: CAMPO Y CEREALES (VERDE ESMERALDA #10B981)        */}
      {/* ================================================================ */}
      <section className="bg-white rounded-3xl shadow-sm shadow-slate-200/70 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('campo')}
          className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/25">
              <Tractor className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900">
                Campo y Cereales
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                Ingresos +{formatARS(campoData.ingresos)} · Egresos -{formatARS(campoData.egresos)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Neto Campo</span>
              <span
                className={`text-base font-extrabold tabular-nums ${
                  campoData.neto >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {campoData.neto >= 0 ? '+' : ''}
                {formatARS(campoData.neto)}
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${
                openSection.campo ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSection.campo && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid grid-cols-3 gap-3 flex-1 min-w-[260px]">
                <div className="bg-emerald-50/80 rounded-2xl p-3">
                  <span className="text-[11px] font-semibold text-emerald-700 block">
                    Ingresos (+)
                  </span>
                  <span className="text-sm font-extrabold text-emerald-700 tabular-nums">
                    +{formatARS(campoData.ingresos)}
                  </span>
                </div>
                <div className="bg-rose-50/80 rounded-2xl p-3">
                  <span className="text-[11px] font-semibold text-rose-700 block">
                    Egresos (-)
                  </span>
                  <span className="text-sm font-extrabold text-rose-700 tabular-nums">
                    -{formatARS(campoData.egresos)}
                  </span>
                </div>
                <div className="bg-slate-100 rounded-2xl p-3">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Balance Neto
                  </span>
                  <span
                    className={`text-sm font-extrabold tabular-nums ${
                      campoData.neto >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {campoData.neto >= 0 ? '+' : ''}
                    {formatARS(campoData.neto)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onOpenNewMovement({ type: 'income', costCenter: 'campo', owner: 'personal' })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer min-h-[44px]"
                >
                  <Plus className="w-4 h-4" /> Ingreso Campo (+)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenNewMovement({ type: 'expense', costCenter: 'campo', owner: 'personal' })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer min-h-[44px]"
                >
                  <Plus className="w-4 h-4" /> Egreso Campo (-)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Movimientos de Campo y Cereales ({monthLabel})
              </h3>
              {campoData.campoTxs.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">
                  Sin movimientos en Campo este mes ($0). Cargá una Renta de Campo (+), liquidación Scilingo (+) o un gasto (-).
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {campoData.campoTxs.map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <div
                        key={tx.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {tx.description}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                            {isIncome ? 'Ingreso (+)' : 'Egreso (-)'} · {formatDate(tx.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm font-extrabold tabular-nums ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatARS(safeNumber(tx.amount))}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Servicios y Gastos Fijos del Campo
                </h3>
                <button
                  type="button"
                  onClick={() => onOpenNewBill('campo')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo ítem
                </button>
              </div>
              {campoData.campoBills.map(renderBillRow)}
            </div>
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* SUB-SECCIÓN 2: ADMINISTRACIÓN MARÍA ESTER (IAIA) - TEAL #14B8A6  */}
      {/* ================================================================ */}
      <section className="bg-white rounded-3xl shadow-sm shadow-slate-200/70 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('mama')}
          className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/25">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900">
                Administración María Ester (Iaia)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                Saldo {formatARS(mamaData.totalBalance)} · Pendiente {formatARS(mamaData.pendingTotal)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Cuentas Iaia</span>
              <span className="text-base font-extrabold text-teal-600 tabular-nums">
                {formatARS(mamaData.totalBalance)}
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${
                openSection.mama ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSection.mama && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-[240px]">
                {mamaAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => onEditAccountBalance(acc, true)}
                    className="bg-teal-50/70 hover:bg-teal-50 rounded-2xl p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-bold text-teal-900 block">{acc.name}</span>
                      <span className="text-sm font-extrabold text-teal-700 tabular-nums">
                        {formatARS(acc.balance)}
                      </span>
                    </div>
                    <Pencil className="w-4 h-4 text-teal-500" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onOpenNewMovement({ type: 'income', costCenter: 'mama', owner: 'mama' })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold cursor-pointer min-h-[44px]"
                >
                  <Plus className="w-4 h-4" /> Ingreso Iaia (+)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenNewMovement({ type: 'expense', costCenter: 'mama', owner: 'mama' })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer min-h-[44px]"
                >
                  <Plus className="w-4 h-4" /> Egreso Iaia (-)
                </button>
              </div>
            </div>

            {mamaData.mamaTxs.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Movimientos de María Ester
                </h3>
                <div className="divide-y divide-slate-100">
                  {mamaData.mamaTxs.map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {tx.description}
                          </p>
                          <p className="text-xs text-slate-500 tabular-nums">
                            {formatDate(tx.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm font-extrabold tabular-nums ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatARS(tx.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Impuestos y Servicios de María Ester
                </h3>
                <button
                  type="button"
                  onClick={() => onOpenNewBill('mama')}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo servicio
                </button>
              </div>
              {mamaData.mamaBills.map(renderBillRow)}
            </div>
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* SUB-SECCIÓN 3: FIJOS, VEHÍCULO, RENATO Y FAMILIA (ÁMBAR #F59E0B) */}
      {/* ================================================================ */}
      <section className="bg-white rounded-3xl shadow-sm shadow-slate-200/70 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('fijos')}
          className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/25">
              <Home className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900">
                Fijos, Suscripciones y Familia
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                Préstamo ICBC Territory · Plan Ovalo · Robert / Fútbol Renato · Starlink · Netflix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Pendiente Fijos</span>
              <span className="text-base font-extrabold text-amber-600 tabular-nums">
                {formatARS(fijosData.pending)}
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${
                openSection.fijos ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openSection.fijos && (
          <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-5">
            {/* Filter Controls + Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'movilidad', label: 'Préstamo ICBC / Auto' },
                  { id: 'renato', label: 'Renato' },
                  { id: 'hogar', label: 'Hogar y Salud' },
                  { id: 'tarjetas', label: 'Netflix / YouTube' },
                  { id: 'lorena', label: 'Lorena' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFijosFilter(tab.id as typeof fijosFilter)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      fijosFilter === tab.id
                        ? 'bg-white text-amber-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onOpenNewBill(fijosFilter === 'all' ? 'hogar' : fijosFilter)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer min-h-[40px] shrink-0"
              >
                <Plus className="w-4 h-4" /> Nuevo Fijo / Servicio
              </button>
            </div>

            {/* ========================================================== */}
            {/* MÓDULO DEDICADO: PRÉSTAMO PRENDARIO ICBC - FORD TERRITORY  */}
            {/* ========================================================== */}
            {(fijosFilter === 'all' || fijosFilter === 'movilidad') && (
              <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/80 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Préstamo Prendario ICBC - Ford Territory
                      </h3>
                      <p className="text-xs text-slate-500">
                        {loanMetrics.paidCount} / {territoryLoan.totalInstallments} cuotas pagadas · Débito Caja de Ahorro Banco ICBC (Saldo: {formatARS(loanMetrics.icbcBalance)})
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Saldo de Deuda Restante
                    </span>
                    <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                      {formatARS(loanMetrics.remainingDebt)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{
                      width: `${
                        territoryLoan.totalInstallments > 0
                          ? (loanMetrics.paidCount / territoryLoan.totalInstallments) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                {/* Cuota Pura + Seguro Mapfre (Editable) + Cuota Total */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white rounded-2xl p-3 border border-slate-200/60">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Cuota Pura ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={territoryLoan.pureInstallment || ''}
                      placeholder="1333335"
                      onChange={(e) =>
                        onUpdateTerritoryLoan({
                          pureInstallment: Math.max(0, safeNumber(e.target.value)),
                        })
                      }
                      className="w-full text-sm font-extrabold text-slate-900 tabular-nums focus:outline-none"
                    />
                  </div>

                  <div className="bg-white rounded-2xl p-3 border border-slate-200/60">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Seguro Mapfre Incluido ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={territoryLoan.mapfreInsurance || ''}
                      placeholder="117470"
                      onChange={(e) =>
                        onUpdateTerritoryLoan({
                          mapfreInsurance: Math.max(0, safeNumber(e.target.value)),
                        })
                      }
                      className="w-full text-sm font-extrabold text-amber-700 tabular-nums focus:outline-none"
                    />
                  </div>

                  <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200/70 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-rose-700 block">
                      Cuota Total Mensual
                    </span>
                    <span className="text-base font-extrabold text-rose-700 tabular-nums">
                      {formatARS(loanMetrics.totalInstallment)}
                    </span>
                  </div>
                </div>

                {/* 18-Installments Toggle Grid + Pay Next Installment CTA */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      Tocá una cuota para marcar/desmarcar pagada:
                    </span>
                    {loanMetrics.nextInstallment !== null && (
                      <button
                        type="button"
                        onClick={() =>
                          onPayTerritoryInstallment(loanMetrics.nextInstallment!)
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer min-h-[40px]"
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          Pagar Cuota {loanMetrics.nextInstallment}/18 desde ICBC ({formatARS(loanMetrics.totalInstallment)})
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                    {Array.from(
                      { length: territoryLoan.totalInstallments },
                      (_, i) => i + 1
                    ).map((num) => {
                      const isPaid =
                        territoryLoan.paidInstallmentNumbers.includes(num);
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            if (isPaid) {
                              onUpdateTerritoryLoan({
                                paidInstallmentNumbers:
                                  territoryLoan.paidInstallmentNumbers.filter(
                                    (n) => n !== num
                                  ),
                              });
                            } else {
                              onPayTerritoryInstallment(num);
                            }
                          }}
                          className={`py-2 rounded-xl text-xs font-bold tabular-nums transition-colors cursor-pointer min-h-[38px] ${
                            isPaid
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-rose-400'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* MÓDULO VARIABLE POR CLASE: ROBERT / FÚTBOL RENATO          */}
            {/* ========================================================== */}
            {(fijosFilter === 'all' || fijosFilter === 'renato') && (
              <div className="bg-amber-50/70 rounded-3xl p-5 border border-amber-200/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Footprints className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Robert / Fútbol Renato (Gasto Variable por Clase)
                      </h3>
                      <p className="text-xs text-slate-600">
                        Sin días fijos ni vencimiento mensual · Se registra por cada clase tomada y abonada
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-amber-800 block">
                      {robertClasses.items.length} {robertClasses.items.length === 1 ? 'clase' : 'clases'} en {monthLabel}
                    </span>
                    <span className="text-base font-extrabold text-amber-900 tabular-nums">
                      {formatARS(robertClasses.total)}
                    </span>
                  </div>
                </div>

                {/* Quick Class Entry Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const amt = Math.max(0, safeNumber(robertAmount));
                    if (amt <= 0) return;
                    onRegisterRobertClass({
                      date: robertDate,
                      amount: amt,
                      accountId: robertAccountId,
                      note: robertNote.trim() || undefined,
                    });
                    setRobertAmount('');
                    setRobertNote('');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                >
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Fecha de la clase
                    </label>
                    <input
                      type="date"
                      required
                      value={robertDate}
                      onChange={(e) => setRobertDate(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 tabular-nums"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Importe clase ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={robertAmount}
                      onChange={(e) => setRobertAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 tabular-nums"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Cuenta de pago
                    </label>
                    <select
                      value={robertAccountId}
                      onChange={(e) => setRobertAccountId(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer min-h-[38px]"
                    >
                      + Registrar Clase
                    </button>
                  </div>
                </form>

                {robertClasses.items.length > 0 && (
                  <div className="divide-y divide-amber-200/60 pt-1">
                    {robertClasses.items.map((item) => (
                      <div
                        key={item.id}
                        className="py-2 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800">
                          {item.description} · {formatDate(item.date)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-rose-600 tabular-nums">
                            -{formatARS(item.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Filtered Fixed Bills */}
            <div>
              {fijosData.filtered.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">
                  No hay servicios registrados en este filtro.
                </p>
              ) : (
                fijosData.filtered.map(renderBillRow)
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
