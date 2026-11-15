import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Copy,
  CreditCard,
  FileSpreadsheet,
  Home,
  LogOut,
  Plus,
  RotateCcw,
  Sparkles,
  Tractor,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from './lib/firebase';
import {
  Account,
  Bill,
  BillGroup,
  CostCenterType,
  CreditCardAccount,
  FixedTermDeposit,
  GeminiExtractedData,
  InvestmentMovement,
  InvestmentPlatformItem,
  MonthlyClosureSnapshot,
  TabId,
  TerritoryLoanState,
  Transaction,
  YieldRates,
} from './types/finance';
import {
  AVAILABLE_MONTHS,
  createInitialTerritoryLoan,
  createZeroAccounts,
  createZeroBills,
  createZeroClosures,
  createZeroCreditCards,
  createZeroFixedTerms,
  createZeroInvestmentMovements,
  createZeroInvestments,
  createZeroMamaAccounts,
  createZeroTransactions,
  createZeroYieldRates,
  ensureIcbcAccount,
  sanitizeBills,
} from './data/defaults';
import { exportMonthToCSV, formatARS, formatUSD, safeNumber } from './utils/formatters';
import { TabInicio } from './components/TabInicio';
import { TabInversiones } from './components/TabInversiones';
import { TabTarjetas } from './components/TabTarjetas';
import { TabCampoFamilia } from './components/TabCampoFamilia';
import {
  AccountBalanceModal,
  BillFormModal,
  BuyUsdModal,
  FixedTermModal,
  MonthlyClosingModal,
  MovementModal,
  PatrimonySummaryModal,
  PayBillModal,
  ResetZeroConfirmModal,
  SmartScannerModal,
} from './components/Modals';

const STORAGE_PREFIX = 'gfc_v7_';

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function MainApp() {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLocalGuestMode, setIsLocalGuestMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unauthorizedHost, setUnauthorizedHost] = useState<string | null>(null);
  const [copiedHost, setCopiedHost] = useState(false);

  useEffect(() => {
    testFirestoreConnection();
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setUnauthorizedHost(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'auth/unauthorized-domain') {
        setUnauthorizedHost(window.location.hostname);
        setAuthError(
          `El dominio "${window.location.hostname}" aún no está autorizado en Firebase Authentication. Podés agregarlo en Firebase Console o continuar en Modo Local.`
        );
      } else if (code !== 'auth/popup-closed-by-user') {
        setAuthError(
          'No se pudo iniciar sesión con Google. Verificá las ventanas emergentes o usá el Modo Local.'
        );
      }
    }
  };

  const handleSignOut = async () => {
    try {
      if (currentUser) await signOut(auth);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLocalGuestMode(false);
    }
  };

  // --- NAVIGATION & PERIOD ---
  const [activeTab, setActiveTab] = useState<TabId>('inicio');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}month`);
    return AVAILABLE_MONTHS.some((m) => m.key === saved) && saved
      ? saved
      : '2026-11';
  });

  const currentMonthLabel = useMemo(() => {
    return (
      AVAILABLE_MONTHS.find((m) => m.key === selectedMonth)?.label ||
      selectedMonth
    );
  }, [selectedMonth]);

  // --- STRICTLY ZEROED CORE FINANCIAL STATES ---
  const [accounts, setAccounts] = useState<Account[]>(() =>
    ensureIcbcAccount(
      parseJSON(
        localStorage.getItem(`${STORAGE_PREFIX}accounts`),
        createZeroAccounts()
      )
    )
  );
  const [mamaAccounts, setMamaAccounts] = useState<Account[]>(() =>
    parseJSON(
      localStorage.getItem(`${STORAGE_PREFIX}mama_accounts`),
      createZeroMamaAccounts()
    )
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    parseJSON(
      localStorage.getItem(`${STORAGE_PREFIX}transactions`),
      createZeroTransactions()
    )
  );
  const [bills, setBills] = useState<Bill[]>(() =>
    sanitizeBills(
      parseJSON(
        localStorage.getItem(`${STORAGE_PREFIX}bills`),
        createZeroBills('2026-11')
      )
    )
  );
  const [creditCards, setCreditCards] = useState<CreditCardAccount[]>(() =>
    parseJSON(
      localStorage.getItem(`${STORAGE_PREFIX}cards`),
      createZeroCreditCards('2026-11')
    )
  );
  const [investments, setInvestments] = useState<InvestmentPlatformItem[]>(() =>
    parseJSON(
      localStorage.getItem(`${STORAGE_PREFIX}investments`),
      createZeroInvestments()
    )
  );
  const [yieldRates, setYieldRates] = useState<YieldRates>(() =>
    parseJSON(
      localStorage.getItem(`${STORAGE_PREFIX}rates`),
      createZeroYieldRates()
    )
  );
  const [usdCashBalance, setUsdCashBalance] = useState<number>(() =>
    safeNumber(localStorage.getItem(`${STORAGE_PREFIX}usd_cash`))
  );
  const [fixedTerms, setFixedTerms] = useState<FixedTermDeposit[]>(() =>
    parseJSON(
      localStorage.getItem(`${STORAGE_PREFIX}fixed_terms`),
      createZeroFixedTerms()
    )
  );
  const [investmentMovements, setInvestmentMovements] = useState<
    InvestmentMovement[]
  >(() =>
    parseJSON(
      localStorage.getItem(`${STORAGE_PREFIX}inv_movements`),
      createZeroInvestmentMovements()
    )
  );
  const [territoryLoan, setTerritoryLoan] = useState<TerritoryLoanState>(() => ({
    ...createInitialTerritoryLoan(),
    ...parseJSON(
      localStorage.getItem(`${STORAGE_PREFIX}territory_loan`),
      createInitialTerritoryLoan()
    ),
  }));
  const [monthlyClosures, setMonthlyClosures] = useState<
    MonthlyClosureSnapshot[]
  >(() =>
    parseJSON(
      localStorage.getItem(`${STORAGE_PREFIX}closures`),
      createZeroClosures()
    )
  );

  // --- LOCAL STORAGE SYNC ---
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}month`, selectedMonth);
  }, [selectedMonth]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}accounts`, JSON.stringify(accounts));
  }, [accounts]);
  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_PREFIX}mama_accounts`,
      JSON.stringify(mamaAccounts)
    );
  }, [mamaAccounts]);
  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_PREFIX}transactions`,
      JSON.stringify(transactions)
    );
  }, [transactions]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}bills`, JSON.stringify(bills));
  }, [bills]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}cards`, JSON.stringify(creditCards));
  }, [creditCards]);
  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_PREFIX}investments`,
      JSON.stringify(investments)
    );
  }, [investments]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}rates`, JSON.stringify(yieldRates));
  }, [yieldRates]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}usd_cash`, String(usdCashBalance));
  }, [usdCashBalance]);
  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_PREFIX}fixed_terms`,
      JSON.stringify(fixedTerms)
    );
  }, [fixedTerms]);
  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_PREFIX}inv_movements`,
      JSON.stringify(investmentMovements)
    );
  }, [investmentMovements]);
  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_PREFIX}territory_loan`,
      JSON.stringify(territoryLoan)
    );
  }, [territoryLoan]);
  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_PREFIX}closures`,
      JSON.stringify(monthlyClosures)
    );
  }, [monthlyClosures]);

  // --- REAL-TIME FIRESTORE SYNC (PRESERVED ON movimientos_financieros/{monthId}) ---
  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    'synced' | 'syncing' | 'local'
  >('local');
  const isRemoteSyncRef = useRef(false);
  const isInitialCloudLoadDoneRef = useRef(false);

  useEffect(() => {
    if (!currentUser) {
      setCloudSyncStatus('local');
      isInitialCloudLoadDoneRef.current = false;
      return;
    }

    setCloudSyncStatus('syncing');
    const path = `movimientos_financieros/${selectedMonth}`;
    const docRef = doc(db, 'movimientos_financieros', selectedMonth);

    const unsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          isRemoteSyncRef.current = true;

          if (Array.isArray(data.accounts)) {
            setAccounts(ensureIcbcAccount(data.accounts));
          }
          if (Array.isArray(data.mamaAccounts))
            setMamaAccounts(data.mamaAccounts);
          if (Array.isArray(data.transactions))
            setTransactions(data.transactions);
          if (Array.isArray(data.bills)) {
            const cleanedBills = sanitizeBills(data.bills);
            setBills(cleanedBills);
            if (cleanedBills.length !== data.bills.length) {
              setDoc(
                docRef,
                { bills: cleanedBills, updatedAt: new Date().toISOString() },
                { merge: true }
              ).catch((e) => console.warn('Could not clean legacy bills:', e));
            }
          }
          if (Array.isArray(data.creditCards)) setCreditCards(data.creditCards);
          if (Array.isArray(data.investments)) setInvestments(data.investments);
          if (data.yieldRates && typeof data.yieldRates === 'object') {
            setYieldRates({ ...createZeroYieldRates(), ...data.yieldRates });
          }
          if (typeof data.usdCashBalance === 'number') {
            setUsdCashBalance(safeNumber(data.usdCashBalance));
          }
          if (Array.isArray(data.fixedTerms)) setFixedTerms(data.fixedTerms);
          if (Array.isArray(data.investmentMovements)) {
            setInvestmentMovements(data.investmentMovements);
          }
          if (data.territoryLoan && typeof data.territoryLoan === 'object') {
            setTerritoryLoan({
              ...createInitialTerritoryLoan(),
              ...data.territoryLoan,
            });
          }
          if (Array.isArray(data.monthlyClosures)) {
            setMonthlyClosures((prev) => {
              const incoming = data.monthlyClosures as MonthlyClosureSnapshot[];
              const incomingIds = new Set(incoming.map((c) => c.id));
              return [...incoming, ...prev.filter((p) => !incomingIds.has(p.id))];
            });
          }

          setCloudSyncStatus('synced');
          isInitialCloudLoadDoneRef.current = true;
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 250);
        } else {
          try {
            await setDoc(
              docRef,
              {
                month: selectedMonth,
                accounts,
                mamaAccounts,
                transactions,
                bills,
                creditCards,
                investments,
                yieldRates,
                usdCashBalance,
                fixedTerms,
                investmentMovements,
                territoryLoan,
                monthlyClosures,
                updatedAt: new Date().toISOString(),
                createdBy: currentUser.email || currentUser.uid,
              },
              { merge: true }
            );
            setCloudSyncStatus('synced');
            isInitialCloudLoadDoneRef.current = true;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
            setCloudSyncStatus('local');
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, path);
        setCloudSyncStatus('local');
      }
    );

    return () => unsubscribe();
  }, [selectedMonth, currentUser]);

  useEffect(() => {
    if (
      !currentUser ||
      !isInitialCloudLoadDoneRef.current ||
      isRemoteSyncRef.current
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      const path = `movimientos_financieros/${selectedMonth}`;
      try {
        setCloudSyncStatus('syncing');
        await setDoc(
          doc(db, 'movimientos_financieros', selectedMonth),
          {
            month: selectedMonth,
            accounts,
            mamaAccounts,
            transactions,
            bills,
            creditCards,
            investments,
            yieldRates,
            usdCashBalance,
            fixedTerms,
            investmentMovements,
            territoryLoan,
            monthlyClosures,
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: currentUser.email || currentUser.uid,
          },
          { merge: true }
        );
        setCloudSyncStatus('synced');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
        setCloudSyncStatus('local');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    accounts,
    mamaAccounts,
    transactions,
    bills,
    creditCards,
    investments,
    yieldRates,
    usdCashBalance,
    fixedTerms,
    investmentMovements,
    territoryLoan,
    monthlyClosures,
    selectedMonth,
    currentUser,
  ]);

  // --- DOLLAR API FETCH ---
  const [isFetchingDollar, setIsFetchingDollar] = useState(false);
  const fetchDollarQuotes = async () => {
    setIsFetchingDollar(true);
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const oficial = data.find(
            (d: { casa?: string; nombre?: string }) =>
              d?.casa === 'oficial' ||
              String(d?.nombre || '').toLowerCase().includes('oficial')
          );
          const blue = data.find(
            (d: { casa?: string; nombre?: string }) =>
              d?.casa === 'blue' ||
              String(d?.nombre || '').toLowerCase().includes('blue')
          );
          const nowStr = new Date().toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          setYieldRates((prev) => ({
            ...prev,
            dolarOficial: safeNumber(oficial?.venta) || prev.dolarOficial,
            dolarOficialCompra:
              safeNumber(oficial?.compra) || prev.dolarOficialCompra,
            dolarBlue: safeNumber(blue?.venta) || prev.dolarBlue,
            dolarBlueCompra: safeNumber(blue?.compra) || prev.dolarBlueCompra,
            lastDollarFetch: nowStr,
          }));
        }
      }
    } catch (err) {
      console.warn('No se pudo consultar DolarAPI:', err);
    } finally {
      setIsFetchingDollar(false);
    }
  };

  // --- PERIOD-FILTERED DERIVED TOTALS ---
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tMonth = t.date ? t.date.substring(0, 7) : selectedMonth;
      return tMonth === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  const personalTransactions = useMemo(
    () => periodTransactions.filter((t) => t.owner === 'personal'),
    [periodTransactions]
  );

  const totalBalance = useMemo(
    () => accounts.reduce((acc, a) => acc + safeNumber(a.balance), 0),
    [accounts]
  );

  const monthlyIncome = useMemo(
    () =>
      personalTransactions
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + safeNumber(t.amount), 0),
    [personalTransactions]
  );

  const monthlyExpenses = useMemo(
    () =>
      personalTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + safeNumber(t.amount), 0),
    [personalTransactions]
  );

  const netOperatingBalance = useMemo(
    () => monthlyIncome - monthlyExpenses,
    [monthlyIncome, monthlyExpenses]
  );

  const activeDollarRate = useMemo(() => {
    const rate =
      yieldRates.macroValuationCurrency === 'blue'
        ? safeNumber(yieldRates.dolarBlue) || safeNumber(yieldRates.dolarOficial)
        : safeNumber(yieldRates.dolarOficial) || safeNumber(yieldRates.dolarBlue);
    return rate > 0 ? rate : 0;
  }, [yieldRates]);

  const patrimonyMetrics = useMemo(() => {
    const arsFundsCap = investments
      .filter((i) => i.currency === 'ARS')
      .reduce((s, i) => s + safeNumber(i.capital), 0);
    const arsFTCap = fixedTerms
      .filter((f) => f.currency === 'ARS')
      .reduce((s, f) => s + safeNumber(f.capital), 0);
    const totalARS = totalBalance + arsFundsCap + arsFTCap;

    const usdFundsCap = investments
      .filter((i) => i.currency === 'USD')
      .reduce((s, i) => s + safeNumber(i.capital), 0);
    const usdFTCap = fixedTerms
      .filter((f) => f.currency === 'USD')
      .reduce((s, f) => s + safeNumber(f.capital), 0);
    const totalUSD = safeNumber(usdCashBalance) + usdFundsCap + usdFTCap;

    const monthlyFundGains = investments.reduce((s, i) => {
      const monthly = (safeNumber(i.capital) * (safeNumber(i.tna) / 100)) / 12;
      return s + (i.currency === 'USD' ? monthly * activeDollarRate : monthly);
    }, 0);
    const monthlyFTGains = fixedTerms.reduce((s, f) => {
      const mInt =
        f.termDays > 0
          ? (safeNumber(f.interestAmount) / f.termDays) * 30
          : safeNumber(f.interestAmount);
      return s + (f.currency === 'USD' ? mInt * activeDollarRate : mInt);
    }, 0);

    return {
      totalARS,
      totalUSD,
      estimatedFinancialGains: monthlyFundGains + monthlyFTGains,
    };
  }, [totalBalance, investments, fixedTerms, usdCashBalance, activeDollarRate]);

  // --- MODALS & FLOATING ACTION MENU STATE ---
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [movementModalOpts, setMovementModalOpts] = useState<{
    open: boolean;
    type: 'income' | 'expense';
    costCenter: CostCenterType;
    owner: 'personal' | 'mama';
  }>({
    open: false,
    type: 'expense',
    costCenter: 'hogar',
    owner: 'personal',
  });
  const [scannerModalOpts, setScannerModalOpts] = useState<{
    open: boolean;
    mode: 'file' | 'text';
    contextHint: string;
  }>({
    open: false,
    mode: 'file',
    contextHint: '',
  });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPatrimonyOpen, setIsPatrimonyOpen] = useState(false);
  const [isMonthlyClosingOpen, setIsMonthlyClosingOpen] = useState(false);
  const [isBuyUsdOpen, setIsBuyUsdOpen] = useState(false);
  const [isFixedTermModalOpen, setIsFixedTermModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<{
    account: Account;
    isMama: boolean;
  } | null>(null);
  const [newBillGroup, setNewBillGroup] = useState<BillGroup | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);

  // --- HANDLERS ---
  const handleAddTransaction = (tx: Transaction) => {
    const delta = tx.type === 'income' ? safeNumber(tx.amount) : -safeNumber(tx.amount);
    if (tx.owner === 'mama') {
      setMamaAccounts((prev) =>
        prev.map((a) =>
          a.id === tx.accountId ? { ...a, balance: a.balance + delta } : a
        )
      );
    } else {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === tx.accountId ? { ...a, balance: a.balance + delta } : a
        )
      );
    }
    setTransactions((prev) => [tx, ...prev]);
    setMovementModalOpts((prev) => ({ ...prev, open: false }));
  };

  const handleDeleteTransaction = (txId: string) => {
    const target = transactions.find((t) => t.id === txId);
    if (target) {
      const reverseDelta =
        target.type === 'income'
          ? -safeNumber(target.amount)
          : safeNumber(target.amount);
      if (target.owner === 'mama') {
        setMamaAccounts((prev) =>
          prev.map((a) =>
            a.id === target.accountId
              ? { ...a, balance: a.balance + reverseDelta }
              : a
          )
        );
      } else {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === target.accountId
              ? { ...a, balance: a.balance + reverseDelta }
              : a
          )
        );
      }
    }
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
  };

  const handleResetAllToZero = async () => {
    const zeroAccounts = createZeroAccounts();
    const zeroMama = createZeroMamaAccounts();
    const zeroBills = createZeroBills(selectedMonth);
    const zeroCards = createZeroCreditCards(selectedMonth);
    const zeroInv = createZeroInvestments();
    const zeroTx = createZeroTransactions();
    const zeroRates = createZeroYieldRates();
    const zeroFixedTerms = createZeroFixedTerms();
    const zeroInvMovements = createZeroInvestmentMovements();
    const zeroLoan = createInitialTerritoryLoan();
    const zeroClosures = createZeroClosures();

    setAccounts(zeroAccounts);
    setMamaAccounts(zeroMama);
    setTransactions(zeroTx);
    setBills(zeroBills);
    setCreditCards(zeroCards);
    setInvestments(zeroInv);
    setYieldRates(zeroRates);
    setUsdCashBalance(0);
    setFixedTerms(zeroFixedTerms);
    setInvestmentMovements(zeroInvMovements);
    setTerritoryLoan(zeroLoan);
    setMonthlyClosures(zeroClosures);
    setIsResetModalOpen(false);

    if (currentUser) {
      const path = `movimientos_financieros/${selectedMonth}`;
      try {
        setCloudSyncStatus('syncing');
        await setDoc(doc(db, 'movimientos_financieros', selectedMonth), {
          month: selectedMonth,
          accounts: zeroAccounts,
          mamaAccounts: zeroMama,
          transactions: zeroTx,
          bills: zeroBills,
          creditCards: zeroCards,
          investments: zeroInv,
          yieldRates: zeroRates,
          usdCashBalance: 0,
          fixedTerms: zeroFixedTerms,
          investmentMovements: zeroInvMovements,
          territoryLoan: zeroLoan,
          monthlyClosures: zeroClosures,
          updatedAt: new Date().toISOString(),
          lastUpdatedBy: currentUser.email || currentUser.uid,
        });
        setCloudSyncStatus('synced');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const handlePayTerritoryInstallment = (installmentNumber: number) => {
    if (territoryLoan.paidInstallmentNumbers.includes(installmentNumber)) return;
    const totalInstallment =
      safeNumber(territoryLoan.pureInstallment) +
      safeNumber(territoryLoan.mapfreInsurance);
    const targetAccId = territoryLoan.accountId || 'banco_icbc';

    setTerritoryLoan((prev) => ({
      ...prev,
      paidInstallmentNumbers: [
        ...prev.paidInstallmentNumbers,
        installmentNumber,
      ].sort((a, b) => a - b),
    }));

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === targetAccId
          ? { ...a, balance: a.balance - totalInstallment }
          : a
      )
    );

    const tx: Transaction = {
      id: `tx_territory_${installmentNumber}_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `Cuota ${installmentNumber}/${territoryLoan.totalInstallments} Préstamo ICBC Ford Territory (incl. Mapfre ${formatARS(territoryLoan.mapfreInsurance)})`,
      amount: totalInstallment,
      type: 'expense',
      accountId: targetAccId,
      costCenter: 'movilidad',
      owner: 'personal',
    };
    setTransactions((prev) => [tx, ...prev]);
  };

  const handleRegisterRobertClass = (opts: {
    date: string;
    amount: number;
    accountId: string;
    note?: string;
  }) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === opts.accountId ? { ...a, balance: a.balance - opts.amount } : a
      )
    );
    const tx: Transaction = {
      id: 'tx_robert_' + Date.now(),
      date: opts.date || new Date().toISOString().split('T')[0],
      description: opts.note
        ? `Robert / Fútbol Renato — ${opts.note}`
        : 'Robert / Fútbol Renato (Clase individual)',
      amount: opts.amount,
      type: 'expense',
      accountId: opts.accountId,
      costCenter: 'renato',
      renatoSubcategory: 'robert_futbol',
      owner: 'personal',
    };
    setTransactions((prev) => [tx, ...prev]);
  };

  const handleBuyUsd = (opts: {
    usdAmount: number;
    rate: number;
    totalARS: number;
    accountId: string;
    date: string;
  }) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === opts.accountId
          ? { ...a, balance: a.balance - opts.totalARS }
          : a
      )
    );
    setUsdCashBalance((prev) => safeNumber(prev) + opts.usdAmount);
    const mov: InvestmentMovement = {
      id: 'inv_usd_' + Date.now(),
      date: opts.date,
      monthKey: opts.date ? opts.date.substring(0, 7) : selectedMonth,
      kind: 'usd_purchase',
      description: `Compra ${formatUSD(opts.usdAmount)} @ $${opts.rate}`,
      amountARS: opts.totalARS,
      amountUSD: opts.usdAmount,
      exchangeRate: opts.rate,
      sourceAccountId: opts.accountId,
    };
    setInvestmentMovements((prev) => [mov, ...prev]);
    setIsBuyUsdOpen(false);
  };

  const handleAddFixedTerm = (ft: FixedTermDeposit) => {
    setFixedTerms((prev) => [ft, ...prev]);
    const arsEquiv =
      ft.currency === 'USD'
        ? ft.capital * (activeDollarRate > 0 ? activeDollarRate : 0)
        : ft.capital;
    const mov: InvestmentMovement = {
      id: 'inv_ft_' + Date.now(),
      date: ft.startDate || new Date().toISOString().split('T')[0],
      monthKey: ft.startDate
        ? ft.startDate.substring(0, 7)
        : selectedMonth,
      kind: 'fixed_term',
      description: `Plazo Fijo ${ft.entity} (${ft.currency})`,
      amountARS: arsEquiv,
      amountUSD: ft.currency === 'USD' ? ft.capital : undefined,
    };
    setInvestmentMovements((prev) => [mov, ...prev]);
    setIsFixedTermModalOpen(false);
  };

  const handlePayBillConfirm = (
    bill: Bill,
    paidAmount: number,
    accountId: string
  ) => {
    const isMama = bill.group === 'mama';
    if (isMama) {
      setMamaAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, balance: a.balance - paidAmount } : a
        )
      );
    } else {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, balance: a.balance - paidAmount } : a
        )
      );
    }

    setBills((prev) =>
      prev.map((b) =>
        b.id === bill.id
          ? {
              ...b,
              amount: paidAmount,
              status: 'paid',
              paidAt: new Date().toISOString().split('T')[0],
              paidFromAccountId: accountId,
            }
          : b
      )
    );

    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: `Pago ${bill.title}`,
      amount: paidAmount,
      type: 'expense',
      accountId,
      costCenter:
        bill.group === 'campo'
          ? 'campo'
          : bill.group === 'mama'
          ? 'mama'
          : bill.group === 'renato'
          ? 'renato'
          : bill.group === 'movilidad'
          ? 'movilidad'
          : bill.group === 'tarjetas'
          ? 'tarjetas'
          : bill.group === 'lorena'
          ? 'lorena'
          : 'hogar',
      owner: isMama ? 'mama' : 'personal',
    };
    setTransactions((prev) => [newTx, ...prev]);
    setPayingBill(null);
  };

  const handlePayCardStatement = (
    card: CreditCardAccount,
    accountId: string,
    amount: number
  ) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance - amount } : a
      )
    );
    setCreditCards((prev) =>
      prev.map((c) =>
        c.id === card.id
          ? {
              ...c,
              status: 'paid',
              paidAt: new Date().toISOString().split('T')[0],
              paidFromAccountId: accountId,
            }
          : c
      )
    );
    setTransactions((prev) => [
      {
        id: 'tx_cc_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        description: `Pago Resumen ${card.name} (${card.bank})`,
        amount,
        type: 'expense',
        accountId,
        costCenter: 'tarjetas',
        owner: 'personal',
      },
      ...prev,
    ]);
  };

  const handleSaveGeminiToCard = (
    cardId: string,
    data: GeminiExtractedData
  ) => {
    const newConsumptions = (data.lineItems || []).map((li, idx) => ({
      id: `cc_ai_${Date.now()}_${idx}`,
      date: data.dueDate || new Date().toISOString().split('T')[0],
      description: li.description,
      amount: safeNumber(li.amount),
      installments: li.installments,
    }));

    setCreditCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              totalAmount: safeNumber(data.amount),
              dueDate: data.dueDate || c.dueDate,
              closingDate: data.closingDate || c.closingDate,
              consumptions:
                newConsumptions.length > 0
                  ? [...newConsumptions, ...c.consumptions]
                  : c.consumptions,
            }
          : c
      )
    );
    setScannerModalOpts((prev) => ({ ...prev, open: false }));
    setActiveTab('tarjetas');
  };

  // --- LOADING SCREEN ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg mb-4">
          <TrendingUp className="w-7 h-7" />
        </div>
        <p className="text-sm font-bold text-slate-800">
          Cargando Finanzas Familiares...
        </p>
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!currentUser && !isLocalGuestMode) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-7 shadow-xl shadow-slate-200/70 space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Finanzas de Familia
            </h1>
            <p className="text-sm text-slate-500">
              Control de ingresos, gastos, inversiones, tarjetas, Campo y María Ester en tiempo real.
            </p>
          </div>

          {authError && (
            <div className="p-4 rounded-2xl bg-amber-50 text-amber-900 text-xs text-left space-y-2">
              <p className="font-semibold leading-relaxed">{authError}</p>
              {unauthorizedHost && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(unauthorizedHost);
                    setCopiedHost(true);
                    setTimeout(() => setCopiedHost(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-amber-900 font-bold shadow-xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    {copiedHost
                      ? 'Dominio copiado'
                      : `Copiar dominio (${unauthorizedHost})`}
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-3 transition-colors shadow-md cursor-pointer min-h-[48px]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Iniciar sesión con Google</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLocalGuestMode(true)}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer min-h-[44px]"
            >
              Continuar en Modo Local (Sin nube)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col pb-28 md:pb-12">
      {/* ================================================================== */}
      {/* TOP BAR (CLEAN 3-ZONE ON DESKTOP / COMPACT ON MOBILE)              */}
      {/* ================================================================== */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Title */}
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Finanzas Familia
          </span>

          {/* Zone 2: 4 Clean Navigation Links (PC / Tablet) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {[
              { id: 'inicio', label: 'Inicio' },
              { id: 'inversiones', label: 'Inversiones y Tasas' },
              { id: 'tarjetas', label: 'Tarjetas y Resúmenes' },
              { id: 'familia', label: 'Campo y Familia' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    active
                      ? 'text-emerald-600 border-emerald-500'
                      : 'text-slate-500 border-transparent hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsQuickMenuOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Cargar / Escanear</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* WORKSPACE UTILITY TOOLBAR (MONTH, CLOUD, EXPORT, RESET TO $0)      */}
      {/* ================================================================== */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Calendar className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-800 appearance-none cursor-pointer shadow-2xs min-h-[40px]"
              >
                {AVAILABLE_MONTHS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <span className="text-xs text-slate-500 font-medium">
              {cloudSyncStatus === 'synced'
                ? 'Sincronizado en Firebase'
                : cloudSyncStatus === 'syncing'
                ? 'Sincronizando...'
                : 'Modo local'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() =>
                setScannerModalOpts({
                  open: true,
                  mode: 'file',
                  contextHint: activeTab,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lector IA</span>
            </button>

            <button
              type="button"
              onClick={() =>
                exportMonthToCSV(
                  selectedMonth,
                  currentMonthLabel,
                  bills,
                  periodTransactions,
                  monthlyIncome,
                  monthlyExpenses,
                  netOperatingBalance
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Poner todo en cero</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              title="Salir"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT VIEWPORT                                              */}
      {/* ================================================================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5">
        {activeTab === 'inicio' && (
          <TabInicio
            accounts={accounts}
            transactions={periodTransactions}
            totalBalance={totalBalance}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            netOperatingBalance={netOperatingBalance}
            monthLabel={currentMonthLabel}
            onOpenNewMovement={(type) =>
              setMovementModalOpts({
                open: true,
                type,
                costCenter: 'hogar',
                owner: 'personal',
              })
            }
            onEditAccountBalance={(account) =>
              setEditingAccount({ account, isMama: false })
            }
            onDeleteTransaction={handleDeleteTransaction}
            onOpenPatrimonySummary={() => setIsPatrimonyOpen(true)}
            onOpenMonthlyClosing={() => setIsMonthlyClosingOpen(true)}
          />
        )}

        {activeTab === 'inversiones' && (
          <TabInversiones
            investments={investments}
            yieldRates={yieldRates}
            usdCashBalance={usdCashBalance}
            fixedTerms={fixedTerms}
            investmentMovements={investmentMovements}
            isFetchingDollar={isFetchingDollar}
            onUpdateInvestment={(id, patch) =>
              setInvestments((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, ...patch } : item
                )
              )
            }
            onUpdateYieldRates={(patch) =>
              setYieldRates((prev) => ({ ...prev, ...patch }))
            }
            onUpdateUsdCash={(val) => setUsdCashBalance(val)}
            onOpenBuyUsd={() => setIsBuyUsdOpen(true)}
            onOpenNewFixedTerm={() => setIsFixedTermModalOpen(true)}
            onToggleFixedTermAutoRenew={(id) =>
              setFixedTerms((prev) =>
                prev.map((ft) =>
                  ft.id === id ? { ...ft, autoRenew: !ft.autoRenew } : ft
                )
              )
            }
            onDeleteFixedTerm={(id) =>
              setFixedTerms((prev) => prev.filter((ft) => ft.id !== id))
            }
            onOpenGeminiScanner={() =>
              setScannerModalOpts({
                open: true,
                mode: 'file',
                contextHint: 'Certificado de Plazo Fijo SCC Mutual Sport Club Cañadense',
              })
            }
            onFetchDollar={fetchDollarQuotes}
          />
        )}

        {activeTab === 'tarjetas' && (
          <TabTarjetas
            creditCards={creditCards}
            accounts={accounts}
            monthLabel={currentMonthLabel}
            onOpenGeminiScanner={() =>
              setScannerModalOpts({
                open: true,
                mode: 'file',
                contextHint: 'Resumen de tarjeta de crédito',
              })
            }
            onAddCard={(card) => setCreditCards((prev) => [card, ...prev])}
            onUpdateCard={(cardId, patch) =>
              setCreditCards((prev) =>
                prev.map((c) => (c.id === cardId ? { ...c, ...patch } : c))
              )
            }
            onDeleteCard={(cardId) =>
              setCreditCards((prev) => prev.filter((c) => c.id !== cardId))
            }
            onPayCardStatement={handlePayCardStatement}
          />
        )}

        {activeTab === 'familia' && (
          <TabCampoFamilia
            transactions={periodTransactions}
            bills={bills}
            accounts={accounts}
            mamaAccounts={mamaAccounts}
            territoryLoan={territoryLoan}
            monthLabel={currentMonthLabel}
            onOpenNewMovement={(opts) =>
              setMovementModalOpts({ open: true, ...opts })
            }
            onDeleteTransaction={handleDeleteTransaction}
            onOpenNewBill={(group) => setNewBillGroup(group)}
            onUpdateBill={(billId, patch) =>
              setBills((prev) =>
                prev.map((b) => (b.id === billId ? { ...b, ...patch } : b))
              )
            }
            onPayBill={(bill) => setPayingBill(bill)}
            onDeleteBill={(billId) =>
              setBills((prev) => prev.filter((b) => b.id !== billId))
            }
            onEditAccountBalance={(account, isMama) =>
              setEditingAccount({ account, isMama })
            }
            onUpdateTerritoryLoan={(patch) =>
              setTerritoryLoan((prev) => ({ ...prev, ...patch }))
            }
            onPayTerritoryInstallment={handlePayTerritoryInstallment}
            onRegisterRobertClass={handleRegisterRobertClass}
          />
        )}
      </main>

      {/* ================================================================== */}
      {/* DESKTOP FLOATING + BUTTON                                          */}
      {/* ================================================================== */}
      <button
        type="button"
        onClick={() => setIsQuickMenuOpen(true)}
        aria-label="Cargar movimiento o escanear"
        className="hidden md:flex fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl shadow-emerald-500/30 items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* ================================================================== */}
      {/* MOBILE FIXED BOTTOM NAVIGATION BAR (4 TABS + CENTRAL FLOATING +)   */}
      {/* ================================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-safe">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <button
            type="button"
            onClick={() => setActiveTab('inicio')}
            className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
              activeTab === 'inicio' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 whitespace-nowrap">
              Inicio
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inversiones')}
            className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
              activeTab === 'inversiones' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 whitespace-nowrap">
              Tasas
            </span>
          </button>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsQuickMenuOpen(true)}
              aria-label="Acción rápida"
              className="-mt-6 w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform cursor-pointer ring-4 ring-[#F8FAFC]"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('tarjetas')}
            className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
              activeTab === 'tarjetas' ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 whitespace-nowrap">
              Tarjetas
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('familia')}
            className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
              activeTab === 'familia' ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 whitespace-nowrap">
              Familia
            </span>
          </button>
        </div>
      </nav>

      {/* ================================================================== */}
      {/* QUICK ACTION SHEET (TRIGGERED BY FLOATING + BUTTON)                */}
      {/* ================================================================== */}
      {isQuickMenuOpen && (
        <div
          onClick={() => setIsQuickMenuOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base font-extrabold text-slate-900">
                ¿Qué querés cargar?
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickMenuOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsQuickMenuOpen(false);
                setMovementModalOpts({
                  open: true,
                  type: 'income',
                  costCenter: activeTab === 'familia' ? 'campo' : 'hogar',
                  owner: 'personal',
                });
              }}
              className="w-full p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 flex items-center gap-3.5 text-left transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-emerald-900 block">
                  Cargar Ingreso (+)
                </span>
                <span className="text-xs text-emerald-700">
                  Renta campo, Scilingo, sueldo o jubilación
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsQuickMenuOpen(false);
                setMovementModalOpts({
                  open: true,
                  type: 'expense',
                  costCenter: activeTab === 'familia' ? 'campo' : 'hogar',
                  owner: 'personal',
                });
              }}
              className="w-full p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 flex items-center gap-3.5 text-left transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-rose-900 block">
                  Cargar Egreso (-)
                </span>
                <span className="text-xs text-rose-700">
                  Gasto diario, campo, Renato o servicio
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsQuickMenuOpen(false);
                setScannerModalOpts({
                  open: true,
                  mode: 'file',
                  contextHint: activeTab,
                });
              }}
              className="w-full p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 flex items-center gap-3.5 text-left transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-indigo-900 block">
                  Escanear Factura, Resumen o Mail
                </span>
                <span className="text-xs text-indigo-700">
                  Gemini lee PDF, capturas, fotos o texto
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODALS                                                             */}
      {/* ================================================================== */}
      {movementModalOpts.open && (
        <MovementModal
          accounts={accounts}
          mamaAccounts={mamaAccounts}
          initialType={movementModalOpts.type}
          initialCostCenter={movementModalOpts.costCenter}
          initialOwner={movementModalOpts.owner}
          onClose={() =>
            setMovementModalOpts((prev) => ({ ...prev, open: false }))
          }
          onSave={handleAddTransaction}
        />
      )}

      {scannerModalOpts.open && (
        <SmartScannerModal
          accounts={accounts}
          mamaAccounts={mamaAccounts}
          creditCards={creditCards}
          initialMode={scannerModalOpts.mode}
          contextHint={scannerModalOpts.contextHint}
          onClose={() =>
            setScannerModalOpts((prev) => ({ ...prev, open: false }))
          }
          onSaveAsTransaction={(tx) => {
            handleAddTransaction(tx);
            setScannerModalOpts((prev) => ({ ...prev, open: false }));
          }}
          onSaveAsBill={(newBill) => {
            setBills((prev) => [newBill, ...prev]);
            setScannerModalOpts((prev) => ({ ...prev, open: false }));
            setActiveTab('familia');
          }}
          onSaveToCreditCard={handleSaveGeminiToCard}
          onSaveToFixedTerm={(ft) => {
            handleAddFixedTerm(ft);
            setScannerModalOpts((prev) => ({ ...prev, open: false }));
            setActiveTab('inversiones');
          }}
        />
      )}

      {isPatrimonyOpen && (
        <PatrimonySummaryModal
          accounts={accounts}
          mamaAccounts={mamaAccounts}
          investments={investments}
          fixedTerms={fixedTerms}
          usdCashBalance={usdCashBalance}
          yieldRates={yieldRates}
          onClose={() => setIsPatrimonyOpen(false)}
        />
      )}

      {isMonthlyClosingOpen && (
        <MonthlyClosingModal
          monthKey={selectedMonth}
          monthLabel={currentMonthLabel}
          monthlyIncome={monthlyIncome}
          monthlyExpenses={monthlyExpenses}
          estimatedFinancialGains={patrimonyMetrics.estimatedFinancialGains}
          investmentMovements={investmentMovements}
          totalARS={patrimonyMetrics.totalARS}
          totalUSD={patrimonyMetrics.totalUSD}
          defaultExchangeRate={activeDollarRate}
          closures={monthlyClosures}
          onSaveClosure={(snapshot) =>
            setMonthlyClosures((prev) => [snapshot, ...prev])
          }
          onDeleteClosure={(id) =>
            setMonthlyClosures((prev) => prev.filter((c) => c.id !== id))
          }
          onClose={() => setIsMonthlyClosingOpen(false)}
        />
      )}

      {isBuyUsdOpen && (
        <BuyUsdModal
          accounts={accounts}
          defaultRate={activeDollarRate}
          onClose={() => setIsBuyUsdOpen(false)}
          onConfirm={handleBuyUsd}
        />
      )}

      {isFixedTermModalOpen && (
        <FixedTermModal
          onClose={() => setIsFixedTermModalOpen(false)}
          onConfirm={handleAddFixedTerm}
        />
      )}

      {isResetModalOpen && (
        <ResetZeroConfirmModal
          monthLabel={currentMonthLabel}
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={handleResetAllToZero}
        />
      )}

      {editingAccount && (
        <AccountBalanceModal
          account={editingAccount.account}
          onClose={() => setEditingAccount(null)}
          onSave={(accId, newBalance) => {
            if (editingAccount.isMama) {
              setMamaAccounts((prev) =>
                prev.map((a) =>
                  a.id === accId ? { ...a, balance: newBalance } : a
                )
              );
            } else {
              setAccounts((prev) =>
                prev.map((a) =>
                  a.id === accId ? { ...a, balance: newBalance } : a
                )
              );
            }
            setEditingAccount(null);
          }}
        />
      )}

      {newBillGroup && (
        <BillFormModal
          defaultGroup={newBillGroup}
          onClose={() => setNewBillGroup(null)}
          onSave={(newBill) => {
            setBills((prev) => [newBill, ...prev]);
            setNewBillGroup(null);
          }}
        />
      )}

      {payingBill && (
        <PayBillModal
          bill={payingBill}
          accounts={payingBill.group === 'mama' ? mamaAccounts : accounts}
          onClose={() => setPayingBill(null)}
          onConfirm={(paidAmt, accId) =>
            handlePayBillConfirm(payingBill, paidAmt, accId)
          }
        />
      )}
    </div>
  );
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-xl space-y-4">
            <Tractor className="w-10 h-10 text-emerald-500 mx-auto" />
            <h2 className="text-base font-extrabold text-slate-900">
              Recuperación del Gestor
            </h2>
            <p className="text-xs text-slate-500">
              Se detectó un problema de renderizado. Podés reiniciar los datos locales en $0 y recargar.
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-3 rounded-2xl bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              Reiniciar en $0 y Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <MainApp />
    </AppErrorBoundary>
  );
}
