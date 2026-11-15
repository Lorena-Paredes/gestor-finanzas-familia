import React, { useState, useMemo } from 'react';
import { formatARS, safeNumber } from '../utils/formatters';
import { CATEGORY_THEME } from '../data/defaults';
import { Transaction } from '../types/finance';

interface DonutSlice {
  key: string;
  label: string;
  amount: number;
  color: string;
  percent: number;
}

export function DonutChart({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [mode, setMode] = useState<'expense' | 'income'>('expense');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const { slices, total } = useMemo(() => {
    const filtered = transactions.filter((t) => t.type === mode && safeNumber(t.amount) > 0);
    const map = new Map<string, number>();

    filtered.forEach((t) => {
      const cat = t.costCenter || 'varios';
      map.set(cat, (map.get(cat) || 0) + safeNumber(t.amount));
    });

    const sum = Array.from(map.values()).reduce((acc, v) => acc + v, 0);

    const built: DonutSlice[] = Array.from(map.entries())
      .map(([key, amount]) => {
        const theme = CATEGORY_THEME[key] || CATEGORY_THEME.varios;
        return {
          key,
          label: theme.label,
          amount,
          color: theme.color,
          percent: sum > 0 ? (amount / sum) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { slices: built, total: sum };
  }, [transactions, mode]);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  const activeSlice = slices.find((s) => s.key === hoveredKey) || null;

  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm shadow-slate-200/70">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Distribución por Categoría</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'expense' ? 'Egresos del período' : 'Ingresos del período'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode('expense');
              setHoveredKey(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'expense'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Egresos (-)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('income');
              setHoveredKey(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'income'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ingresos (+)
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="22"
            />
            {total > 0 &&
              slices.map((slice) => {
                const dashLength = (slice.percent / 100) * circumference;
                const dashOffset = -(cumulativePercent / 100) * circumference;
                cumulativePercent += slice.percent;
                const isHovered = hoveredKey === slice.key;

                return (
                  <circle
                    key={slice.key}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 26 : 22}
                    strokeDasharray={`${Math.max(0, dashLength - 1.5)} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="butt"
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredKey(slice.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onClick={() =>
                      setHoveredKey((prev) => (prev === slice.key ? null : slice.key))
                    }
                  />
                );
              })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            <span className="text-[11px] font-medium text-slate-500 truncate max-w-[100px]">
              {activeSlice
                ? activeSlice.label
                : mode === 'expense'
                ? 'Total Egresos'
                : 'Total Ingresos'}
            </span>
            <span className="text-base font-extrabold text-slate-900 tabular-nums mt-0.5">
              {formatARS(activeSlice ? activeSlice.amount : total)}
            </span>
            {activeSlice && (
              <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                {activeSlice.percent.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 w-full">
          {slices.length === 0 ? (
            <div className="py-6 text-center sm:text-left">
              <p className="text-sm font-semibold text-slate-700">
                Sin {mode === 'expense' ? 'egresos' : 'ingresos'} en $0
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Usá el botón + para registrar tu primer {mode === 'expense' ? 'gasto' : 'ingreso'} del mes y ver el gráfico por categoría.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {slices.map((slice) => (
                <button
                  key={slice.key}
                  type="button"
                  onMouseEnter={() => setHoveredKey(slice.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() =>
                    setHoveredKey((prev) => (prev === slice.key ? null : slice.key))
                  }
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-colors text-left cursor-pointer ${
                    hoveredKey === slice.key ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {slice.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                    <span className="text-xs font-bold text-slate-900">
                      {formatARS(slice.amount)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 w-10 text-right">
                      {slice.percent.toFixed(0)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
