import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  BookmarkCheck,
  Calculator,
  Camera,
  Check,
  CreditCard,
  DollarSign,
  FileText,
  FileUp,
  Landmark,
  Loader2,
  Mail,
  PieChart,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Account,
  Bill,
  BillGroup,
  CostCenterType,
  CreditCardAccount,
  FixedTermDeposit,
  GeminiExtractedData,
  IncomeSourceType,
  InvestmentMovement,
  InvestmentPlatformItem,
  MonthlyClosureSnapshot,
  PaymentMethodType,
  Transaction,
  YieldRates,
} from '../types/finance';
import { formatARS, formatDate, formatUSD, safeNumber } from '../utils/formatters';
import { analyzeDocumentWithGemini } from '../services/geminiService';

/* ========================================================================== */
/* 1. MOVEMENT MODAL (EXPLICIT INGRESO + vs EGRESO -)                         */
/* ========================================================================== */
export function MovementModal({
  accounts,
  mamaAccounts,
  initialType = 'expense',
  initialCostCenter = 'hogar',
  initialOwner = 'personal',
  onClose,
  onSave,
}: {
  accounts: Account[];
  mamaAccounts: Account[];
  initialType?: 'income' | 'expense';
  initialCostCenter?: CostCenterType;
  initialOwner?: 'personal' | 'mama';
  onClose: () => void;
  onSave: (tx: Transaction) => void;
}) {
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [owner, setOwner] = useState<'personal' | 'mama'>(initialOwner);
  const [costCenter, setCostCenter] = useState<CostCenterType>(
    initialOwner === 'mama' ? 'mama' : initialCostCenter
  );
  const [accountId, setAccountId] = useState<string>(
    initialOwner === 'mama'
      ? mamaAccounts[0]?.id || 'mama_bsf'
      : accounts[0]?.id || 'banco_santa_fe'
  );
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeSource, setIncomeSource] = useState<IncomeSourceType>('otros');

  const activeAccounts = owner === 'mama' ? mamaAccounts : accounts;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Math.max(0, safeNumber(amount));
    if (!description.trim()) return;

    const tx: Transaction = {
      id: 'tx_' + Date.now(),
      date: date || new Date().toISOString().split('T')[0],
      description: description.trim(),
      amount: numericAmount,
      type,
      accountId,
      costCenter: owner === 'mama' ? 'mama' : costCenter,
      incomeSource: type === 'income' ? incomeSource : undefined,
      owner,
    };
    onSave(tx);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">
            Cargar Movimiento
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EXPLICIT MOVEMENT TYPE SELECTOR: INGRESO (+) vs EGRESO (-) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Ingreso (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Egreso (-)</span>
            </button>
          </div>

          {/* Ownership Toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setOwner('personal');
                setAccountId(accounts[0]?.id || 'banco_santa_fe');
                if (costCenter === 'mama') setCostCenter('hogar');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                owner === 'personal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Propia / Campo / Familia
            </button>
            <button
              type="button"
              onClick={() => {
                setOwner('mama');
                setCostCenter('mama');
                setAccountId(mamaAccounts[0]?.id || 'mama_bsf');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                owner === 'mama'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              María Ester (Iaia)
            </button>
          </div>

          {/* Quick Presets for Campo / Cereales Income */}
          {type === 'income' && owner === 'personal' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCostCenter('campo');
                  setIncomeSource('alquiler_campo');
                  setDescription('Renta de Campo (Arrendamiento)');
                  if (accounts.some((a) => a.id === 'banco_santa_fe')) {
                    setAccountId('banco_santa_fe');
                  }
                }}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-left transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-emerald-800 block">
                  Renta de Campo (+)
                </span>
                <span className="text-[11px] text-emerald-600">Banco Santa Fe</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCostCenter('campo');
                  setIncomeSource('comisiones_scilingo');
                  setDescription('Liquidación Cereales Scilingo Hnos.');
                  if (accounts.some((a) => a.id === 'banco_macro')) {
                    setAccountId('banco_macro');
                  }
                }}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-left transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-emerald-800 block">
                  Scilingo Cereales (+)
                </span>
                <span className="text-[11px] text-emerald-600">Banco Macro</span>
              </button>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Importe en ARS ($)
            </label>
            <div className="relative">
              <span
                className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-extrabold ${
                  type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {type === 'income' ? '+$' : '-$'}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-xl font-extrabold text-slate-900 tabular-nums focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Descripción / Concepto
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'income'
                  ? 'Ej: Renta Campo, Liquidación cereal, Jubilación...'
                  : 'Ej: Café, Alimento gallinas, Supermercado, EPE...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-3">
            {owner === 'personal' ? (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Categoría
                </label>
                <select
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value as CostCenterType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900"
                >
                  <option value="campo">Campo y Cereales</option>
                  <option value="hogar">Personal y Fijos</option>
                  <option value="renato">Renato</option>
                  <option value="tarjetas">Tarjetas y Bancos</option>
                  <option value="movilidad">Movilidad / Ford</option>
                  <option value="almacen">Supermercado</option>
                  <option value="lorena">Lorena</option>
                  <option value="varios">Varios</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Categoría
                </label>
                <div className="bg-teal-50 rounded-xl px-3 py-2.5 text-xs font-bold text-teal-700">
                  María Ester (Iaia)
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 tabular-nums"
              />
            </div>
          </div>

          {/* Account */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              {type === 'income' ? 'Acreditar en cuenta' : 'Descontar de cuenta'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900"
            >
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatARS(a.balance)})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md transition-colors cursor-pointer min-h-[48px] ${
              type === 'income'
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
            }`}
          >
            Guardar {type === 'income' ? 'Ingreso (+)' : 'Egreso (-)'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 2. SMART GEMINI SCANNER MODAL (PDF, CAPTURA, CAMARA O TEXTO DE MAIL)       */
/* ========================================================================== */
export function SmartScannerModal({
  accounts,
  mamaAccounts,
  creditCards,
  initialMode = 'file',
  contextHint = '',
  onClose,
  onSaveAsTransaction,
  onSaveAsBill,
  onSaveToCreditCard,
  onSaveToFixedTerm,
}: {
  accounts: Account[];
  mamaAccounts: Account[];
  creditCards: CreditCardAccount[];
  initialMode?: 'file' | 'text';
  contextHint?: string;
  onClose: () => void;
  onSaveAsTransaction: (tx: Transaction) => void;
  onSaveAsBill: (bill: Bill) => void;
  onSaveToCreditCard: (cardId: string, data: GeminiExtractedData) => void;
  onSaveToFixedTerm: (ft: FixedTermDeposit) => void;
}) {
  const [inputMode, setInputMode] = useState<'file' | 'text'>(initialMode);
  const [rawText, setRawText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<GeminiExtractedData | null>(null);
  const [targetAccountId, setTargetAccountId] = useState<string>(
    accounts[0]?.id || 'banco_macro'
  );
  const [targetCardId, setTargetCardId] = useState<string>(
    creditCards[0]?.id || ''
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const runAnalysis = async (payload: {
    fileBase64?: string;
    mimeType?: string;
    rawText?: string;
  }) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const parsed = await analyzeDocumentWithGemini({
        ...payload,
        contextHint,
      });
      setResult(parsed);

      if (parsed.ownership === 'maria_ester') {
        setTargetAccountId(mamaAccounts[0]?.id || 'mama_bsf');
      }
      if (parsed.cardName && creditCards.length > 0) {
        const lowerCard = parsed.cardName.toLowerCase();
        const found = creditCards.find(
          (c) =>
            c.name.toLowerCase().includes(lowerCard) ||
            lowerCard.includes(c.name.toLowerCase()) ||
            c.bank.toLowerCase().includes(lowerCard)
        );
        if (found) setTargetCardId(found.id);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error conectando con Gemini.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      runAnalysis({
        fileBase64: base64,
        mimeType: file.type || 'application/pdf',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleTextAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    runAnalysis({ rawText });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Lector Inteligente con Gemini
              </h3>
              <p className="text-xs text-slate-500">
                PDF, captura de pantalla, foto o texto de mail
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {!result && !isAnalyzing && (
          <div className="space-y-4">
            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  inputMode === 'file'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" /> PDF / Foto / Captura
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  inputMode === 'text'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Pegar Texto de Mail
              </button>
            </div>

            {inputMode === 'file' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
                >
                  <FileText className="w-7 h-7 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800">
                    Subir PDF o Captura
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Boletas EPE, Agua, Starlink, Resúmenes
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
                >
                  <Camera className="w-7 h-7 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">
                    Tomar Foto de Ticket
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Cámara directa en celular
                  </span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleTextAnalyze} className="space-y-3">
                <textarea
                  rows={6}
                  required
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Pegá acá el texto completo del correo de EPE, Aguas Santafesinas, Litoral Gas, Telecom, Starlink, ARCA/Monotributo o aviso bancario..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold cursor-pointer min-h-[44px]"
                >
                  Analizar Texto con Gemini
                </button>
              </form>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {isAnalyzing && (
          <div className="py-10 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-900">
              Analizando {selectedFileName || 'documento'} con Gemini...
            </p>
            <p className="text-xs text-slate-500">
              Detectando proveedor, importe, vencimiento, titularidad y tipo (+/-)
            </p>
          </div>
        )}

        {result && !isAnalyzing && (
          <div className="space-y-4">
            {/* Movement Sign + Ownership */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResult({ ...result, movementType: 'income' })}
                className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  result.movementType === 'income'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Ingreso (+)
              </button>
              <button
                type="button"
                onClick={() => setResult({ ...result, movementType: 'expense' })}
                className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  result.movementType === 'expense'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Egreso (-)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResult({ ...result, ownership: 'propia' })}
                className={`py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  result.ownership === 'propia'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Titularidad: Propia
              </button>
              <button
                type="button"
                onClick={() =>
                  setResult({ ...result, ownership: 'maria_ester', category: 'mama' })
                }
                className={`py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  result.ownership === 'maria_ester'
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Titularidad: María Ester
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={result.provider}
                  onChange={(e) => setResult({ ...result, provider: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  value={result.title}
                  onChange={(e) => setResult({ ...result, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Importe ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={result.amount}
                  onChange={(e) =>
                    setResult({ ...result, amount: safeNumber(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Fecha / Vencimiento
                </label>
                <input
                  type="date"
                  value={result.dueDate || ''}
                  onChange={(e) => setResult({ ...result, dueDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Categoría
                </label>
                <select
                  value={result.category}
                  onChange={(e) =>
                    setResult({
                      ...result,
                      category: e.target.value as GeminiExtractedData['category'],
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="hogar">Hogar y Fijos</option>
                  <option value="campo">Campo y Cereales</option>
                  <option value="mama">María Ester (Iaia)</option>
                  <option value="tarjetas">Tarjetas</option>
                  <option value="renato">Renato</option>
                  <option value="movilidad">Movilidad / Ford</option>
                  <option value="lorena">Lorena</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Cuenta asociada
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  {(result.ownership === 'maria_ester' ? mamaAccounts : accounts).map(
                    (a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {result.lineItems && result.lineItems.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5 max-h-36 overflow-y-auto">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Consumos / Ítems detectados ({result.lineItems.length})
                </span>
                {result.lineItems.map((li, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs text-slate-700"
                  >
                    <span className="truncate pr-2">
                      {li.description}
                      {li.installments ? ` (${li.installments})` : ''}
                    </span>
                    <span className="font-bold tabular-nums shrink-0">
                      {formatARS(li.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Auto-routing Banner: Credit Card Statement */}
            {result.documentKind === 'credit_card_statement' &&
              creditCards.length > 0 && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-sky-900">
                    <CreditCard className="w-4 h-4 text-sky-600" />
                    <span>Resumen de Tarjeta Detectado — Enrutamiento Directo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={targetCardId}
                      onChange={(e) => setTargetCardId(e.target.value)}
                      className="flex-1 bg-white border border-sky-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900"
                    >
                      {creditCards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.bank})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onSaveToCreditCard(targetCardId, result)}
                      className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap min-h-[42px]"
                    >
                      Guardar en Tarjetas y Resúmenes
                    </button>
                  </div>
                </div>
              )}

            {/* Auto-routing Banner: Fixed-Term Certificate (SCC Mutual / Banks) */}
            {(result.documentKind === 'fixed_term_certificate' ||
              Boolean(result.fixedTermData?.capital)) && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900">
                    <Landmark className="w-4 h-4 text-indigo-600" />
                    <span>Certificado de Plazo Fijo Detectado</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-700">
                    {(result.fixedTermData?.currency || 'USD').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white rounded-xl p-2">
                    <span className="text-[10px] text-slate-500 block">Entidad</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {result.fixedTermData?.entity || result.provider}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-2">
                    <span className="text-[10px] text-slate-500 block">Capital</span>
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      {(result.fixedTermData?.currency || '').toUpperCase() === 'USD'
                        ? formatUSD(safeNumber(result.fixedTermData?.capital || result.amount))
                        : formatARS(safeNumber(result.fixedTermData?.capital || result.amount))}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-2">
                    <span className="text-[10px] text-slate-500 block">Estímulo / Interés</span>
                    <span className="font-extrabold text-emerald-600 tabular-nums">
                      +
                      {(result.fixedTermData?.currency || '').toUpperCase() === 'USD'
                        ? formatUSD(safeNumber(result.fixedTermData?.interestAmount))
                        : formatARS(safeNumber(result.fixedTermData?.interestAmount))}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-2">
                    <span className="text-[10px] text-slate-500 block">Plazo / TNA</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {safeNumber(result.fixedTermData?.termDays) || 30} días · {safeNumber(result.fixedTermData?.tna)}%
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-2 col-span-2">
                    <span className="text-[10px] text-slate-500 block">Constitución / Vencimiento</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatDate(result.fixedTermData?.startDate || '') || '-'} →{' '}
                      {formatDate(result.fixedTermData?.maturityDate || result.dueDate) || '-'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const ft = result.fixedTermData || {};
                    const curr: 'ARS' | 'USD' =
                      String(ft.currency || '').toUpperCase() === 'ARS' ? 'ARS' : 'USD';
                    const cap = Math.max(0, safeNumber(ft.capital || result.amount));
                    const termDays = Math.max(1, safeNumber(ft.termDays) || 30);
                    const tna = Math.max(0, safeNumber(ft.tna));
                    const computedInterest =
                      safeNumber(ft.interestAmount) > 0
                        ? safeNumber(ft.interestAmount)
                        : Number(((cap * (tna / 100) * termDays) / 365).toFixed(2));
                    const totalReturn =
                      safeNumber(ft.totalReturn) > 0
                        ? safeNumber(ft.totalReturn)
                        : Number((cap + computedInterest).toFixed(2));
                    const today = new Date().toISOString().split('T')[0];

                    onSaveToFixedTerm({
                      id: 'ft_ai_' + Date.now(),
                      entity:
                        ft.entity ||
                        result.provider ||
                        'SCC Mutual Sport Club Cañadense',
                      currency: curr,
                      certificateNumber: ft.certificateNumber || '',
                      capital: cap,
                      termDays,
                      startDate: ft.startDate || today,
                      maturityDate: ft.maturityDate || result.dueDate || today,
                      tna,
                      interestAmount: computedInterest,
                      totalReturn,
                      autoRenew: false,
                      notes: result.notes,
                    });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Cargar en Plazos Fijos (Inversiones)</span>
                </button>
              </div>
            )}

            {/* Save Actions */}
            <div className="space-y-2 pt-2">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSaveAsBill({
                      id: 'b_ai_' + Date.now(),
                      title: result.title || result.provider,
                      provider: result.provider,
                      amount: safeNumber(result.amount),
                      dueDate:
                        result.dueDate || new Date().toISOString().split('T')[0],
                      dueDay: parseInt(
                        (result.dueDate || '').split('-')[2] || '10',
                        10
                      ),
                      group:
                        result.ownership === 'maria_ester'
                          ? 'mama'
                          : (result.category as BillGroup),
                      paymentMethod: result.paymentMethod || 'pago_manual',
                      paymentMethodDetail:
                        result.paymentMethodDetail || 'Pago Manual',
                      status: 'pending',
                      notes: result.notes,
                    });
                  }}
                  className="py-3 px-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <Check className="w-4 h-4" /> Agendar Vencimiento
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSaveAsTransaction({
                      id: 'tx_ai_' + Date.now(),
                      date:
                        result.dueDate || new Date().toISOString().split('T')[0],
                      description: `${result.title} (${result.provider})`,
                      amount: Math.max(0, safeNumber(result.amount)),
                      type: result.movementType,
                      accountId: targetAccountId,
                      costCenter:
                        result.ownership === 'maria_ester'
                          ? 'mama'
                          : (result.category as CostCenterType),
                      owner:
                        result.ownership === 'maria_ester' ? 'mama' : 'personal',
                    });
                  }}
                  className={`py-3 px-4 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                    result.movementType === 'income'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-rose-500 hover:bg-rose-600'
                  }`}
                >
                  <Check className="w-4 h-4" /> Registrar{' '}
                  {result.movementType === 'income' ? 'Ingreso (+)' : 'Egreso (-)'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setResult(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Analizar otro comprobante
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 3. RESET TO ZERO CONFIRMATION MODAL                                        */
/* ========================================================================== */
export function ResetZeroConfirmModal({
  monthLabel,
  onClose,
  onConfirm,
}: {
  monthLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
          <RotateCcw className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-slate-900">
            ¿Poner todo en cero?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Esta acción reiniciará a <strong>$0</strong> todos los saldos bancarios, billeteras, inversiones, consumos de tarjetas, servicios e impuestos de <strong>{monthLabel}</strong> y eliminará los movimientos cargados (sincronizando el estado limpio en Firebase).
          </p>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer min-h-[44px]"
          >
            Sí, reiniciar todo a $0
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer min-h-[44px]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 4. EDIT ACCOUNT BALANCE MODAL                                              */
/* ========================================================================== */
export function AccountBalanceModal({
  account,
  onClose,
  onSave,
}: {
  account: Account;
  onClose: () => void;
  onSave: (accountId: string, newBalance: number) => void;
}) {
  const [val, setVal] = useState(
    account.balance === 0 ? '0' : String(account.balance)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">
            Saldo de {account.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(account.id, Math.max(0, safeNumber(val)));
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Saldo actual ($)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xl font-extrabold text-slate-900 tabular-nums focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer min-h-[44px]"
          >
            Guardar Saldo
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 5. BILL FORM MODAL & PAY BILL MODAL                                        */
/* ========================================================================== */
export function BillFormModal({
  defaultGroup,
  onClose,
  onSave,
}: {
  defaultGroup: BillGroup;
  onClose: () => void;
  onSave: (bill: Bill) => void;
}) {
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [group, setGroup] = useState<BillGroup>(defaultGroup);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>('pago_manual');
  const [paymentMethodDetail, setPaymentMethodDetail] = useState('Pago Manual');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">
            Nuevo Servicio / Impuesto
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            onSave({
              id: 'b_' + Date.now(),
              title: title.trim(),
              provider: provider.trim() || title.trim(),
              amount: Math.max(0, safeNumber(amount)),
              dueDate,
              dueDay: parseInt((dueDate || '').split('-')[2] || '10', 10),
              group,
              paymentMethod,
              paymentMethodDetail: paymentMethodDetail.trim() || 'Manual',
              status: 'pending',
            });
          }}
          className="space-y-3"
        >
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as BillGroup)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900"
          >
            <option value="campo">Campo y Cereales</option>
            <option value="mama">María Ester (Iaia)</option>
            <option value="movilidad">Movilidad y Plan Ovalo Ford</option>
            <option value="renato">Renato</option>
            <option value="hogar">Hogar y Salud</option>
            <option value="tarjetas">Suscripciones (Netflix / YouTube)</option>
            <option value="lorena">Lorena</option>
          </select>

          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre del servicio (ej: EPE, Starlink, Plan Ovalo)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
          />

          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="Proveedor (opcional)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Importe ($0)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 tabular-nums"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 tabular-nums"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethodType)
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900"
            >
              <option value="pago_manual">Pago Manual</option>
              <option value="debito_cuenta">Débito en Cuenta</option>
              <option value="debito_tarjeta">Débito en Tarjeta</option>
            </select>
            <input
              type="text"
              value={paymentMethodDetail}
              onChange={(e) => setPaymentMethodDetail(e.target.value)}
              placeholder="Banco / Medio"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer min-h-[44px]"
          >
            Guardar Servicio
          </button>
        </form>
      </div>
    </div>
  );
}

export function PayBillModal({
  bill,
  accounts,
  onClose,
  onConfirm,
}: {
  bill: Bill;
  accounts: Account[];
  onClose: () => void;
  onConfirm: (amount: number, accountId: string) => void;
}) {
  const [amount, setAmount] = useState(
    safeNumber(bill.amount) > 0 ? String(bill.amount) : ''
  );
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">
            Pagar {bill.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(Math.max(0, safeNumber(amount)), accountId);
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Importe abonado ($)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xl font-extrabold text-slate-900 tabular-nums"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Descontar de cuenta
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatARS(a.balance)})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer min-h-[44px]"
          >
            Confirmar Pago (-)
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 6. RESUMEN PATRIMONIAL CONSOLIDADO MODAL (MIS PESOS, DÓLARES, INVERSIONES) */
/* ========================================================================== */
export function PatrimonySummaryModal({
  accounts,
  mamaAccounts,
  investments,
  fixedTerms,
  usdCashBalance,
  yieldRates,
  onClose,
}: {
  accounts: Account[];
  mamaAccounts: Account[];
  investments: InvestmentPlatformItem[];
  fixedTerms: FixedTermDeposit[];
  usdCashBalance: number;
  yieldRates: YieldRates;
  onClose: () => void;
}) {
  const defaultRate =
    safeNumber(yieldRates.dolarOficial) > 0
      ? safeNumber(yieldRates.dolarOficial)
      : safeNumber(yieldRates.dolarBlue);
  const [exchangeRate, setExchangeRate] = useState<string>(
    defaultRate > 0 ? String(defaultRate) : ''
  );

  const numericRate = Math.max(0, safeNumber(exchangeRate));

  const summary = useMemo(() => {
    const accountsARS = accounts.reduce((s, a) => s + safeNumber(a.balance), 0);
    const arsFunds = investments.filter((i) => i.currency === 'ARS');
    const arsFundsCapital = arsFunds.reduce((s, i) => s + safeNumber(i.capital), 0);
    const arsFundsGainMonth = arsFunds.reduce(
      (s, i) => s + (safeNumber(i.capital) * (safeNumber(i.tna) / 100)) / 12,
      0
    );

    const arsFixedTerms = fixedTerms.filter((f) => f.currency === 'ARS');
    const arsFTCapital = arsFixedTerms.reduce((s, f) => s + safeNumber(f.capital), 0);
    const arsFTGain = arsFixedTerms.reduce((s, f) => s + safeNumber(f.interestAmount), 0);

    const totalARS = accountsARS + arsFundsCapital + arsFTCapital;

    const usdFunds = investments.filter((i) => i.currency === 'USD');
    const usdFundsCapital = usdFunds.reduce((s, i) => s + safeNumber(i.capital), 0);
    const usdFixedTerms = fixedTerms.filter((f) => f.currency === 'USD');
    const usdFTCapital = usdFixedTerms.reduce((s, f) => s + safeNumber(f.capital), 0);
    const usdFTGain = usdFixedTerms.reduce((s, f) => s + safeNumber(f.interestAmount), 0);

    const totalUSD = safeNumber(usdCashBalance) + usdFundsCapital + usdFTCapital;
    const usdInARS = totalUSD * numericRate;
    const grandTotalARS = totalARS + usdInARS;
    const mamaTotalARS = mamaAccounts.reduce((s, a) => s + safeNumber(a.balance), 0);

    return {
      accountsARS,
      arsFunds,
      arsFundsCapital,
      arsFundsGainMonth,
      arsFixedTerms,
      arsFTCapital,
      arsFTGain,
      totalARS,
      usdFunds,
      usdFundsCapital,
      usdFixedTerms,
      usdFTCapital,
      usdFTGain,
      totalUSD,
      usdInARS,
      grandTotalARS,
      mamaTotalARS,
    };
  }, [accounts, mamaAccounts, investments, fixedTerms, usdCashBalance, numericRate]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Resumen General · Mi Patrimonio
              </h3>
              <p className="text-xs text-slate-500">
                Consolidado en tiempo real de Pesos ($), Dólares (u$s) e Inversiones Activas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grand Total Hero + Editable Exchange Rate */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-indigo-200 font-medium block">
              Gran Total Consolidado (Pesos + Dólares valuados)
            </span>
            <span className="text-3xl font-extrabold tracking-tight tabular-nums mt-1 block">
              {formatARS(summary.grandTotalARS)}
            </span>
            <p className="text-xs text-indigo-200 mt-1 tabular-nums">
              {formatARS(summary.totalARS)} en ARS + {formatUSD(summary.totalUSD)} ({formatARS(summary.usdInARS)})
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 sm:w-52 shrink-0">
            <label className="text-[11px] font-semibold text-indigo-100 block mb-1">
              Tipo de Cambio ($/u$s)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder="Ej: 1200"
              className="w-full bg-white text-slate-900 rounded-xl px-3 py-2 text-sm font-extrabold tabular-nums focus:outline-none"
            />
          </div>
        </div>

        {/* Three Clear Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Block 1: Mis Pesos ($) */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-sm font-extrabold text-slate-900">
                1. Mis Pesos ($)
              </span>
              <span className="text-base font-extrabold text-sky-600 tabular-nums">
                {formatARS(summary.totalARS)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between">
                  <span className="text-slate-600 truncate pr-2">{acc.name}</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatARS(acc.balance)}
                  </span>
                </div>
              ))}
              {summary.arsFundsCapital > 0 && (
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70">
                  <span className="text-indigo-700 font-semibold">
                    Fondos y Billeteras Remuneradas (ARS)
                  </span>
                  <span className="font-bold text-indigo-700 tabular-nums">
                    {formatARS(summary.arsFundsCapital)}
                  </span>
                </div>
              )}
              {summary.arsFTCapital > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-indigo-700 font-semibold">
                    Plazos Fijos en Pesos
                  </span>
                  <span className="font-bold text-indigo-700 tabular-nums">
                    {formatARS(summary.arsFTCapital)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-teal-700">
              <span className="font-semibold">
                Referencia cuentas María Ester (Iaia, aparte)
              </span>
              <span className="font-bold tabular-nums">
                {formatARS(summary.mamaTotalARS)}
              </span>
            </div>
          </div>

          {/* Block 2: Mis Dólares (u$s) */}
          <div className="bg-emerald-50/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
              <span className="text-sm font-extrabold text-emerald-950">
                2. Mis Dólares (u$s)
              </span>
              <span className="text-base font-extrabold text-emerald-700 tabular-nums">
                {formatUSD(summary.totalUSD)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Tenencia líquida / bancaria USD</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatUSD(usdCashBalance)}
                </span>
              </div>

              {summary.usdFunds.map((f) => (
                <div key={f.id} className="flex items-center justify-between">
                  <span className="text-slate-700">{f.name}</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatUSD(f.capital)}
                  </span>
                </div>
              ))}

              {summary.usdFixedTerms.length === 0 ? (
                <div className="flex items-center justify-between text-slate-500">
                  <span>Plazos Fijos USD (SCC Mutual y otros)</span>
                  <span className="font-bold tabular-nums">{formatUSD(0)}</span>
                </div>
              ) : (
                summary.usdFixedTerms.map((ft) => (
                  <div key={ft.id} className="flex items-center justify-between">
                    <span className="text-indigo-800 font-semibold truncate pr-2">
                      PF {ft.entity} {ft.certificateNumber ? `(${ft.certificateNumber})` : ''}
                    </span>
                    <span className="font-bold text-indigo-800 tabular-nums shrink-0">
                      {formatUSD(ft.capital)}
                    </span>
                  </div>
                ))
              )}

              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-semibold">
                  Valuación en Pesos ({numericRate > 0 ? `$${numericRate}` : '$0'})
                </span>
                <span className="font-extrabold text-emerald-800 tabular-nums">
                  {formatARS(summary.usdInARS)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Block 3: Mis Inversiones Activas */}
        <div className="bg-indigo-50/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
            <span className="text-sm font-extrabold text-indigo-950">
              3. Mis Inversiones Activas (Capital y Ganancia Proyectada)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Fondos (Pellegrini / Macro / Billeteras)
              </span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums block">
                {formatARS(summary.arsFundsCapital)}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 tabular-nums">
                Ganancia mensual est.: +{formatARS(summary.arsFundsGainMonth)}
              </span>
            </div>

            <div className="bg-white rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Plazos Fijos en Pesos ({summary.arsFixedTerms.length})
              </span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums block">
                {formatARS(summary.arsFTCapital)}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 tabular-nums">
                Interés proyectado: +{formatARS(summary.arsFTGain)}
              </span>
            </div>

            <div className="bg-white rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Plazos Fijos USD Mutual ({summary.usdFixedTerms.length})
              </span>
              <span className="text-sm font-extrabold text-indigo-700 tabular-nums block">
                {formatUSD(summary.usdFTCapital)}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 tabular-nums">
                Estímulo proyectado: +{formatUSD(summary.usdFTGain)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 7. CORTE / CIERRE DE FIN DE MES MODAL                                      */
/* ========================================================================== */
export function MonthlyClosingModal({
  monthKey,
  monthLabel,
  monthlyIncome,
  monthlyExpenses,
  estimatedFinancialGains,
  investmentMovements,
  totalARS,
  totalUSD,
  defaultExchangeRate,
  closures,
  onSaveClosure,
  onDeleteClosure,
  onClose,
}: {
  monthKey: string;
  monthLabel: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  estimatedFinancialGains: number;
  investmentMovements: InvestmentMovement[];
  totalARS: number;
  totalUSD: number;
  defaultExchangeRate: number;
  closures: MonthlyClosureSnapshot[];
  onSaveClosure: (snapshot: MonthlyClosureSnapshot) => void;
  onDeleteClosure: (id: string) => void;
  onClose: () => void;
}) {
  const [gainsInput, setGainsInput] = useState<string>(
    estimatedFinancialGains > 0 ? String(Math.round(estimatedFinancialGains)) : '0'
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const financialGains = Math.max(0, safeNumber(gainsInput));
  const monthInvestmentOutflows = useMemo(
    () =>
      investmentMovements
        .filter((m) => m.monthKey === monthKey || (m.date || '').startsWith(monthKey))
        .reduce((s, m) => s + safeNumber(m.amountARS), 0),
    [investmentMovements, monthKey]
  );

  const capacityToInvest =
    monthlyIncome + financialGains - monthlyExpenses - monthInvestmentOutflows;
  const hasFreeMargin = capacityToInvest > 0;

  const handleSaveSnapshot = () => {
    const snapshot: MonthlyClosureSnapshot = {
      id: 'cls_' + Date.now(),
      monthKey,
      monthLabel,
      savedAt: new Date().toISOString().split('T')[0],
      totalIncome: monthlyIncome,
      totalExpenses: monthlyExpenses,
      financialGains,
      investmentOutflows: monthInvestmentOutflows,
      capacityToInvest,
      totalARS,
      totalUSD,
      exchangeRateUsed: defaultExchangeRate,
    };
    onSaveClosure(snapshot);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Corte / Cierre del Mes · {monthLabel}
              </h3>
              <p className="text-xs text-slate-500">
                Informe automático de capacidad de inversión e historial mensual
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Breakdown Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-emerald-50/70 rounded-2xl p-4">
            <span className="text-xs font-semibold text-emerald-800 block">
              Ingresos Totales del Mes (+)
            </span>
            <span className="text-xl font-extrabold text-emerald-700 tabular-nums">
              +{formatARS(monthlyIncome)}
            </span>
          </div>

          <div className="bg-rose-50/70 rounded-2xl p-4">
            <span className="text-xs font-semibold text-rose-800 block">
              Egresos Totales del Mes (-)
            </span>
            <span className="text-xl font-extrabold text-rose-700 tabular-nums">
              -{formatARS(monthlyExpenses)}
            </span>
          </div>

          <div className="bg-indigo-50/70 rounded-2xl p-4 space-y-1.5">
            <label className="text-xs font-semibold text-indigo-900 block">
              Ganancias / Rendimientos Financieros (+)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-indigo-700">+$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={gainsInput}
                onChange={(e) => setGainsInput(e.target.value)}
                className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-base font-extrabold text-indigo-700 tabular-nums focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-100 rounded-2xl p-4">
            <span className="text-xs font-semibold text-slate-700 block">
              Movimiento Inversiones / Compra USD
            </span>
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              -{formatARS(monthInvestmentOutflows)}
            </span>
          </div>
        </div>

        {/* Saldo Neto / Capacidad de Inversión */}
        <div
          className={`rounded-2xl p-5 border space-y-1.5 ${
            hasFreeMargin
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Saldo Neto / Capacidad de Inversión
            </span>
            <span
              className={`text-2xl font-extrabold tabular-nums ${
                hasFreeMargin ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {capacityToInvest >= 0 ? '+' : ''}
              {formatARS(capacityToInvest)}
            </span>
          </div>
          <p className="text-sm font-bold">
            {hasFreeMargin
              ? `Te quedan ${formatARS(capacityToInvest)} disponibles para seguir invirtiendo`
              : 'Este mes no queda saldo libre adicional'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSnapshot}
          className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
        >
          <BookmarkCheck className="w-4 h-4 text-emerald-400" />
          <span>
            {savedNotice
              ? 'Foto del cierre guardada en el historial'
              : `Guardar foto del cierre (${monthLabel})`}
          </span>
        </button>

        {/* Monthly Closure History */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Historial de Cierres Mensuales ({closures.length})
          </h4>
          {closures.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              Todavía no guardaste fotos de cierre. Guardá el cierre de {monthLabel} para comparar con próximos meses.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {closures.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-50 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900">
                      {c.monthLabel}{' '}
                      <span className="font-normal text-slate-500">
                        (guardado {formatDate(c.savedAt)})
                      </span>
                    </p>
                    <p className="text-slate-600 tabular-nums mt-0.5">
                      Ing +{formatARS(c.totalIncome)} · Egr -{formatARS(c.totalExpenses)} · Gan +{formatARS(c.financialGains)} · Inv -{formatARS(c.investmentOutflows)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-extrabold tabular-nums ${
                        c.capacityToInvest > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {c.capacityToInvest >= 0 ? '+' : ''}
                      {formatARS(c.capacityToInvest)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteClosure(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 8. COMPRAR DÓLARES MODAL                                                   */
/* ========================================================================== */
export function BuyUsdModal({
  accounts,
  defaultRate,
  onClose,
  onConfirm,
}: {
  accounts: Account[];
  defaultRate: number;
  onClose: () => void;
  onConfirm: (opts: {
    usdAmount: number;
    rate: number;
    totalARS: number;
    accountId: string;
    date: string;
  }) => void;
}) {
  const [usdAmount, setUsdAmount] = useState('');
  const [rate, setRate] = useState(defaultRate > 0 ? String(defaultRate) : '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'banco_macro');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const numericUsd = Math.max(0, safeNumber(usdAmount));
  const numericRate = Math.max(0, safeNumber(rate));
  const totalARS = numericUsd * numericRate;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Comprar Dólares (u$s)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (numericUsd <= 0 || numericRate <= 0) return;
            onConfirm({
              usdAmount: numericUsd,
              rate: numericRate,
              totalARS,
              accountId,
              date,
            });
          }}
          className="space-y-3.5"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Cantidad USD (u$s)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base font-extrabold text-slate-900 tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Cotización ($/u$s)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base font-extrabold text-slate-900 tabular-nums"
              />
            </div>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">
              Pesos a debitar de tu cuenta:
            </span>
            <span className="text-lg font-extrabold text-emerald-700 tabular-nums">
              {formatARS(totalARS)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Cuenta ARS de origen
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatARS(a.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 tabular-nums"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer min-h-[46px]"
          >
            Confirmar Compra de {formatUSD(numericUsd)}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 9. NUEVO PLAZO FIJO MODAL (SCC MUTUAL CAÑADENSE / BANCOS ARS & USD)       */
/* ========================================================================== */
export function FixedTermModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (ft: FixedTermDeposit) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [entity, setEntity] = useState('SCC Mutual Sport Club Cañadense');
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('USD');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [capital, setCapital] = useState('');
  const [termDays, setTermDays] = useState('30');
  const [startDate, setStartDate] = useState(today);
  const [maturityDate, setMaturityDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [tna, setTna] = useState('');
  const [manualInterest, setManualInterest] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);

  const recomputeMaturity = (start: string, daysStr: string) => {
    const days = Math.max(1, safeNumber(daysStr));
    if (!start) return;
    const d = new Date(start + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return;
    d.setDate(d.getDate() + days);
    setMaturityDate(d.toISOString().split('T')[0]);
  };

  const numCap = Math.max(0, safeNumber(capital));
  const numDays = Math.max(1, safeNumber(termDays));
  const numTna = Math.max(0, safeNumber(tna));
  const autoInterest = Number(((numCap * (numTna / 100) * numDays) / 365).toFixed(2));
  const finalInterest =
    manualInterest.trim() !== '' ? Math.max(0, safeNumber(manualInterest)) : autoInterest;
  const totalReturn = Number((numCap + finalInterest).toFixed(2));
  const tem = numTna > 0 ? Number((numTna / 12).toFixed(2)) : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Nuevo Certificado de Plazo Fijo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!entity.trim()) return;
            onConfirm({
              id: 'ft_' + Date.now(),
              entity: entity.trim(),
              currency,
              certificateNumber: certificateNumber.trim(),
              capital: numCap,
              termDays: numDays,
              startDate,
              maturityDate,
              tna: numTna,
              tem,
              interestAmount: finalInterest,
              totalReturn,
              autoRenew,
            });
          }}
          className="space-y-3.5"
        >
          {/* Currency & Quick Entity Preset */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                currency === 'USD'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Dólares (u$s)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('ARS')}
              className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                currency === 'ARS'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Pesos ($)
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              'SCC Mutual Sport Club Cañadense',
              'Banco Macro',
              'Banco Nación (BNA)',
              'Banco Santa Fe',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setEntity(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                  entity === preset
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Entidad / Mutual / Banco
              </label>
              <input
                type="text"
                required
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                N° Certificado
              </label>
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="Ej: 45812"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Capital ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Plazo (días)
              </label>
              <input
                type="number"
                min="1"
                value={termDays}
                onChange={(e) => {
                  setTermDays(e.target.value);
                  recomputeMaturity(startDate, e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                TNA (%)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={tna}
                onChange={(e) => setTna(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-extrabold text-indigo-600 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Fecha Constitución
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  recomputeMaturity(e.target.value, termDays);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Fecha Vencimiento
              </label>
              <input
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Estímulo / Interés (opcional editar)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={manualInterest}
                onChange={(e) => setManualInterest(e.target.value)}
                placeholder={String(autoInterest)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-extrabold text-emerald-600 tabular-nums"
              />
            </div>
            <div className="bg-indigo-50 rounded-xl p-2.5 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-indigo-700">
                Total a Reembolsar
              </span>
              <span className="text-sm font-extrabold text-indigo-900 tabular-nums">
                {currency === 'USD' ? formatUSD(totalReturn) : formatARS(totalReturn)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAutoRenew((v) => !v)}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
              autoRenew
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {autoRenew
                ? 'Renovación automática activada'
                : 'Sin renovación automática (tocar para activar)'}
            </span>
          </button>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer min-h-[46px]"
          >
            Guardar Certificado de Plazo Fijo
          </button>
        </form>
      </div>
    </div>
  );
}

