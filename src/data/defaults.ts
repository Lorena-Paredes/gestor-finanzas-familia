import {
  Account,
  Bill,
  CreditCardAccount,
  FixedTermDeposit,
  InvestmentMovement,
  InvestmentPlatformItem,
  MonthPeriod,
  MonthlyClosureSnapshot,
  TerritoryLoanState,
  Transaction,
  YieldRates,
} from '../types/finance';

export const AVAILABLE_MONTHS: MonthPeriod[] = [
  { key: '2026-09', label: 'Septiembre 2026', shortLabel: 'Sep 2026' },
  { key: '2026-10', label: 'Octubre 2026', shortLabel: 'Oct 2026' },
  { key: '2026-11', label: 'Noviembre 2026', shortLabel: 'Nov 2026' },
  { key: '2026-12', label: 'Diciembre 2026', shortLabel: 'Dic 2026' },
  { key: '2027-01', label: 'Enero 2027', shortLabel: 'Ene 2027' },
  { key: '2027-02', label: 'Febrero 2027', shortLabel: 'Feb 2027' },
];

export const createZeroAccounts = (): Account[] => [
  { id: 'banco_icbc', name: 'Banco ICBC (Caja de Ahorro)', type: 'bank', balance: 0, icon: 'Building2', color: '#E11D48', badge: 'Préstamo Territory' },
  { id: 'banco_santa_fe', name: 'Banco Santa Fe', type: 'bank', balance: 0, icon: 'Building2', color: '#0EA5E9', badge: 'Renta Campo' },
  { id: 'banco_macro', name: 'Banco Macro', type: 'bank', balance: 0, icon: 'Building2', color: '#6366F1', badge: 'Scilingo Hnos.' },
  { id: 'banco_nacion', name: 'Banco Nación (BNA+)', type: 'bank', balance: 0, icon: 'Landmark', color: '#0284C7', badge: 'Pellegrini / BNA' },
  { id: 'mercado_pago', name: 'Mercado Pago', type: 'wallet', balance: 0, icon: 'Smartphone', color: '#38BDF8', badge: 'Billetera' },
  { id: 'app_ypf', name: 'App YPF Dinero', type: 'fuel', balance: 0, icon: 'Fuel', color: '#2563EB', badge: 'Combustible' },
  { id: 'efectivo', name: 'Efectivo en Mano', type: 'cash', balance: 0, icon: 'Wallet', color: '#F59E0B', badge: 'Efectivo' },
];

export const ensureIcbcAccount = (accounts: Account[]): Account[] => {
  if (accounts.some((a) => a.id === 'banco_icbc')) return accounts;
  return [
    { id: 'banco_icbc', name: 'Banco ICBC (Caja de Ahorro)', type: 'bank', balance: 0, icon: 'Building2', color: '#E11D48', badge: 'Préstamo Territory' },
    ...accounts,
  ];
};

export const isLegacyRollerBill = (bill: Bill): boolean => {
  const titleLower = (bill.title || '').toLowerCase();
  return (
    bill.id === 'd_roller_rena' ||
    (bill.group === 'renato' &&
      (titleLower.includes('roller') ||
        (titleLower.includes('robert') && bill.dueDay === 20)))
  );
};

export const sanitizeBills = (bills: Bill[]): Bill[] =>
  bills.filter((b) => !isLegacyRollerBill(b));

export const createZeroMamaAccounts = (): Account[] => [
  { id: 'mama_bsf', name: 'Banco Santa Fe (Iaia)', type: 'bank', balance: 0, icon: 'Building2', color: '#14B8A6', badge: 'Jubilación & Serv.' },
  { id: 'mama_efectivo', name: 'Efectivo Custodia (Iaia)', type: 'cash', balance: 0, icon: 'Wallet', color: '#0D9488', badge: 'Efectivo hogar' },
];

export const createZeroYieldRates = (): YieldRates => ({
  mercadoPagoTNA: 0,
  appYpfTNA: 0,
  fondoPellegriniTNA: 0,
  fondoMacroPesosTNA: 0,
  fondoMacroPesosSaldo: 0,
  fondoMacroDolaresCapital: 0,
  fondoMacroDolaresTNA: 0,
  macroValuationCurrency: 'oficial',
  plazoFijoTNA: 0,
  dolarOficial: 0,
  dolarOficialCompra: 0,
  dolarBlue: 0,
  dolarBlueCompra: 0,
  lastDollarFetch: '',
});

export const createZeroInvestments = (): InvestmentPlatformItem[] => [
  {
    id: 'inv_mp',
    name: 'Mercado Pago',
    subtitle: 'Cuenta Remunerada',
    entity: 'Mercado Libre',
    currency: 'ARS',
    capital: 0,
    tna: 0,
    liquidity: 'Inmediata 24/7',
    accent: '#0EA5E9',
  },
  {
    id: 'inv_pellegrini',
    name: 'BNA / Fondo Pellegrini',
    subtitle: 'FCI Renta Pesos',
    entity: 'Banco Nación',
    currency: 'ARS',
    capital: 0,
    tna: 0,
    liquidity: 'En el día',
    accent: '#6366F1',
  },
  {
    id: 'inv_ypf',
    name: 'App YPF Dinero',
    subtitle: 'Billetera Combustible',
    entity: 'YPF',
    currency: 'ARS',
    capital: 0,
    tna: 0,
    liquidity: 'Inmediata 24/7',
    accent: '#3B82F6',
  },
  {
    id: 'inv_macro_pesos',
    name: 'Banco Macro Pesos',
    subtitle: 'FCI Pionero / Plazo Fijo',
    entity: 'Banco Macro',
    currency: 'ARS',
    capital: 0,
    tna: 0,
    liquidity: '24hs / A término',
    accent: '#8B5CF6',
  },
  {
    id: 'inv_macro_usd',
    name: 'Banco Macro Dólares',
    subtitle: 'FCI / Ahorro USD',
    entity: 'Banco Macro',
    currency: 'USD',
    capital: 0,
    tna: 0,
    liquidity: '48hs hábiles',
    accent: '#10B981',
  },
  {
    id: 'inv_santa_fe',
    name: 'Banco Santa Fe',
    subtitle: 'Plazo Fijo / FCI',
    entity: 'Banco Santa Fe',
    currency: 'ARS',
    capital: 0,
    tna: 0,
    liquidity: '30 días / En el día',
    accent: '#14B8A6',
  },
];

export const createZeroFixedTerms = (): FixedTermDeposit[] => [];
export const createZeroInvestmentMovements = (): InvestmentMovement[] => [];
export const createZeroClosures = (): MonthlyClosureSnapshot[] => [];

export const createInitialTerritoryLoan = (): TerritoryLoanState => ({
  totalInstallments: 18,
  paidInstallmentNumbers: [],
  pureInstallment: 1333335,
  mapfreInsurance: 117470,
  accountId: 'banco_icbc',
});

export const createZeroCreditCards = (monthKey = '2026-11'): CreditCardAccount[] => [
  {
    id: 'cc_visa_macro',
    name: 'Visa Macro',
    bank: 'Banco Macro',
    brand: 'visa',
    closingDay: 24,
    dueDay: 2,
    closingDate: `${monthKey}-24`,
    dueDate: `${monthKey}-02`,
    totalAmount: 0,
    status: 'pending',
    consumptions: [],
    accentColor: '#0EA5E9',
  },
  {
    id: 'cc_nativa_visa',
    name: 'Nativa Visa',
    bank: 'Banco Nación (BNA)',
    brand: 'visa',
    closingDay: 25,
    dueDay: 4,
    closingDate: `${monthKey}-25`,
    dueDate: `${monthKey}-04`,
    totalAmount: 0,
    status: 'pending',
    consumptions: [],
    accentColor: '#6366F1',
  },
  {
    id: 'cc_nativa_master',
    name: 'Nativa Mastercard',
    bank: 'Banco Nación (BNA)',
    brand: 'mastercard',
    closingDay: 25,
    dueDay: 4,
    closingDate: `${monthKey}-25`,
    dueDate: `${monthKey}-04`,
    totalAmount: 0,
    status: 'pending',
    consumptions: [],
    accentColor: '#F59E0B',
  },
  {
    id: 'cc_mp',
    name: 'Tarjeta Mercado Pago',
    bank: 'Mercado Pago',
    brand: 'mp',
    closingDay: 1,
    dueDay: 11,
    closingDate: `${monthKey}-01`,
    dueDate: `${monthKey}-11`,
    totalAmount: 0,
    status: 'pending',
    consumptions: [],
    accentColor: '#38BDF8',
  },
];

export const createZeroBills = (monthKey = '2026-11'): Bill[] => [
  // Campo y Cereales
  { id: 'f_starlink_campo', title: 'Starlink Campo', provider: 'Starlink', amount: 0, dueDate: `${monthKey}-02`, dueDay: 2, group: 'campo', paymentMethod: 'debito_tarjeta', paymentMethodDetail: 'Visa Macro', status: 'pending', month: monthKey },
  { id: 'f_inmob_rural', title: 'Inmobiliario Rural', provider: 'API Santa Fe Rural', amount: 0, dueDate: `${monthKey}-20`, dueDay: 20, group: 'campo', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', month: monthKey },
  { id: 'f_julian_campo', title: 'Julián Mantenimiento Campo', provider: 'Encargado Predio', amount: 0, dueDate: `${monthKey}-03`, dueDay: 3, group: 'campo', paymentMethod: 'pago_manual', paymentMethodDetail: 'Transferencia Macro', status: 'pending', month: monthKey },
  { id: 'f_gallinas_alimento', title: 'Gallinas Felices Alimento', provider: 'Insumos Avícolas', amount: 0, dueDate: `${monthKey}-12`, dueDay: 12, group: 'campo', paymentMethod: 'pago_manual', paymentMethodDetail: 'Efectivo / Transferencia', status: 'pending', month: monthKey },
  { id: 'f_mascotas', title: 'Perros + Gatos', provider: 'Veterinaria & Alimento', amount: 0, dueDate: `${monthKey}-16`, dueDay: 16, group: 'campo', paymentMethod: 'pago_manual', paymentMethodDetail: 'Mercado Pago', status: 'pending', month: monthKey },

  // Administración María Ester (Iaia)
  { id: 'g_epe_mama', title: 'EPE María Ester', provider: 'Empresa Provincial de la Energía', amount: 0, dueDate: `${monthKey}-09`, dueDay: 9, group: 'mama', paymentMethod: 'pago_manual', paymentMethodDetail: 'Banco Santa Fe', status: 'pending', month: monthKey },
  { id: 'g_gas_mama', title: 'Gas María Ester', provider: 'Litoral Gas S.A.', amount: 0, dueDate: `${monthKey}-02`, dueDay: 2, group: 'mama', paymentMethod: 'pago_manual', paymentMethodDetail: 'Banco Santa Fe', status: 'pending', month: monthKey },
  { id: 'g_agua_mama', title: 'Agua María Ester', provider: 'Aguas Santafesinas S.A.', amount: 0, dueDate: `${monthKey}-18`, dueDay: 18, group: 'mama', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', month: monthKey },
  { id: 'g_celular_mama', title: 'Celular María Ester', provider: 'Telefonía Móvil', amount: 0, dueDate: `${monthKey}-15`, dueDay: 15, group: 'mama', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito BSF Iaia', status: 'pending', month: monthKey },
  { id: 'g_tgi_mama', title: 'TGI Urbano María Ester', provider: 'Municipalidad', amount: 0, dueDate: `${monthKey}-16`, dueDay: 16, group: 'mama', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual BSF', status: 'pending', month: monthKey },
  { id: 'g_inmob_mama', title: 'Inmobiliario María Ester', provider: 'API Santa Fe', amount: 0, dueDate: `${monthKey}-16`, dueDay: 16, group: 'mama', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual BSF', status: 'pending', month: monthKey },
  { id: 'g_flow_mama', title: 'Telecom / Flow María Ester', provider: 'Telecom Flow', amount: 0, dueDate: `${monthKey}-11`, dueDay: 11, group: 'mama', paymentMethod: 'debito_tarjeta', paymentMethodDetail: 'Débito Tarjeta Iaia', status: 'pending', month: monthKey },
  { id: 'g_monotributo_mama', title: 'Monotributo María Ester', provider: 'ARCA / AFIP', amount: 0, dueDate: `${monthKey}-20`, dueDay: 20, group: 'mama', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito BNA', status: 'pending', month: monthKey },
  { id: 'g_estudio_mama', title: 'Estudio Contable María Ester', provider: 'Honorarios Contables', amount: 0, dueDate: `${monthKey}-20`, dueDay: 20, group: 'mama', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito BSF Iaia', status: 'pending', month: monthKey },

  // Fijos, Suscripciones y Familia (Hogar, Movilidad, Renato, Lorena)
  { id: 'c_ford_giorgi', title: 'Plan Ovalo Ford (Giorgi)', provider: 'Ford Plan Óvalo', amount: 0, dueDate: `${monthKey}-10`, dueDay: 10, group: 'movilidad', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Macro', status: 'pending', month: monthKey },
  { id: 'c_patente', title: 'Patente Automotor', provider: 'API / Comuna', amount: 0, dueDate: `${monthKey}-25`, dueDay: 25, group: 'movilidad', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', month: monthKey },
  { id: 'd_colegio_rena', title: 'Colegio Renato', provider: 'Institución Educativa', amount: 0, dueDate: `${monthKey}-10`, dueDay: 10, group: 'renato', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Macro', status: 'pending', month: monthKey },
  { id: 'd_club_rena', title: 'Club + Fútbol Renato', provider: 'Club Deportivo', amount: 0, dueDate: `${monthKey}-10`, dueDay: 10, group: 'renato', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito BNA', status: 'pending', month: monthKey },
  { id: 'd_gym_rena', title: 'Gimnasio Renato', provider: 'Gym', amount: 0, dueDate: `${monthKey}-15`, dueDay: 15, group: 'renato', paymentMethod: 'pago_manual', paymentMethodDetail: 'Transferencia', status: 'pending', month: monthKey },
  { id: 'd_ingles_rena', title: 'Inglés Renato', provider: 'Instituto de Idiomas', amount: 0, dueDate: `${monthKey}-10`, dueDay: 10, group: 'renato', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', month: monthKey },
  { id: 'b_netflix', title: 'Netflix', provider: 'Netflix', amount: 0, dueDate: `${monthKey}-15`, dueDay: 15, group: 'tarjetas', paymentMethod: 'debito_tarjeta', paymentMethodDetail: 'Visa Macro', status: 'pending', month: monthKey },
  { id: 'b_youtube', title: 'YouTube Premium', provider: 'Google YouTube', amount: 0, dueDate: `${monthKey}-18`, dueDay: 18, group: 'tarjetas', paymentMethod: 'debito_tarjeta', paymentMethodDetail: 'Visa Macro', status: 'pending', month: monthKey },
  { id: 'a_epe', title: 'EPE Santa Fe (Hogar)', provider: 'Empresa Provincial de la Energía', amount: 0, dueDate: `${monthKey}-09`, dueDay: 9, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', month: monthKey },
  { id: 'a_gas', title: 'Litoral Gas (Hogar)', provider: 'Litoral Gas S.A.', amount: 0, dueDate: `${monthKey}-19`, dueDay: 19, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', month: monthKey },
  { id: 'a_agua', title: 'Aguas Santafesinas (Hogar)', provider: 'ASSA', amount: 0, dueDate: `${monthKey}-13`, dueDay: 13, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', month: monthKey },
  { id: 'a_internet', title: 'Internet Fibertec / Telecom', provider: 'Fibertec', amount: 0, dueDate: `${monthKey}-11`, dueDay: 11, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', month: monthKey },
  { id: 'a_osde', title: 'OSDE Salud', provider: 'OSDE', amount: 0, dueDate: `${monthKey}-12`, dueDay: 12, group: 'hogar', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Macro', status: 'pending', month: monthKey },
  { id: 'a_monotributo', title: 'Monotributo Cat. D', provider: 'ARCA / AFIP', amount: 0, dueDate: `${monthKey}-20`, dueDay: 20, group: 'hogar', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito BNA', status: 'pending', month: monthKey },
  { id: 'e_gym_lore', title: 'Gimnasio & Stretching Lorena', provider: 'Centro de Entrenamiento', amount: 0, dueDate: `${monthKey}-05`, dueDay: 5, group: 'lorena', paymentMethod: 'pago_manual', paymentMethodDetail: 'Mercado Pago', status: 'pending', month: monthKey },
];

export const createZeroTransactions = (): Transaction[] => [];

export const CATEGORY_THEME: Record<
  string,
  { label: string; color: string; bgSoft: string; text: string }
> = {
  campo: {
    label: 'Campo y Cereales',
    color: '#10B981',
    bgSoft: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  mama: {
    label: 'María Ester (Iaia)',
    color: '#14B8A6',
    bgSoft: 'bg-teal-50',
    text: 'text-teal-700',
  },
  tarjetas: {
    label: 'Tarjetas y Bancos',
    color: '#0EA5E9',
    bgSoft: 'bg-sky-50',
    text: 'text-sky-700',
  },
  inversiones: {
    label: 'Inversiones',
    color: '#6366F1',
    bgSoft: 'bg-indigo-50',
    text: 'text-indigo-700',
  },
  renato: {
    label: 'Renato',
    color: '#F59E0B',
    bgSoft: 'bg-amber-50',
    text: 'text-amber-700',
  },
  hogar: {
    label: 'Personal y Fijos',
    color: '#F59E0B',
    bgSoft: 'bg-amber-50',
    text: 'text-amber-700',
  },
  movilidad: {
    label: 'Movilidad y Ford',
    color: '#0EA5E9',
    bgSoft: 'bg-sky-50',
    text: 'text-sky-700',
  },
  lorena: {
    label: 'Lorena',
    color: '#8B5CF6',
    bgSoft: 'bg-violet-50',
    text: 'text-violet-700',
  },
  almacen: {
    label: 'Supermercado',
    color: '#F43F5E',
    bgSoft: 'bg-rose-50',
    text: 'text-rose-700',
  },
  varios: {
    label: 'Varios',
    color: '#64748B',
    bgSoft: 'bg-slate-100',
    text: 'text-slate-700',
  },
};
