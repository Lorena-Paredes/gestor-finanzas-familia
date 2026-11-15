import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Award,
  Building2,
  Coins,
  DollarSign,
  Fuel,
  Landmark,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  FixedTermDeposit,
  InvestmentMovement,
  InvestmentPlatformItem,
  YieldRates,
} from '../types/finance';
import { formatARS, formatDate, formatUSD, getDaysDiff, safeNumber } from '../utils/formatters';

export function TabInversiones({
  investments,
  yieldRates,
  usdCashBalance,
  fixedTerms,
  investmentMovements,
  isFetchingDollar,
  onUpdateInvestment,
  onUpdateYieldRates,
  onUpdateUsdCash,
  onOpenBuyUsd,
  onOpenNewFixedTerm,
  onToggleFixedTermAutoRenew,
  onDeleteFixedTerm,
  onOpenGeminiScanner,
  onFetchDollar,
}: {
  investments: InvestmentPlatformItem[];
  yieldRates: YieldRates;
  usdCashBalance: number;
  fixedTerms: FixedTermDeposit[];
  investmentMovements: InvestmentMovement[];
  isFetchingDollar: boolean;
  onUpdateInvestment: (id: string, patch: Partial<InvestmentPlatformItem>) => void;
  onUpdateYieldRates: (patch: Partial<YieldRates>) => void;
  onUpdateUsdCash: (amount: number) => void;
  onOpenBuyUsd: () => void;
  onOpenNewFixedTerm: () => void;
  onToggleFixedTermAutoRenew: (id: string) => void;
  onDeleteFixedTerm: (id: string) => void;
  onOpenGeminiScanner: () => void;
  onFetchDollar: () => void;
}) {
  const [simCapital, setSimCapital] = useState<string>('');
  const [valuationMode, setValuationMode] = useState<'oficial' | 'blue'>(
    yieldRates.macroValuationCurrency || 'oficial'
  );

  const activeDollarRate = useMemo(() => {
    const rate =
      valuationMode === 'oficial'
        ? safeNumber(yieldRates.dolarOficial)
        : safeNumber(yieldRates.dolarBlue);
    return rate > 0 ? rate : 0;
  }, [valuationMode, yieldRates]);

  const enriched = useMemo(() => {
    const simVal = safeNumber(simCapital);

    return investments
      .map((item) => {
        const cap = safeNumber(item.capital);
        const tna = safeNumber(item.tna);
        const calcBase = simVal > 0 ? simVal : cap;
        const annual = calcBase * (tna / 100);
        const monthly = annual / 12;
        const daily = annual / 365;

        const actualAnnual = cap * (tna / 100);
        const actualMonthly = actualAnnual / 12;

        const effectiveRate = activeDollarRate > 0 ? activeDollarRate : 1;
        const capARS = item.currency === 'USD' ? cap * effectiveRate : cap;
        const monthlyARS =
          item.currency === 'USD' ? actualMonthly * effectiveRate : actualMonthly;

        return {
          ...item,
          calcBase,
          daily,
          monthly,
          annual,
          actualMonthly,
          capARS,
          monthlyARS,
        };
      })
      .sort((a, b) => b.tna - a.tna);
  }, [investments, simCapital, activeDollarRate]);

  const fixedTermTotals = useMemo(() => {
    const arsCapital = fixedTerms
      .filter((f) => f.currency === 'ARS')
      .reduce((s, f) => s + safeNumber(f.capital), 0);
    const arsInterest = fixedTerms
      .filter((f) => f.currency === 'ARS')
      .reduce((s, f) => s + safeNumber(f.interestAmount), 0);
    const usdCapital = fixedTerms
      .filter((f) => f.currency === 'USD')
      .reduce((s, f) => s + safeNumber(f.capital), 0);
    const usdInterest = fixedTerms
      .filter((f) => f.currency === 'USD')
      .reduce((s, f) => s + safeNumber(f.interestAmount), 0);

    const macroUsd = investments
      .filter((i) => i.currency === 'USD')
      .reduce((s, i) => s + safeNumber(i.capital), 0);

    const totalUSD = safeNumber(usdCashBalance) + usdCapital + macroUsd;
    return { arsCapital, arsInterest, usdCapital, usdInterest, totalUSD };
  }, [fixedTerms, usdCashBalance, investments]);

  const totals = useMemo(() => {
    const rate = activeDollarRate > 0 ? activeDollarRate : 0;
    const platformsARS = enriched.reduce((sum, i) => sum + i.capARS, 0);
    const totalCapARS =
      platformsARS +
      fixedTermTotals.arsCapital +
      (safeNumber(usdCashBalance) + fixedTermTotals.usdCapital) * rate;

    const platformsMonthlyARS = enriched.reduce((sum, i) => sum + i.monthlyARS, 0);
    const ftMonthlyARS = fixedTerms.reduce((sum, f) => {
      const mInterest =
        f.termDays > 0 ? (safeNumber(f.interestAmount) / f.termDays) * 30 : safeNumber(f.interestAmount);
      return sum + (f.currency === 'USD' ? mInterest * rate : mInterest);
    }, 0);

    const totalMonthlyARS = platformsMonthlyARS + ftMonthlyARS;
    const totalDailyARS = totalMonthlyARS / 30;
    const totalAnnualARS = totalMonthlyARS * 12;
    return { totalCapARS, totalMonthlyARS, totalDailyARS, totalAnnualARS };
  }, [enriched, fixedTermTotals, usdCashBalance, activeDollarRate, fixedTerms]);

  const bestTNA = useMemo(() => {
    const positive = enriched.filter((e) => safeNumber(e.tna) > 0 && e.currency === 'ARS');
    return positive.length > 0 ? positive[0] : null;
  }, [enriched]);

  const getPlatformIcon = (id: string) => {
    if (id.includes('mp')) return <Smartphone className="w-5 h-5" />;
    if (id.includes('ypf')) return <Fuel className="w-5 h-5" />;
    if (id.includes('pellegrini')) return <Landmark className="w-5 h-5" />;
    return <Building2 className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Summary Card + Dollar Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-600 p-6 text-white shadow-lg shadow-indigo-500/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-white/85 font-medium flex-wrap gap-2">
              <span>Patrimonio Invertido y Dólares</span>
              {bestTNA && (
                <span className="inline-flex items-center gap-1 font-bold text-amber-200">
                  <Award className="w-4 h-4" /> Mejor TNA: {bestTNA.name} ({bestTNA.tna}%)
                </span>
              )}
            </div>

            <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
              {formatARS(totals.totalCapARS)}
            </div>
            <p className="text-xs text-white/80 mt-1 tabular-nums">
              Incluye tenencia total de {formatUSD(fixedTermTotals.totalUSD)} valuada a{' '}
              {activeDollarRate > 0 ? `${formatARS(activeDollarRate)}/u$s` : '$0 (ingresá cotización)'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/20">
            <div>
              <span className="text-[11px] text-white/80 block">Rend. Diario</span>
              <span className="text-sm sm:text-base font-extrabold tabular-nums">
                +{formatARS(totals.totalDailyARS)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-white/80 block">Rend. Mensual</span>
              <span className="text-sm sm:text-base font-extrabold tabular-nums">
                +{formatARS(totals.totalMonthlyARS)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-white/80 block">Rend. Anual</span>
              <span className="text-sm sm:text-base font-extrabold tabular-nums">
                +{formatARS(totals.totalAnnualARS)}
              </span>
            </div>
          </div>
        </div>

        {/* Dólar Live & Manual Reference */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-sm shadow-slate-200/70 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Cotización Dólar</h2>
                <p className="text-xs text-slate-500">
                  {yieldRates.lastDollarFetch ? `Actualizado ${yieldRates.lastDollarFetch}` : 'Editable o en vivo'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onFetchDollar}
              disabled={isFetchingDollar}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer min-h-[40px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDollar ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-3">
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Dólar Oficial BNA ($)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={yieldRates.dolarOficial || ''}
                placeholder="0"
                onChange={(e) =>
                  onUpdateYieldRates({ dolarOficial: safeNumber(e.target.value) })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-50 rounded-2xl p-3">
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Dólar Blue ($)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={yieldRates.dolarBlue || ''}
                placeholder="0"
                onChange={(e) =>
                  onUpdateYieldRates({ dolarBlue: safeNumber(e.target.value) })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 font-medium">Valuar USD a:</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setValuationMode('oficial');
                  onUpdateYieldRates({ macroValuationCurrency: 'oficial' });
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                  valuationMode === 'oficial' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Oficial
              </button>
              <button
                type="button"
                onClick={() => {
                  setValuationMode('blue');
                  onUpdateYieldRates({ macroValuationCurrency: 'blue' });
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                  valuationMode === 'blue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Blue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* BILLETERA EN DÓLARES (USD) Y PLAZOS FIJOS (SCC MUTUAL CAÑADENSE) */}
      {/* ================================================================ */}
      <section className="bg-white rounded-3xl p-6 shadow-sm shadow-slate-200/70 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/25">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Billetera en Dólares (u$s) y Plazos Fijos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tenencia USD, compra de divisas y certificados en SCC Mutual Sport Club Cañadense u otras entidades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenBuyUsd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Comprar Dólares</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewFixedTerm}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Plazo Fijo</span>
            </button>
            <button
              type="button"
              onClick={onOpenGeminiScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Escanear Certificado</span>
            </button>
          </div>
        </div>

        {/* USD Wallet Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50/70 rounded-2xl p-4 space-y-1.5">
            <label className="text-xs font-bold text-emerald-900 block">
              Tenencia Líquida / Bancaria (u$s)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-emerald-700">u$s</span>
              <input
                type="number"
                min="0"
                step="any"
                value={usdCashBalance === 0 ? '' : usdCashBalance}
                placeholder="0"
                onChange={(e) => onUpdateUsdCash(Math.max(0, safeNumber(e.target.value)))}
                className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-base font-extrabold text-slate-900 tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-indigo-50/70 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-indigo-900">
              Plazos Fijos USD (Mutual y otros)
            </span>
            <div>
              <span className="text-xl font-extrabold text-indigo-700 tabular-nums block">
                {formatUSD(fixedTermTotals.usdCapital)}
              </span>
              <span className="text-[11px] text-indigo-600 tabular-nums">
                Estímulo proyectado: +{formatUSD(fixedTermTotals.usdInterest)}
              </span>
            </div>
          </div>

          <div className="bg-slate-100 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-700">
              Plazos Fijos en Pesos ($)
            </span>
            <div>
              <span className="text-xl font-extrabold text-slate-900 tabular-nums block">
                {formatARS(fixedTermTotals.arsCapital)}
              </span>
              <span className="text-[11px] text-slate-500 tabular-nums">
                Interés proyectado: +{formatARS(fixedTermTotals.arsInterest)}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Term Certificates List */}
        {fixedTerms.length === 0 ? (
          <div className="py-6 text-center bg-slate-50 rounded-2xl px-4">
            <p className="text-xs font-semibold text-slate-700">
              No hay certificados de Plazo Fijo cargados ($0 / u$s 0)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Cargá manualmente un certificado de SCC Mutual Sport Club Cañadense o escaneá el comprobante PDF/imagen con Gemini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fixedTerms.map((ft) => {
              const daysLeft = getDaysDiff(ft.maturityDate);
              const isNearMaturity = ft.maturityDate && daysLeft <= 7;
              const isUsd = ft.currency === 'USD';
              const fmt = isUsd ? formatUSD : formatARS;

              return (
                <div
                  key={ft.id}
                  className={`rounded-2xl p-4 border transition-all space-y-3 ${
                    isNearMaturity
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-slate-50/80 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">
                          {ft.entity}
                        </h3>
                        <span className="text-xs font-bold text-indigo-700">
                          {ft.currency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        Cert. {ft.certificateNumber || 'S/N'} · {ft.termDays} días · {ft.tna}% TNA
                        {ft.tem ? ` (${ft.tem}% TEM)` : ''}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteFixedTerm(ft.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar certificado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {isNearMaturity && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        {daysLeft < 0
                          ? `Venció hace ${Math.abs(daysLeft)} días`
                          : daysLeft === 0
                          ? 'Vence hoy'
                          : `Vence en ${daysLeft} días (${formatDate(ft.maturityDate)})`}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-500 block">Capital</span>
                      <span className="font-extrabold text-slate-900 tabular-nums">
                        {fmt(ft.capital)}
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-500 block">Estímulo / Interés</span>
                      <span className="font-extrabold text-emerald-600 tabular-nums">
                        +{fmt(ft.interestAmount)}
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-500 block">Total a Cobrar</span>
                      <span className="font-extrabold text-indigo-600 tabular-nums">
                        {fmt(ft.totalReturn)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 tabular-nums">
                      Const: {formatDate(ft.startDate)} · Vto: {formatDate(ft.maturityDate)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onToggleFixedTermAutoRenew(ft.id)}
                      className={`inline-flex items-center gap-1 font-bold cursor-pointer ${
                        ft.autoRenew ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{ft.autoRenew ? 'Renov. Automática' : 'Sin renov. auto'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent USD Purchases & Investment Movements */}
        {investmentMovements.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Compras de Dólares e Inversiones Registradas
            </h3>
            <div className="divide-y divide-slate-100">
              {investmentMovements.slice(0, 5).map((m) => (
                <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    {m.description} · {formatDate(m.date)}
                  </span>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {formatARS(m.amountARS)}
                    {m.amountUSD ? ` (${formatUSD(m.amountUSD)})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Norteapp-style Quick Simulator Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm shadow-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Comparador de Billeteras y Fondos (Estilo Norteapp)
            </h3>
            <p className="text-xs text-slate-500">
              Dejá en blanco para ver el rendimiento de tu capital real en cada plataforma, o ingresá un monto a simular.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              $
            </span>
            <input
              type="number"
              min="0"
              value={simCapital}
              onChange={(e) => setSimCapital(e.target.value)}
              placeholder="Simular monto..."
              className="w-44 bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:border-indigo-500"
            />
          </div>
          {simCapital && (
            <button
              type="button"
              onClick={() => setSimCapital('')}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Usar real
            </button>
          )}
        </div>
      </div>

      {/* Platform Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enriched.map((item, idx) => {
          const isLeader = idx === 0 && safeNumber(item.tna) > 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-5 shadow-sm shadow-slate-200/70 flex flex-col justify-between space-y-4 ${
                isLeader ? 'ring-2 ring-indigo-500/70' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-full text-white flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: item.accent }}
                  >
                    {getPlatformIcon(item.id)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {item.subtitle} · {item.liquidity}
                    </p>
                  </div>
                </div>

                {isLeader && (
                  <span className="text-xs font-bold text-indigo-600 shrink-0">
                    Mayor TNA
                  </span>
                )}
              </div>

              {/* Editable Capital & TNA Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Capital ({item.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.capital === 0 ? '' : item.capital}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdateInvestment(item.id, {
                        capital: Math.max(0, safeNumber(e.target.value)),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    TNA (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.tna === 0 ? '' : item.tna}
                    placeholder="0.0"
                    onChange={(e) =>
                      onUpdateInvestment(item.id, {
                        tna: Math.max(0, safeNumber(e.target.value)),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-indigo-600 tabular-nums focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Calculated Daily, Monthly, Annual Yields */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl py-2 px-1">
                  <span className="text-[10px] font-medium text-slate-500 block">Diario</span>
                  <span className="text-xs font-extrabold text-emerald-600 tabular-nums">
                    +{item.currency === 'USD' ? formatUSD(item.daily) : formatARS(item.daily)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl py-2 px-1">
                  <span className="text-[10px] font-medium text-slate-500 block">Mensual</span>
                  <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                    +{item.currency === 'USD' ? formatUSD(item.monthly) : formatARS(item.monthly)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl py-2 px-1">
                  <span className="text-[10px] font-medium text-slate-500 block">Anual</span>
                  <span className="text-xs font-extrabold text-indigo-600 tabular-nums">
                    +{item.currency === 'USD' ? formatUSD(item.annual) : formatARS(item.annual)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
