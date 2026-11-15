import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calculator,
  Fuel,
  Landmark,
  Pencil,
  PieChart,
  Plus,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Account, Transaction } from '../types/finance';
import { CATEGORY_THEME } from '../data/defaults';
import { formatARS, formatDate, safeNumber } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { DonutChart } from './DonutChart';

export function TabInicio({
  accounts,
  transactions,
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  netOperatingBalance,
  monthLabel,
  onOpenNewMovement,
  onEditAccountBalance,
  onDeleteTransaction,
  onOpenPatrimonySummary,
  onOpenMonthlyClosing,
}: {
  accounts: Account[];
  transactions: Transaction[];
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netOperatingBalance: number;
  monthLabel: string;
  onOpenNewMovement: (type: 'income' | 'expense') => void;
  onEditAccountBalance: (account: Account) => void;
  onDeleteTransaction: (txId: string) => void;
  onOpenPatrimonySummary: () => void;
  onOpenMonthlyClosing: () => void;
}) {
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) =>
      (b.date || '').localeCompare(a.date || '')
    );
    if (txFilter === 'all') return sorted;
    return sorted.filter((t) => t.type === txFilter);
  }, [transactions, txFilter]);

  const getAccountIcon = (iconName: string) => {
    switch (iconName) {
      case 'Landmark':
        return <Landmark className="w-4 h-4" />;
      case 'Smartphone':
        return <Smartphone className="w-4 h-4" />;
      case 'Fuel':
        return <Fuel className="w-4 h-4" />;
      case 'Wallet':
        return <Wallet className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Quick Buttons: Ver Resumen General / Mi Patrimonio + Corte / Cierre del Mes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenPatrimonySummary}
          className="bg-white hover:bg-slate-50 rounded-2xl p-4 shadow-sm shadow-slate-200/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer group min-h-[56px]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 block">
                Ver Resumen General / Mi Patrimonio
              </span>
              <span className="text-xs text-slate-500">
                Mis Pesos ($), Mis Dólares (u$s) e Inversiones Activas
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
        </button>

        <button
          type="button"
          onClick={onOpenMonthlyClosing}
          className="bg-white hover:bg-slate-50 rounded-2xl p-4 shadow-sm shadow-slate-200/70 flex items-center justify-between gap-3 text-left transition-all cursor-pointer group min-h-[56px]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 block">
                Corte / Cierre del Mes
              </span>
              <span className="text-xs text-slate-500">
                Capacidad de inversión e historial mensual de {monthLabel}
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
        </button>
      </div>

      {/* Top Hero Row: Saldo Total Card + Donut Chart on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Protagonist Gradient Card - Saldo Total */}
        <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 p-6 text-white shadow-lg shadow-emerald-500/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-white/85 text-xs font-medium">
              <span>Saldo Total Disponible (ARS)</span>
              <span>{monthLabel}</span>
            </div>

            <div className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums">
              {formatARS(totalBalance)}
            </div>

            <p className="mt-1.5 text-xs text-white/80 tabular-nums">
              Balance neto del mes:{' '}
              <span className="font-bold text-white">
                {netOperatingBalance >= 0 ? '+' : ''}
                {formatARS(netOperatingBalance)}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/20">
            <button
              type="button"
              onClick={() => onOpenNewMovement('income')}
              className="bg-white/15 hover:bg-white/25 transition-colors rounded-2xl p-3.5 text-left cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-medium">
                <ArrowUpRight className="w-4 h-4 text-emerald-200" />
                <span>Ingresos del mes (+)</span>
              </div>
              <div className="mt-1 text-lg font-extrabold text-white tabular-nums">
                +{formatARS(monthlyIncome)}
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenNewMovement('expense')}
              className="bg-white/15 hover:bg-white/25 transition-colors rounded-2xl p-3.5 text-left cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center gap-1.5 text-xs text-rose-100 font-medium">
                <ArrowDownLeft className="w-4 h-4 text-rose-200" />
                <span>Egresos del mes (-)</span>
              </div>
              <div className="mt-1 text-lg font-extrabold text-white tabular-nums">
                -{formatARS(monthlyExpenses)}
              </div>
            </button>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-7">
          <DonutChart transactions={transactions} />
        </div>
      </div>

      {/* Cuentas & Billeteras */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Cuentas y Billeteras</h2>
          <span className="text-xs text-slate-500">Tocá una cuenta para editar su saldo</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => onEditAccountBalance(acc)}
              className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-200/70 hover:shadow-md transition-all text-left cursor-pointer group min-h-[44px]"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-full text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: acc.color || '#0EA5E9' }}
                >
                  {getAccountIcon(acc.icon)}
                </div>
                <Pencil className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <p className="text-xs font-bold text-slate-800 truncate">{acc.name}</p>
              <p className="text-sm font-extrabold text-slate-900 tabular-nums mt-0.5">
                {formatARS(safeNumber(acc.balance))}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Movimientos Recientes */}
      <section className="bg-white rounded-3xl p-5 shadow-sm shadow-slate-200/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Movimientos Recientes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'registro' : 'registros'} en {monthLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTxFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  txFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTxFilter('income')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  txFilter === 'income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ingresos (+)
              </button>
              <button
                type="button"
                onClick={() => setTxFilter('expense')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  txFilter === 'expense' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Egresos (-)
              </button>
            </div>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              No hay movimientos cargados todavía
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Todos tus saldos e importes arrancan en $0. Cargá un ingreso o egreso o escaneá una factura para comenzar.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenNewMovement('income')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
              >
                <Plus className="w-4 h-4" /> Cargar Ingreso (+)
              </button>
              <button
                type="button"
                onClick={() => onOpenNewMovement('expense')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
              >
                <Plus className="w-4 h-4" /> Cargar Egreso (-)
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const catInfo = CATEGORY_THEME[tx.costCenter] || CATEGORY_THEME.varios;
              const accountName = accounts.find((a) => a.id === tx.accountId)?.name || 'Cuenta';

              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 -mx-2 px-2 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <CategoryIcon category={tx.costCenter} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span>{catInfo.label}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.owner === 'mama' ? 'María Ester' : accountName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatDate(tx.date)}</span>
                      </div>
                    </div>
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
                      title="Eliminar movimiento"
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
