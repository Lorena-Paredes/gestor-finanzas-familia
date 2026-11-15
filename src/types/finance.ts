export type TabId = 'inicio' | 'inversiones' | 'tarjetas' | 'familia';

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'wallet' | 'cash' | 'fuel';
  balance: number;
  icon: string;
  accountNumber?: string;
  color: string;
  badge?: string;
}

export type BillGroup =
  | 'hogar'
  | 'tarjetas'
  | 'movilidad'
  | 'renato'
  | 'lorena'
  | 'campo'
  | 'mama';

export type PaymentMethodType = 'debito_cuenta' | 'debito_tarjeta' | 'pago_manual';

export interface Bill {
  id: string;
  title: string;
  provider: string;
  amount: number | null;
  dueDate: string;
  dueDay: number;
  group: BillGroup;
  paymentMethod: PaymentMethodType;
  paymentMethodDetail: string;
  status: 'paid' | 'pending';
  paidAt?: string;
  paidFromAccountId?: string;
  isAnnual?: boolean;
  notes?: string;
  subservices?: string[];
  month?: string;
}

export interface MonthPeriod {
  key: string;
  label: string;
  shortLabel: string;
}

export type IncomeSourceType = 'alquiler_campo' | 'comisiones_scilingo' | 'sueldo' | 'jubilacion' | 'otros';

export type CostCenterType =
  | 'hogar'
  | 'almacen'
  | 'renato'
  | 'lorena'
  | 'vehiculo'
  | 'movilidad'
  | 'mama'
  | 'campo'
  | 'tarjetas'
  | 'varios';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  accountId: string;
  costCenter: CostCenterType;
  renatoSubcategory?: 'colegio' | 'deporte' | 'gimnasio' | 'robert_futbol' | 'ingles' | 'extras';
  campoCategory?: 'cereal' | 'arrendamiento' | 'gallinas' | 'mascotas' | 'julian' | 'obras' | 'operativos';
  incomeSource?: IncomeSourceType;
  owner: 'personal' | 'mama';
}

export interface CreditCardConsumption {
  id: string;
  date: string;
  description: string;
  amount: number;
  installments?: string;
  category?: CostCenterType;
}

export interface CreditCardAccount {
  id: string;
  name: string;
  bank: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'mp';
  closingDay: number;
  dueDay: number;
  closingDate?: string;
  dueDate?: string;
  totalAmount: number;
  status: 'paid' | 'pending';
  paidAt?: string;
  paidFromAccountId?: string;
  consumptions: CreditCardConsumption[];
  accentColor: string;
}

export interface InvestmentPlatformItem {
  id: string;
  name: string;
  subtitle: string;
  entity: string;
  currency: 'ARS' | 'USD';
  capital: number;
  tna: number;
  liquidity: string;
  accent: string;
}

export interface FixedTermDeposit {
  id: string;
  entity: string;
  currency: 'ARS' | 'USD';
  certificateNumber: string;
  capital: number;
  termDays: number;
  startDate: string;
  maturityDate: string;
  tna: number;
  tem?: number;
  interestAmount: number;
  totalReturn: number;
  autoRenew: boolean;
  notes?: string;
}

export interface InvestmentMovement {
  id: string;
  date: string;
  monthKey: string;
  kind: 'usd_purchase' | 'fixed_term' | 'fund_deposit';
  description: string;
  amountARS: number;
  amountUSD?: number;
  exchangeRate?: number;
  sourceAccountId?: string;
}

export interface TerritoryLoanState {
  totalInstallments: number;
  paidInstallmentNumbers: number[];
  pureInstallment: number;
  mapfreInsurance: number;
  accountId: string;
}

export interface MonthlyClosureSnapshot {
  id: string;
  monthKey: string;
  monthLabel: string;
  savedAt: string;
  totalIncome: number;
  totalExpenses: number;
  financialGains: number;
  investmentOutflows: number;
  capacityToInvest: number;
  totalARS: number;
  totalUSD: number;
  exchangeRateUsed: number;
}

export interface YieldRates {
  mercadoPagoTNA: number;
  appYpfTNA: number;
  fondoPellegriniTNA: number;
  fondoMacroPesosTNA: number;
  fondoMacroPesosSaldo: number;
  fondoMacroDolaresCapital: number;
  fondoMacroDolaresTNA: number;
  macroValuationCurrency?: 'oficial' | 'blue';
  plazoFijoTNA: number;
  dolarOficial: number;
  dolarOficialCompra: number;
  dolarBlue: number;
  dolarBlueCompra: number;
  lastDollarFetch: string;
}

export interface GeminiExtractedData {
  documentKind:
    | 'service_bill'
    | 'credit_card_statement'
    | 'fixed_term_certificate'
    | 'receipt'
    | 'income_settlement';
  provider: string;
  title: string;
  amount: number;
  dueDate: string;
  closingDate?: string;
  ownership: 'propia' | 'maria_ester';
  movementType: 'expense' | 'income';
  category: 'campo' | 'mama' | 'tarjetas' | 'renato' | 'movilidad' | 'lorena' | 'hogar';
  paymentMethod: PaymentMethodType;
  paymentMethodDetail: string;
  cardName?: string;
  notes?: string;
  lineItems?: Array<{
    description: string;
    amount: number;
    installments?: string;
  }>;
  fixedTermData?: {
    entity?: string;
    currency?: 'ARS' | 'USD' | string;
    certificateNumber?: string;
    capital?: number;
    termDays?: number;
    startDate?: string;
    maturityDate?: string;
    tna?: number;
    interestAmount?: number;
    totalReturn?: number;
  };
}
