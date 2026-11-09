import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  HeartHandshake,
  Receipt,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Fuel,
  CreditCard,
  Building2,
  Wallet,
  Camera,
  Upload,
  ShoppingCart,
  Trash2,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Smartphone,
  Sparkles,
  ChevronRight,
  CheckSquare,
  Square,
  X,
  BadgeAlert,
  Car,
  Footprints,
  Zap,
  Info,
  Check,
  Tractor,
  Dog,
  Egg,
  Wrench,
  FileSearch,
  FileCheck,
  Wheat,
  Landmark,
  Scale,
  Percent,
  Sliders,
  DollarSign,
  RotateCcw,
  FileUp,
  ShieldCheck,
  RefreshCw,
  Coins,
  Download,
  Share2,
  FileSpreadsheet,
  Calendar,
  ChevronDown
} from 'lucide-react';

// --- FORMATTERS & UTILS ---
const formatARS = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'A confirmar';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

const getDaysDiff = (targetDateStr: string): number => {
  if (!targetDateStr) return 999;
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- DATA TYPES ---
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
  | 'hogar' // A. Servicios Personales y Hogar (YO)
  | 'tarjetas' // B. Tarjetas de Crédito y Suscripciones
  | 'movilidad' // C. Vehículos, Ahorro y Movilidad
  | 'renato' // D. Renato
  | 'lorena' // E. Lorena
  | 'campo' // F. El Campo & Consumo Hogar
  | 'mama'; // G. Mamá

export type PaymentMethodType = 'debito_cuenta' | 'debito_tarjeta' | 'pago_manual';

export interface Bill {
  id: string;
  title: string;
  provider: string;
  amount: number | null; // null represents "A confirmar"
  dueDate: string; // YYYY-MM-DD
  dueDay: number; // e.g. 09, 19, 13
  group: BillGroup;
  paymentMethod: PaymentMethodType;
  paymentMethodDetail: string; // e.g. "Macro Cuo Pay", "Banco Santa Fe", "BNA", "Visa Macro", "Transferencia"
  status: 'paid' | 'pending';
  paidAt?: string;
  paidFromAccountId?: string;
  isAnnual?: boolean;
  notes?: string;
  subservices?: string[];
  month?: string; // YYYY-MM period, e.g., '2026-11'
}

export interface MonthPeriod {
  key: string; // YYYY-MM
  label: string; // "Noviembre 2026"
  shortLabel: string; // "Nov 2026"
}

export const AVAILABLE_MONTHS: MonthPeriod[] = [
  { key: '2026-09', label: 'Septiembre 2026', shortLabel: 'Sep 2026' },
  { key: '2026-10', label: 'Octubre 2026', shortLabel: 'Oct 2026' },
  { key: '2026-11', label: 'Noviembre 2026', shortLabel: 'Nov 2026' },
  { key: '2026-12', label: 'Diciembre 2026', shortLabel: 'Dic 2026' },
  { key: '2027-01', label: 'Enero 2027', shortLabel: 'Ene 2027' },
  { key: '2027-02', label: 'Febrero 2027', shortLabel: 'Feb 2027' },
];

export interface BasketItem {
  id: string;
  name: string;
  category: string;
  previousPrice: number;
  currentPrice: number;
  lastUpdated: string;
  unit: string;
}

export interface ShoppingNeed {
  id: string;
  title: string;
  urgent: boolean;
  completed: boolean;
}

export type IncomeSourceType = 'alquiler_campo' | 'comisiones_scilingo' | 'sueldo' | 'jubilacion' | 'otros';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  accountId: string;
  targetAccountId?: string;
  costCenter: 'hogar' | 'almacen' | 'renato' | 'lorena' | 'vehiculo' | 'mama' | 'campo' | 'varios';
  renatoSubcategory?: 'colegio' | 'deporte' | 'gimnasio' | 'roller' | 'ingles' | 'extras';
  campoCategory?: 'gallinas' | 'mascotas' | 'julian' | 'obras' | 'operativos';
  incomeSource?: IncomeSourceType;
  owner: 'personal' | 'mama';
}

export interface YieldRates {
  mercadoPagoTNA: number;
  appYpfTNA: number;
  fondoPellegriniTNA: number; // Fondo Pellegrini BNA (Liquidez a la vista)
  fondoMacroPesosTNA: number; // Fondo Macro en Pesos (Liquidez a la vista)
  fondoMacroPesosSaldo: number; // Saldo invertido en Fondo Macro Pesos
  fondoMacroDolaresCapital: number; // Capital invertido en USD
  fondoMacroDolaresTNA: number; // Rendimiento estimado anual en USD (%)
  macroValuationCurrency?: 'oficial' | 'blue'; // Moneda para valuar Fondo Macro USD en ARS
  plazoFijoTNA: number;
  dolarOficial: number; // Dólar Oficial BNA Venta (ej. $1.570)
  dolarOficialCompra: number; // Dólar Oficial BNA Compra
  dolarBlue: number; // Dólar Blue Rosario / InfoDólar Venta
  dolarBlueCompra: number; // Dólar Blue Rosario / InfoDólar Compra
  lastDollarFetch: string;
}

// --- INITIAL REAL DATABASE ---
const INITIAL_ACCOUNTS: Account[] = [
  { id: 'banco_santa_fe', name: 'Banco Santa Fe', type: 'bank', balance: 1485000, icon: 'Building2', color: 'bg-emerald-600', badge: 'Renta Campo' },
  { id: 'banco_macro', name: 'Banco Macro', type: 'bank', balance: 945000, icon: 'Building2', color: 'bg-indigo-600', badge: 'Comisiones Scilingo' },
  { id: 'banco_nacion', name: 'Banco Nación (BNA+)', type: 'bank', balance: 215000, icon: 'Building2', color: 'bg-cyan-700', badge: 'Fondo Pellegrini / BNA' },
  { id: 'mercado_pago', name: 'Mercado Pago', type: 'wallet', balance: 320400, icon: 'Smartphone', color: 'bg-sky-500', badge: 'Rendimientos' },
  { id: 'app_ypf', name: 'App YPF Dinero', type: 'fuel', balance: 54000, icon: 'Fuel', color: 'bg-blue-600', badge: 'Combustible' },
  { id: 'efectivo', name: 'Efectivo en Mano', type: 'cash', balance: 65000, icon: 'Wallet', color: 'bg-amber-600', badge: 'Billetera' },
];

const INITIAL_MAMA_ACCOUNTS: Account[] = [
  { id: 'mama_bsf', name: 'Banco Santa Fe (Mamá)', type: 'bank', balance: 485000, icon: 'Building2', color: 'bg-purple-600', badge: 'Jubilación & Serv.' },
  { id: 'mama_efectivo', name: 'Efectivo Custodia Mamá', type: 'cash', balance: 42000, icon: 'Wallet', color: 'bg-pink-600', badge: 'Efectivo hogar' },
];

const INITIAL_YIELD_RATES: YieldRates = {
  mercadoPagoTNA: 20.0,
  appYpfTNA: 20.1,
  fondoPellegriniTNA: 28.5, // Fondo Pellegrini BNA
  fondoMacroPesosTNA: 27.8, // Fondo Macro Renta Pesos
  fondoMacroPesosSaldo: 2500000, // $2.500.000 invertido en Macro Pesos (Patrimonio a Resguardo)
  fondoMacroDolaresCapital: 5000, // USD 5.000 invertido en Macro Dólares
  fondoMacroDolaresTNA: 2.5, // 2.5% TNA anual en USD
  macroValuationCurrency: 'oficial', // Valuado por defecto en Dólar Oficial BNA
  plazoFijoTNA: 30.0,
  dolarOficial: 1570, // Dólar Oficial Banco Nación (BNA) Venta
  dolarOficialCompra: 1520, // Dólar Oficial Banco Nación (BNA) Compra
  dolarBlue: 1195, // Dólar Blue Rosario / InfoDólar Venta
  dolarBlueCompra: 1165, // Dólar Blue Rosario / InfoDólar Compra
  lastDollarFetch: '',
};

// COMPREHENSIVE DEFINITIVE BILLS DATABASE
const INITIAL_BILLS: Bill[] = [
  // A. SERVICIOS PERSONALES Y HOGAR (YO)
  { id: 'a_epe', title: 'EPE Santa Fe', provider: 'Empresa Provincial de la Energía', amount: null, dueDate: '2026-11-09', dueDay: 9, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', notes: 'Esperando factura de luz domicilio central' },
  { id: 'a_gas', title: 'GAS (Litoral Gas)', provider: 'Litoral Gas S.A.', amount: 14800, dueDate: '2026-11-19', dueDay: 19, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', notes: 'Consumo bimestral primavera' },
  { id: 'a_agua', title: 'AGUA', provider: 'Aguas Santafesinas S.A.', amount: null, dueDate: '2026-11-13', dueDay: 13, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', notes: 'Servicio de agua corriente' },
  { id: 'a_celular', title: 'Celular Personal', provider: 'Telefonía Móvil', amount: 24500, dueDate: '2026-11-02', dueDay: 2, group: 'hogar', paymentMethod: 'debito_tarjeta', paymentMethodDetail: 'Macro Cuo Pay', status: 'paid', paidAt: '2026-11-02', paidFromAccountId: 'banco_macro', notes: 'Plan celular familiar' },
  { id: 'a_tgi', title: 'TGI URBANO', provider: 'Municipalidad - Tasa Gral Inmueble', amount: 8900, dueDate: '2026-11-07', dueDay: 7, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'paid', paidAt: '2026-11-07', paidFromAccountId: 'banco_santa_fe', notes: 'Tasa mensual servicios urbanos' },
  { id: 'a_inmob_urbano', title: 'INMOBILIARIO URBANO', provider: 'API Santa Fe', amount: null, dueDate: '', dueDay: 0, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'paid', isAnnual: true, notes: 'Pago Anual ya abonado con descuento' },
  { id: 'a_alarma', title: 'ALARMA', provider: 'Seguridad y Monitoreo', amount: 28000, dueDate: '2026-11-07', dueDay: 7, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Transferencia Macro', status: 'paid', paidAt: '2026-11-07', paidFromAccountId: 'banco_macro', notes: 'Monitoreo 24hs alarma hogar' },
  { id: 'a_internet', title: 'INTERNET (Fibertec)', provider: 'Fibertec Conectividad', amount: 26500, dueDate: '2026-11-11', dueDay: 11, group: 'hogar', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', notes: 'Banda ancha fibra óptica' },
  { id: 'a_directv', title: 'DIRECTV GO', provider: 'DIRECTV / DGO', amount: 16900, dueDate: '2026-11-15', dueDay: 15, group: 'hogar', paymentMethod: 'debito_tarjeta', paymentMethodDetail: 'Débito Tarjeta Visa Macro', status: 'pending', notes: 'Streaming y TV en vivo' },
  { id: 'a_osde', title: 'OSDE Salud', provider: 'OSDE Cobertura Médica', amount: 165000, dueDate: '2026-11-12', dueDay: 12, group: 'hogar', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito en Cuenta Macro', status: 'pending', notes: 'Plan médico titular' },
  { id: 'a_binaria', title: 'Binaria Salud', provider: 'Binaria Seguros / BNA', amount: 48000, dueDate: '2026-11-10', dueDay: 10, group: 'hogar', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Automático BNA', status: 'pending', notes: 'Seguro de salud y vida BNA' },
  { id: 'a_monotributo', title: 'Monotributo CAT. "D"', provider: 'ARCA / AFIP', amount: 56200, dueDate: '2026-11-20', dueDay: 20, group: 'hogar', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Automático BNA', status: 'pending', notes: 'Aporte mensual Monotributo Cat D' },
  { id: 'a_estudio_contable', title: 'Estudio Contable', provider: 'Honorarios Contables', amount: 75000, dueDate: '2026-11-20', dueDay: 20, group: 'hogar', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Automático Banco Macro', status: 'pending', notes: 'Honorarios mensuales liquidación impositiva' },

  // B. TARJETAS DE CRÉDITO Y SUSCRIPCIONES
  { id: 'b_visa_macro', title: 'Tarj. VISA MACRO', provider: 'Banco Macro Visa', amount: 310000, dueDate: '2026-11-02', dueDay: 2, group: 'tarjetas', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Automático Macro', status: 'paid', paidAt: '2026-11-02', paidFromAccountId: 'banco_macro', notes: 'Resumen consolidado. Incluye débitos en plástico de Starlink Campo, Netflix y YouTube', subservices: ['Starlink Campo', 'Netflix', 'YouTube'] },
  { id: 'b_nativa_visa', title: 'Tarj. NATIVA VISA', provider: 'Banco Nación BNA', amount: 84000, dueDate: '2026-11-04', dueDay: 4, group: 'tarjetas', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito BNA', status: 'paid', paidAt: '2026-11-04', paidFromAccountId: 'banco_nacion', notes: 'Resumen tarjeta BNA' },
  { id: 'b_nativa_master', title: 'Tarj. NATIVA MASTER', provider: 'Banco Nación BNA', amount: 62000, dueDate: '2026-11-04', dueDay: 4, group: 'tarjetas', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito BNA', status: 'paid', paidAt: '2026-11-04', paidFromAccountId: 'banco_nacion', notes: 'Resumen tarjeta Mastercard BNA' },
  { id: 'b_tarj_mp', title: 'Tarj. Mercado Pago', provider: 'Mercado Pago Mastercard', amount: 45000, dueDate: '2026-11-11', dueDay: 11, group: 'tarjetas', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Cuenta MP', status: 'pending', notes: 'Resumen crédito Mercado Pago' },
  { id: 'b_streaming_pack', title: 'Streaming (Disney, Prime, Max, etc.)', provider: 'Suscripciones Digitales', amount: 32500, dueDate: '2026-11-18', dueDay: 18, group: 'tarjetas', paymentMethod: 'debito_tarjeta', paymentMethodDetail: 'Débito en Tarjeta', status: 'pending', notes: 'Disney+, Universal+, Prime Video, Paramount+, HBO Max, Mercado Libre Pelis', subservices: ['Disney+', 'Universal+', 'Prime Video', 'Paramount+', 'HBO Max', 'ML Pelis'] },

  // C. VEHÍCULOS, AHORRO Y MOVILIDAD
  { id: 'c_ford_giorgi', title: 'Plan Ford Giorgi (Ahorro/Inversión)', provider: 'Giorgi Automotores Ford', amount: 145000, dueDate: '2026-11-10', dueDay: 10, group: 'movilidad', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Automático Macro', status: 'pending', notes: 'Plan de ahorro e inversión vehicular oficial' },
  { id: 'c_territory', title: 'Territory Titanium (Cuota Mensual)', provider: 'Ford Credit / Financiación', amount: 260000, dueDate: '2026-11-28', dueDay: 28, group: 'movilidad', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Banco Macro', status: 'pending', notes: 'Cuota Territory Titanium (reemplazo de Oroch)' },
  { id: 'c_patente', title: 'Patente Automotor', provider: 'Comuna / API Patentes', amount: null, dueDate: '2026-11-25', dueDay: 25, group: 'movilidad', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual / Comuna', status: 'pending', notes: 'Impuesto de patente vehículos familiares' },
  { id: 'c_combustible', title: 'Combustible (Presupuesto)', provider: 'App YPF / Macro MODO', amount: 120000, dueDate: '2026-11-30', dueDay: 30, group: 'movilidad', paymentMethod: 'debito_tarjeta', paymentMethodDetail: 'App YPF / Macro MODO', status: 'pending', notes: 'Cargas de Infinia nafta y GNC con descuentos' },

  // D. RENATO
  { id: 'd_colegio_rena', title: 'Colegio Rena', provider: 'Colegio', amount: 135000, dueDate: '2026-11-10', dueDay: 10, group: 'renato', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Automático Macro', status: 'pending', notes: 'Cuota mensual educación escolar' },
  { id: 'd_ingles_rena', title: 'Inglés Rena', provider: 'Instituto de Idiomas', amount: null, dueDate: '', dueDay: 0, group: 'renato', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'paid', isAnnual: true, notes: 'Pago Anual ya abonado' },
  { id: 'd_club_rena', title: 'Club + Fútbol Rena', provider: 'Club Náutico / Deportivo', amount: 38000, dueDate: '2026-11-10', dueDay: 10, group: 'renato', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Automático BNA', status: 'pending', notes: 'Cuota social + entrenamiento fútbol' },
  { id: 'd_gym_rena', title: 'Gimnasio Rena', provider: 'Gym & Entrenamiento', amount: 22000, dueDate: '2026-11-15', dueDay: 15, group: 'renato', paymentMethod: 'pago_manual', paymentMethodDetail: 'Transferencia / Efectivo', status: 'pending', notes: 'Acondicionamiento físico' },
  { id: 'd_roller_rena', title: 'RollerFútbol Rena', provider: 'Clases de Roller', amount: 18000, dueDate: '2026-11-20', dueDay: 20, group: 'renato', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago por Clases (MP)', status: 'pending', notes: 'Clases deportivas por mes' },

  // E. LORENA (ACTIVIDADES)
  { id: 'e_gym_lore', title: 'Gimnasio Lore', provider: 'Centro de Entrenamiento', amount: 24000, dueDate: '2026-11-03', dueDay: 3, group: 'lorena', paymentMethod: 'pago_manual', paymentMethodDetail: 'Transferencia / Mercado Pago', status: 'paid', paidAt: '2026-11-03', paidFromAccountId: 'mercado_pago', notes: 'Pase libre mensual gimnasio' },
  { id: 'e_stretching_lore', title: 'Stretching Lore', provider: 'Estudio de Flexibilidad', amount: 20000, dueDate: '2026-11-03', dueDay: 3, group: 'lorena', paymentMethod: 'pago_manual', paymentMethodDetail: 'Transferencia / Mercado Pago', status: 'paid', paidAt: '2026-11-03', paidFromAccountId: 'mercado_pago', notes: 'Clases semanales de stretching' },

  // F. EL CAMPO & CONSUMO HOGAR
  { id: 'f_starlink_campo', title: 'Starlink Campo', provider: 'Starlink Internet Satelital', amount: 56000, dueDate: '2026-11-02', dueDay: 2, group: 'campo', paymentMethod: 'debito_tarjeta', paymentMethodDetail: 'Débito Tarj. Visa Macro', status: 'paid', paidAt: '2026-11-02', paidFromAccountId: 'banco_macro', notes: 'Conectividad satelital chacra (en resumen Macro)' },
  { id: 'f_inmob_rural', title: 'Inmobiliario Rural', provider: 'API Santa Fe Rural', amount: 48500, dueDate: '2026-11-20', dueDay: 20, group: 'campo', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', notes: 'Impuesto predio rural' },
  { id: 'f_julian_campo', title: 'Julián mant.campo', provider: 'Encargado Mantenimiento Predio', amount: 350000, dueDate: '2026-11-03', dueDay: 3, group: 'campo', paymentMethod: 'pago_manual', paymentMethodDetail: 'Transferencia Macro', status: 'paid', paidAt: '2026-11-03', paidFromAccountId: 'banco_macro', notes: 'Monto fijo convenido mensual ($350.000)' },
  { id: 'f_limpieza_casa', title: 'Limpieza mi casa', provider: 'Personal del Hogar', amount: 72000, dueDate: '2026-11-15', dueDay: 15, group: 'campo', paymentMethod: 'pago_manual', paymentMethodDetail: 'Efectivo / Transferencia', status: 'pending', notes: 'Servicio periódico de limpieza' },
  { id: 'f_gallinas_alimento', title: 'Gallinas Felices Alimento', provider: 'Insumos Avícolas', amount: 38000, dueDate: '2026-11-12', dueDay: 12, group: 'campo', paymentMethod: 'pago_manual', paymentMethodDetail: 'Efectivo / Transferencia', status: 'pending', notes: 'Alimento postura y maíz' },
  { id: 'f_mascotas', title: 'Perros + Gatos', provider: 'Veterinaria & Alimento', amount: 45000, dueDate: '2026-11-16', dueDay: 16, group: 'campo', paymentMethod: 'pago_manual', paymentMethodDetail: 'Mercado Pago / Efectivo', status: 'pending', notes: 'Alimento balanceado y veterinaria' },
  { id: 'f_supermercado', title: 'Supermercado & SuperRural', provider: 'Compras de Almacén', amount: 160000, dueDate: '2026-11-25', dueDay: 25, group: 'campo', paymentMethod: 'pago_manual', paymentMethodDetail: 'Registro vía Escáner de Tickets', status: 'pending', notes: 'Auditoría canasta básica con escáner de fotos' },

  // G. MAMÁ (EXCLUSIVO IMPUESTOS Y SERVICIOS - BANCO SANTA FE)
  { id: 'g_epe_mama', title: 'EPE Mamá', provider: 'Empresa Provincial de la Energía', amount: null, dueDate: '2026-11-09', dueDay: 9, group: 'mama', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual / Débito BSF', status: 'pending', notes: 'Medidor residencial de Mamá' },
  { id: 'g_gas_mama', title: 'GAS Mamá', provider: 'Litoral Gas S.A.', amount: 11200, dueDate: '2026-11-02', dueDay: 2, group: 'mama', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual / Débito BSF', status: 'paid', paidAt: '2026-11-02', paidFromAccountId: 'mama_bsf', notes: 'Factura gas cancelada' },
  { id: 'g_agua_mama', title: 'AGUA Mamá', provider: 'Aguas Santafesinas S.A.', amount: null, dueDate: '2026-11-18', dueDay: 18, group: 'mama', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual', status: 'pending', notes: 'Agua potable casa Mamá' },
  { id: 'g_celular_mama', title: 'Celular Mamá', provider: 'Telefonía Móvil', amount: 18500, dueDate: '2026-11-15', dueDay: 15, group: 'mama', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Banco Santa Fe Mamá', status: 'pending', notes: 'Línea móvil de Mamá' },
  { id: 'g_tgi_mama', title: 'TGI URBANO Mamá', provider: 'Municipalidad Tasa General', amount: 7800, dueDate: '2026-11-16', dueDay: 16, group: 'mama', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual BSF', status: 'pending', notes: 'Tasa urbana municipal' },
  { id: 'g_inmob_mama', title: 'INMOBILIARIO Mamá', provider: 'API Santa Fe', amount: 14500, dueDate: '2026-11-16', dueDay: 16, group: 'mama', paymentMethod: 'pago_manual', paymentMethodDetail: 'Pago Manual BSF', status: 'pending', notes: 'Impuesto inmobiliario provincial' },
  { id: 'g_flow_mama', title: 'Flow Mamá', provider: 'Telecom Flow', amount: 16800, dueDate: '2026-11-11', dueDay: 11, group: 'mama', paymentMethod: 'debito_tarjeta', paymentMethodDetail: 'Débito Automático Tarjeta Mamá', status: 'pending', notes: 'Cable e internet de Mamá' },
  { id: 'g_monotributo_mama', title: 'Monotributo Mamá', provider: 'ARCA / AFIP', amount: 32000, dueDate: '2026-11-20', dueDay: 20, group: 'mama', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Automático BNA Mamá', status: 'pending', notes: 'Monotributo previsional' },
  { id: 'g_estudio_mama', title: 'Estudio Contable Mamá', provider: 'Honorarios Contables', amount: 45000, dueDate: '2026-11-20', dueDay: 20, group: 'mama', paymentMethod: 'debito_cuenta', paymentMethodDetail: 'Débito Automático BSF Mamá', status: 'pending', notes: 'Honorarios contables mensuales' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  // 1. Fuentes de Ingresos
  { id: 'ti1', date: '2026-11-03', description: 'Cobro Alquiler del Campo (Renta de arrendamiento rural)', amount: 1150000, type: 'income', accountId: 'banco_santa_fe', costCenter: 'campo', incomeSource: 'alquiler_campo', owner: 'personal' },
  { id: 'ti2', date: '2026-11-06', description: 'Comisiones Corretaje Scilingo Hnos. (Liquidación de cereal)', amount: 680000, type: 'income', accountId: 'banco_macro', costCenter: 'hogar', incomeSource: 'comisiones_scilingo', owner: 'personal' },
  { id: 'ti3', date: '2026-11-08', description: 'Comisiones Corretaje Scilingo Hnos. (Operación lote maíz)', amount: 340000, type: 'income', accountId: 'banco_santa_fe', costCenter: 'hogar', incomeSource: 'comisiones_scilingo', owner: 'personal' },

  // Egresos Pagados
  { id: 'tx_julian', date: '2026-11-03', description: 'Pago Julián mant.campo ($350.000 convenido)', amount: 350000, type: 'expense', accountId: 'banco_macro', costCenter: 'campo', campoCategory: 'julian', owner: 'personal' },
  { id: 'tx_visa_macro', date: '2026-11-02', description: 'Pago Tarj. VISA MACRO (incluye Starlink, Netflix, YouTube)', amount: 310000, type: 'expense', accountId: 'banco_macro', costCenter: 'hogar', owner: 'personal' },
  { id: 'tx_nativa_v', date: '2026-11-04', description: 'Pago Tarj. NATIVA VISA BNA', amount: 84000, type: 'expense', accountId: 'banco_nacion', costCenter: 'hogar', owner: 'personal' },
  { id: 'tx_nativa_m', date: '2026-11-04', description: 'Pago Tarj. NATIVA MASTER BNA', amount: 62000, type: 'expense', accountId: 'banco_nacion', costCenter: 'hogar', owner: 'personal' },
  { id: 'tx_gym_lore', date: '2026-11-03', description: 'Pago Gimnasio Lore', amount: 24000, type: 'expense', accountId: 'mercado_pago', costCenter: 'lorena', owner: 'personal' },
  { id: 'tx_stretch_lore', date: '2026-11-03', description: 'Pago Stretching Lore', amount: 20000, type: 'expense', accountId: 'mercado_pago', costCenter: 'lorena', owner: 'personal' },
  { id: 'tx_celu', date: '2026-11-02', description: 'Pago Celular Personal Macro Cuo Pay', amount: 24500, type: 'expense', accountId: 'banco_macro', costCenter: 'hogar', owner: 'personal' },
  { id: 'tx_tgi', date: '2026-11-07', description: 'Pago TGI URBANO', amount: 8900, type: 'expense', accountId: 'banco_santa_fe', costCenter: 'hogar', owner: 'personal' },
  { id: 'tx_alarma', date: '2026-11-07', description: 'Pago ALARMA Transferencia Macro', amount: 28000, type: 'expense', accountId: 'banco_macro', costCenter: 'hogar', owner: 'personal' },

  // Mamá
  { id: 'ti_mama', date: '2026-11-01', description: 'Acreditación Jubilación Mamá', amount: 520000, type: 'income', accountId: 'mama_bsf', costCenter: 'mama', incomeSource: 'jubilacion', owner: 'mama' },
  { id: 'tx_gas_mama', date: '2026-11-02', description: 'Pago GAS Mamá Litoral Gas', amount: 11200, type: 'expense', accountId: 'mama_bsf', costCenter: 'mama', owner: 'mama' },
];

const INITIAL_BASKET: BasketItem[] = [
  { id: 'p1', name: 'Leche Entera La Serenísima 1L', category: 'Lácteos', previousPrice: 1380, currentPrice: 1590, lastUpdated: '2026-11-06', unit: 'Tetra 1L' },
  { id: 'p2', name: 'Aceite Girasol Cocinero 1.5L', category: 'Almacén', previousPrice: 2450, currentPrice: 2790, lastUpdated: '2026-11-06', unit: 'Botella 1.5L' },
  { id: 'p3', name: 'Café Molido La Virginia 500g', category: 'Desayuno', previousPrice: 4200, currentPrice: 4950, lastUpdated: '2026-11-07', unit: 'Paquete 500g' },
  { id: 'p4', name: 'Yerba Mate Playadito 1kg', category: 'Almacén', previousPrice: 3850, currentPrice: 4300, lastUpdated: '2026-11-05', unit: 'Paquete 1kg' },
  { id: 'p5', name: 'Pechuga de Pollo Fresca 1kg', category: 'Carnes', previousPrice: 4900, currentPrice: 5600, lastUpdated: '2026-11-07', unit: 'Kilo' },
  { id: 'p6', name: 'Maíz Partido p/ Gallinas x 25kg', category: 'Campo', previousPrice: 6500, currentPrice: 7200, lastUpdated: '2026-11-05', unit: 'Bolsa 25kg' },
  { id: 'p7', name: 'Alimento Balanceado Postura x 50kg', category: 'Campo', previousPrice: 26000, currentPrice: 28500, lastUpdated: '2026-11-06', unit: 'Bolsa 50kg' },
  { id: 'p8', name: 'Alimento Perros Criadores 20kg', category: 'Mascotas', previousPrice: 29000, currentPrice: 32000, lastUpdated: '2026-11-04', unit: 'Bolsa 20kg' },
];

const INITIAL_SHOPPING_LIST: ShoppingNeed[] = [
  { id: 's1', title: 'Alimento postura gallinas ponedoras (stock bajo)', urgent: true, completed: false },
  { id: 's2', title: 'Yerba mate 1kg Playadito', urgent: true, completed: false },
  { id: 's3', title: 'Pipetas antipulgas perros medianos campo', urgent: false, completed: false },
  { id: 's4', title: 'Aceite de motor 2 tiempos motoguadaña', urgent: false, completed: true },
  { id: 's5', title: 'Huevos de campo x 30 maples', urgent: false, completed: false },
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vencimientos' | 'campo' | 'scanner' | 'mama' | 'renato'>('dashboard');

  // Persistence States
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('gfc_accounts_v6');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [mamaAccounts, setMamaAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('gfc_mama_accounts_v6');
    return saved ? JSON.parse(saved) : INITIAL_MAMA_ACCOUNTS;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('gfc_bills_v6');
    return saved ? JSON.parse(saved) : INITIAL_BILLS;
  });

  const [basket, setBasket] = useState<BasketItem[]>(() => {
    const saved = localStorage.getItem('gfc_basket_v6');
    return saved ? JSON.parse(saved) : INITIAL_BASKET;
  });

  const [shoppingList, setShoppingList] = useState<ShoppingNeed[]>(() => {
    const saved = localStorage.getItem('gfc_shopping_list_v6');
    return saved ? JSON.parse(saved) : INITIAL_SHOPPING_LIST;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('gfc_transactions_v6');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Yield Rates Configuration State
  const [yieldRates, setYieldRates] = useState<YieldRates>(() => {
    const saved = localStorage.getItem('gfc_yield_rates_v6');
    return saved ? JSON.parse(saved) : INITIAL_YIELD_RATES;
  });

  // Dollar API status
  const [isFetchingDollar, setIsFetchingDollar] = useState<boolean>(false);

  // Simulator Amount State
  const [simAmount, setSimAmount] = useState<number>(100000);
  const [isEditingRates, setIsEditingRates] = useState<boolean>(false);
  const [isEditingDollar, setIsEditingDollar] = useState<boolean>(false);

  // Vencimientos Filters: Group and Payment Method
  const [billsFilterGroup, setBillsFilterGroup] = useState<BillGroup | 'all'>('all');
  const [billsFilterPaymentMethod, setBillsFilterPaymentMethod] = useState<'all' | 'debito_cuenta' | 'debito_tarjeta' | 'pago_manual'>('all');

  // Modals & Forms
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPayBillModalOpen, setIsPayBillModalOpen] = useState(false);
  const [selectedBillToPay, setSelectedBillToPay] = useState<Bill | null>(null);
  const [payFromAccountId, setPayFromAccountId] = useState<string>('banco_macro');

  // Document Scanner / Uploader
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [docName, setDocName] = useState<string>('');
  const [extractedDocData, setExtractedDocData] = useState<{
    serviceId?: string;
    title: string;
    provider: string;
    amount: number;
    dueDate: string;
    group: BillGroup;
    paymentMethod: PaymentMethodType;
    paymentMethodDetail: string;
    notes: string;
  } | null>(null);

  const globalFileInputRef = useRef<HTMLInputElement>(null);

  // Shopping item input
  const [newNeedTitle, setNewNeedTitle] = useState('');
  const [newNeedUrgent, setNewNeedUrgent] = useState(false);

  // PWA Install State & Handlers
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSInstallModal, setShowIOSInstallModal] = useState<boolean>(false);

  useEffect(() => {
    // Detect standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsPWAInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleInstalled = () => {
      setIsPWAInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsPWAInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSInstallModal(true);
    } else {
      setShowIOSInstallModal(true);
    }
  };

  // -------------------------------------------------------------
  // REAL-TIME DOLAR API FETCH (DÓLAR OFICIAL BNA & BLUE ROSARIO)
  // -------------------------------------------------------------
  const fetchDollarQuotes = async () => {
    setIsFetchingDollar(true);
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const oficialItem = data.find((d: any) => d.casa === 'oficial' || d.nombre?.toLowerCase().includes('oficial'));
          const blueItem = data.find((d: any) => d.casa === 'blue' || d.nombre?.toLowerCase().includes('blue'));

          const nowStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

          setYieldRates(prev => ({
            ...prev,
            dolarOficial: oficialItem?.venta ? Number(oficialItem.venta) : prev.dolarOficial,
            dolarOficialCompra: oficialItem?.compra ? Number(oficialItem.compra) : prev.dolarOficialCompra,
            dolarBlue: blueItem?.venta ? Number(blueItem.venta) : prev.dolarBlue,
            dolarBlueCompra: blueItem?.compra ? Number(blueItem.compra) : prev.dolarBlueCompra,
            lastDollarFetch: nowStr,
          }));
        }
      }
    } catch (err) {
      console.warn('DolarAPI en modo respaldo con cotizaciones locales (BNA e InfoDólar):', err);
    } finally {
      setIsFetchingDollar(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchDollarQuotes();
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('gfc_accounts_v6', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('gfc_mama_accounts_v6', JSON.stringify(mamaAccounts));
  }, [mamaAccounts]);

  useEffect(() => {
    localStorage.setItem('gfc_bills_v6', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('gfc_basket_v6', JSON.stringify(basket));
  }, [basket]);

  useEffect(() => {
    localStorage.setItem('gfc_shopping_list_v6', JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem('gfc_transactions_v6', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('gfc_yield_rates_v6', JSON.stringify(yieldRates));
  }, [yieldRates]);

  // Selected Month / Period State
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const saved = localStorage.getItem('gfc_selected_month_v6');
    return saved || '2026-11';
  });

  useEffect(() => {
    localStorage.setItem('gfc_selected_month_v6', selectedMonth);
  }, [selectedMonth]);

  const currentMonthLabel = useMemo(() => {
    const found = AVAILABLE_MONTHS.find(m => m.key === selectedMonth);
    return found ? found.label : selectedMonth;
  }, [selectedMonth]);

  // Calculations
  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + curr.balance, 0);
  }, [accounts]);

  const totalMamaBalance = useMemo(() => {
    return mamaAccounts.reduce((acc, curr) => acc + curr.balance, 0);
  }, [mamaAccounts]);

  // Current Month's Bills (filtered by selectedMonth; defaults to '2026-11' for legacy items)
  const currentMonthBills = useMemo(() => {
    return bills.filter(b => {
      const bMonth = b.month || (b.dueDate ? b.dueDate.substring(0, 7) : '2026-11');
      return bMonth === selectedMonth || b.isAnnual;
    });
  }, [bills, selectedMonth]);

  // Current Month's Transactions (filtered by selectedMonth)
  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tMonth = t.date ? t.date.substring(0, 7) : '2026-11';
      return tMonth === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  const currentMonthTransactions = useMemo(() => {
    return periodTransactions.filter(t => t.owner === 'personal');
  }, [periodTransactions]);

  const monthlyIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentMonthTransactions]);

  const monthlyExpenses = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentMonthTransactions]);

  const netOperatingBalance = useMemo(() => {
    return monthlyIncome - monthlyExpenses;
  }, [monthlyIncome, monthlyExpenses]);

  // Income Sources Breakdown for the selected month
  const totalAlquilerCampo = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'income' && t.incomeSource === 'alquiler_campo')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentMonthTransactions]);

  const totalComisionesScilingo = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'income' && t.incomeSource === 'comisiones_scilingo')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [currentMonthTransactions]);

  // Urgent alerts for bills (due in <= 2 days or overdue) within the selected month
  const urgentBills = useMemo(() => {
    return currentMonthBills.filter(b => {
      if (b.status === 'paid' || b.isAnnual) return false;
      const diff = getDaysDiff(b.dueDate);
      return diff <= 2;
    });
  }, [currentMonthBills]);

  const toConfirmCount = useMemo(() => {
    return currentMonthBills.filter(b => b.amount === null && !b.isAnnual).length;
  }, [currentMonthBills]);

  // Reconciliation Totals for Vencimientos (Cierre de Mes) for selected period
  const reconciliationTotals = useMemo(() => {
    const nonAnnualBills = currentMonthBills.filter(b => !b.isAnnual);

    const debitoCuentaTotal = nonAnnualBills
      .filter(b => b.paymentMethod === 'debito_cuenta' && b.amount !== null)
      .reduce((acc, b) => acc + (b.amount || 0), 0);

    const debitoTarjetaTotal = nonAnnualBills
      .filter(b => b.paymentMethod === 'debito_tarjeta' && b.amount !== null)
      .reduce((acc, b) => acc + (b.amount || 0), 0);

    const pagoManualTotal = nonAnnualBills
      .filter(b => b.paymentMethod === 'pago_manual' && b.amount !== null)
      .reduce((acc, b) => acc + (b.amount || 0), 0);

    const debitoCuentaPendiente = nonAnnualBills
      .filter(b => b.paymentMethod === 'debito_cuenta' && b.status === 'pending' && b.amount !== null)
      .reduce((acc, b) => acc + (b.amount || 0), 0);

    const debitoTarjetaPendiente = nonAnnualBills
      .filter(b => b.paymentMethod === 'debito_tarjeta' && b.status === 'pending' && b.amount !== null)
      .reduce((acc, b) => acc + (b.amount || 0), 0);

    const pagoManualPendiente = nonAnnualBills
      .filter(b => b.paymentMethod === 'pago_manual' && b.status === 'pending' && b.amount !== null)
      .reduce((acc, b) => acc + (b.amount || 0), 0);

    return {
      debitoCuentaTotal,
      debitoTarjetaTotal,
      pagoManualTotal,
      debitoCuentaPendiente,
      debitoTarjetaPendiente,
      pagoManualPendiente,
    };
  }, [currentMonthBills]);

  // EXPORT TO EXCEL / CSV FUNCTION
  const handleExportToExcel = () => {
    const rows: string[] = [];
    // BOM for proper Excel UTF-8 display in Spanish
    rows.push('\uFEFF"Período: ' + currentMonthLabel + '"');
    rows.push('"Generado el: ' + new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR') + '"');
    rows.push('');

    // Table Header
    rows.push([
      '"Categoría / Destino"',
      '"Concepto / Servicio"',
      '"Proveedor / Emisor"',
      '"Vencimiento"',
      '"Importe (ARS)"',
      '"Medio de Pago"',
      '"Entidad Bancaria / Plástico"',
      '"Estado"',
      '"Fecha de Pago"',
      '"Notas / Observaciones"'
    ].join(';'));

    const groupNames: Record<BillGroup, string> = {
      hogar: 'YO - Hogar & Personal',
      tarjetas: 'Tarjetas & Streaming',
      movilidad: 'Vehículos & Movilidad',
      renato: 'Renato',
      lorena: 'Lorena',
      campo: 'El Campo & Chacra',
      mama: 'Mamá (Banco Santa Fe)',
    };

    const paymentMethodNames: Record<PaymentMethodType, string> = {
      debito_cuenta: 'Débito en Cuenta',
      debito_tarjeta: 'Débito en Tarjeta',
      pago_manual: 'Pago Manual / Transferencia',
    };

    let sumPaid = 0;
    let sumPending = 0;
    let sumTotal = 0;

    currentMonthBills.forEach(b => {
      const cat = groupNames[b.group] || b.group;
      const title = b.title.replace(/"/g, '""');
      const provider = (b.provider || '').replace(/"/g, '""');
      const dueDate = b.isAnnual ? 'Pago Anual' : (b.dueDate ? formatDate(b.dueDate) : `Día ${b.dueDay || '-'}`);
      const amtNum = b.amount !== null ? b.amount : 0;
      const amtStr = b.isAnnual ? 'Pago Anual' : (b.amount !== null ? amtNum.toString() : 'A confirmar');
      const pm = paymentMethodNames[b.paymentMethod] || b.paymentMethod;
      const pmd = (b.paymentMethodDetail || '').replace(/"/g, '""');
      const statusStr = b.isAnnual ? 'Abonado Anual' : (b.status === 'paid' ? 'Pagado' : 'Pendiente');
      const paidDate = b.paidAt ? formatDate(b.paidAt) : '-';
      const notes = (b.notes || '').replace(/"/g, '""');

      if (!b.isAnnual && b.amount !== null) {
        sumTotal += amtNum;
        if (b.status === 'paid') sumPaid += amtNum;
        else sumPending += amtNum;
      }

      rows.push([
        `"${cat}"`,
        `"${title}"`,
        `"${provider}"`,
        `"${dueDate}"`,
        `"${amtStr}"`,
        `"${pm}"`,
        `"${pmd}"`,
        `"${statusStr}"`,
        `"${paidDate}"`,
        `"${notes}"`
      ].join(';'));
    });

    // Summary Rows
    rows.push('');
    rows.push('"--- RESUMEN FINANCIERO DEL PERÍODO ---"');
    rows.push(`"Total Ingresos del Mes (Renta + Scilingo + Otros)";"";"";"";"${monthlyIncome}";"";"";"";"";""`);
    rows.push(`"Total Gastos Pagados / Ejecutados";"";"";"";"${sumPaid}";"";"";"";"";""`);
    rows.push(`"Total Gastos Pendientes de Pago";"";"";"";"${sumPending}";"";"";"";"";""`);
    rows.push(`"Total General de Gastos Computables";"";"";"";"${sumTotal}";"";"";"";"";""`);
    rows.push(`"Superávit / Balance Operativo Neto";"";"";"";"${netOperatingBalance}";"";"";"";"";""`);

    const csvContent = rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Finanzas_Familia_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Yield Simulation Calculations across the 4 on-demand liquidity funds/wallets + Plazo Fijo
  const yieldSimulations = useMemo(() => {
    const amount = simAmount > 0 ? simAmount : 100000;

    // 1. Mercado Pago
    const mpDaily = (amount * (yieldRates.mercadoPagoTNA / 100)) / 365;
    const mpMonthly = (amount * (yieldRates.mercadoPagoTNA / 100)) / 12;

    // 2. App YPF
    const ypfDaily = (amount * (yieldRates.appYpfTNA / 100)) / 365;
    const ypfMonthly = (amount * (yieldRates.appYpfTNA / 100)) / 12;

    // 3. Fondo Pellegrini BNA
    const pellegriniDaily = (amount * (yieldRates.fondoPellegriniTNA / 100)) / 365;
    const pellegriniMonthly = (amount * (yieldRates.fondoPellegriniTNA / 100)) / 12;

    // 4. Fondo Macro en Pesos
    const macroPesosDaily = (amount * (yieldRates.fondoMacroPesosTNA / 100)) / 365;
    const macroPesosMonthly = (amount * (yieldRates.fondoMacroPesosTNA / 100)) / 12;

    // Actual actual invested yields for Fondo Macro Pesos
    const macroPesosActualDaily = (yieldRates.fondoMacroPesosSaldo * (yieldRates.fondoMacroPesosTNA / 100)) / 365;
    const macroPesosActualMonthly = (yieldRates.fondoMacroPesosSaldo * (yieldRates.fondoMacroPesosTNA / 100)) / 12;

    // Fondo Macro en Dólares (Valuación en Pesos usando Dólar Oficial BNA o Blue)
    const valuationCurrency = yieldRates.macroValuationCurrency || 'oficial';
    const activeDollarRate = valuationCurrency === 'oficial'
      ? (yieldRates.dolarOficial > 0 ? yieldRates.dolarOficial : 1570)
      : (yieldRates.dolarBlue > 0 ? yieldRates.dolarBlue : 1195);

    const macroDolaresPesosEquiv = yieldRates.fondoMacroDolaresCapital * activeDollarRate;
    const macroDolaresAnnualUSD = (yieldRates.fondoMacroDolaresCapital * (yieldRates.fondoMacroDolaresTNA / 100));
    const macroDolaresMonthlyUSD = macroDolaresAnnualUSD / 12;
    const macroDolaresAnnualARS = macroDolaresAnnualUSD * activeDollarRate;

    // Total Patrimonio Invertido a Resguardo (NO computado en saldo corriente de gastos)
    const totalPatrimonioResguardoARS = yieldRates.fondoMacroPesosSaldo + macroDolaresPesosEquiv;

    // Plazo Fijo (30 días)
    const pfMonthly = (amount * (yieldRates.plazoFijoTNA / 100)) / 12;
    const dolarOficialAmount = yieldRates.dolarOficial > 0 ? amount / yieldRates.dolarOficial : 0;

    // Ranked list of 4 on-demand wallets/funds
    const onDemandWallets = [
      {
        id: 'pellegrini',
        name: 'Fondo Pellegrini (BNA)',
        tna: yieldRates.fondoPellegriniTNA,
        daily: pellegriniDaily,
        monthly: pellegriniMonthly,
        badgeColor: 'bg-cyan-500',
        textColor: 'text-cyan-400',
        bgColor: 'bg-cyan-950/40 border-cyan-500/40',
        icon: 'Landmark',
      },
      {
        id: 'macro_pesos',
        name: 'Fondo Macro Pesos',
        tna: yieldRates.fondoMacroPesosTNA,
        daily: macroPesosDaily,
        monthly: macroPesosMonthly,
        badgeColor: 'bg-indigo-500',
        textColor: 'text-indigo-400',
        bgColor: 'bg-indigo-950/40 border-indigo-500/40',
        icon: 'Building2',
      },
      {
        id: 'ypf',
        name: 'App YPF Dinero',
        tna: yieldRates.appYpfTNA,
        daily: ypfDaily,
        monthly: ypfMonthly,
        badgeColor: 'bg-blue-500',
        textColor: 'text-blue-400',
        bgColor: 'bg-blue-950/40 border-blue-500/40',
        icon: 'Fuel',
      },
      {
        id: 'mp',
        name: 'Mercado Pago',
        tna: yieldRates.mercadoPagoTNA,
        daily: mpDaily,
        monthly: mpMonthly,
        badgeColor: 'bg-sky-500',
        textColor: 'text-sky-400',
        bgColor: 'bg-sky-950/40 border-sky-500/40',
        icon: 'Smartphone',
      },
    ].sort((a, b) => b.tna - a.tna);

    const bestOnDemand = onDemandWallets[0];

    return {
      mpDaily,
      mpMonthly,
      ypfDaily,
      ypfMonthly,
      pellegriniDaily,
      pellegriniMonthly,
      macroPesosDaily,
      macroPesosMonthly,
      macroPesosActualDaily,
      macroPesosActualMonthly,
      macroDolaresPesosEquiv,
      macroDolaresAnnualUSD,
      macroDolaresMonthlyUSD,
      macroDolaresAnnualARS,
      totalPatrimonioResguardoARS,
      activeDollarRate,
      valuationCurrency,
      pfMonthly,
      dolarOficialAmount,
      onDemandWallets,
      bestOnDemand,
    };
  }, [simAmount, yieldRates]);

  // Campo expenses calculations for selected period
  const campoExpenses = useMemo(() => {
    return periodTransactions.filter(t => t.costCenter === 'campo');
  }, [periodTransactions]);

  const totalCampo = useMemo(() => {
    return campoExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [campoExpenses]);

  // Renato calculations for selected period
  const renatoExpenses = useMemo(() => {
    return periodTransactions.filter(t => t.costCenter === 'renato');
  }, [periodTransactions]);

  const totalRenato = useMemo(() => {
    return renatoExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [renatoExpenses]);

  // Filtered bills for Vencimientos module within the selected month
  const filteredBills = useMemo(() => {
    return currentMonthBills.filter(b => {
      const matchGroup = billsFilterGroup === 'all' || b.group === billsFilterGroup;
      const matchMethod = billsFilterPaymentMethod === 'all' || b.paymentMethod === billsFilterPaymentMethod;
      return matchGroup && matchMethod;
    });
  }, [currentMonthBills, billsFilterGroup, billsFilterPaymentMethod]);

  // Status badge for bills
  const getBillStatusBadge = (bill: Bill) => {
    if (bill.isAnnual) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
          <ShieldCheck className="w-3.5 h-3.5" /> Pago Anual
        </span>
      );
    }
    if (bill.status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> Pagado
        </span>
      );
    }
    const days = getDaysDiff(bill.dueDate);
    if (days < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" /> Vencido ({Math.abs(days)}d)
        </span>
      );
    }
    if (days <= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40">
          <AlertTriangle className="w-3.5 h-3.5" /> Vence {days === 0 ? 'hoy' : `en ${days}d`}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <Clock className="w-3.5 h-3.5" /> Pendiente ({days}d)
      </span>
    );
  };

  const getGroupBadge = (group: BillGroup) => {
    switch (group) {
      case 'hogar':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">🏠 Hogar (YO)</span>;
      case 'tarjetas':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">💳 Tarjetas & Stream</span>;
      case 'movilidad':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">🚗 Movilidad</span>;
      case 'renato':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">⚽ Renato</span>;
      case 'lorena':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold">🧘 Lorena</span>;
      case 'campo':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">🚜 El Campo</span>;
      case 'mama':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">💜 Mamá</span>;
    }
  };

  const getPaymentMethodBadge = (bill: Bill) => {
    switch (bill.paymentMethod) {
      case 'debito_cuenta':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-sky-950/80 text-sky-300 border border-sky-500/30 font-medium">
            <Landmark className="w-3 h-3 text-sky-400" />
            <span>Débito en Cta: <strong className="text-white">{bill.paymentMethodDetail || 'Banco'}</strong></span>
          </span>
        );
      case 'debito_tarjeta':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 font-medium">
            <CreditCard className="w-3 h-3 text-indigo-400" />
            <span>Débito en Tarjeta: <strong className="text-white">{bill.paymentMethodDetail || 'Plástico'}</strong></span>
          </span>
        );
      case 'pago_manual':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-500/30 font-medium">
            <Smartphone className="w-3 h-3 text-amber-400" />
            <span>Pago Manual: <strong className="text-white">{bill.paymentMethodDetail || 'Manual'}</strong></span>
          </span>
        );
    }
  };

  // Pay bill handlers
  const handleInitiatePayBill = (bill: Bill) => {
    setSelectedBillToPay(bill);
    if (bill.group === 'mama') {
      setPayFromAccountId('mama_bsf');
    } else if (bill.paymentMethodDetail.toLowerCase().includes('bna') || bill.paymentMethodDetail.toLowerCase().includes('nación')) {
      setPayFromAccountId('banco_nacion');
    } else if (bill.paymentMethodDetail.toLowerCase().includes('macro')) {
      setPayFromAccountId('banco_macro');
    } else if (bill.paymentMethodDetail.toLowerCase().includes('mercado pago') || bill.paymentMethodDetail.toLowerCase().includes('mp')) {
      setPayFromAccountId('mercado_pago');
    } else {
      setPayFromAccountId('banco_santa_fe');
    }
    setIsPayBillModalOpen(true);
  };

  const handleConfirmPayBill = (confirmedAmount?: number) => {
    if (!selectedBillToPay) return;
    const finalAmount = confirmedAmount !== undefined ? confirmedAmount : selectedBillToPay.amount || 0;
    const isMama = selectedBillToPay.group === 'mama';
    const chosenAccId = payFromAccountId;

    if (isMama) {
      setMamaAccounts(prev =>
        prev.map(acc => (acc.id === chosenAccId ? { ...acc, balance: Math.max(0, acc.balance - finalAmount) } : acc))
      );
    } else {
      setAccounts(prev =>
        prev.map(acc => (acc.id === chosenAccId ? { ...acc, balance: acc.balance - finalAmount } : acc))
      );
    }

    setBills(prev =>
      prev.map(b =>
        b.id === selectedBillToPay.id
          ? {
              ...b,
              amount: finalAmount,
              status: 'paid',
              paidAt: new Date().toISOString().split('T')[0],
              paidFromAccountId: chosenAccId,
            }
          : b
      )
    );

    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: `Pago ${selectedBillToPay.title} (${selectedBillToPay.provider})`,
      amount: finalAmount,
      type: 'expense',
      accountId: chosenAccId,
      costCenter: selectedBillToPay.group === 'campo' ? 'campo' : selectedBillToPay.group === 'renato' ? 'renato' : selectedBillToPay.group === 'lorena' ? 'lorena' : selectedBillToPay.group === 'mama' ? 'mama' : 'hogar',
      owner: isMama ? 'mama' : 'personal',
    };
    setTransactions(prev => [newTx, ...prev]);

    setIsPayBillModalOpen(false);
    setSelectedBillToPay(null);
  };

  // Start new month button
  const handleStartNewMonth = () => {
    if (!window.confirm('¿Deseás iniciar un Nuevo Mes? Esto clonará la plantilla de servicios, reseteará todos los estados a "Pendiente" y pondrá las facturas variables listas para recibir los nuevos comprobantes ("A confirmar").')) {
      return;
    }

    setBills(prev =>
      prev.map(bill => {
        const isFixed =
          bill.id === 'f_julian_campo' ||
          bill.id === 'c_ford_giorgi' ||
          bill.id === 'c_territory' ||
          bill.id === 'a_estudio_contable' ||
          bill.id === 'g_estudio_mama' ||
          bill.id === 'a_monotributo' ||
          bill.id === 'g_monotributo_mama' ||
          bill.id === 'a_alarma' ||
          bill.id === 'd_colegio_rena';

        return {
          ...bill,
          status: bill.isAnnual ? 'paid' : 'pending',
          paidAt: undefined,
          paidFromAccountId: undefined,
          amount: bill.isAnnual ? null : isFixed ? bill.amount : null,
        };
      })
    );

    alert('¡Nuevo mes iniciado con éxito! Todas las cuentas y vencimientos fueron actualizados.');
  };

  // Global document uploader
  const handleGlobalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocName(file.name);
    processUploadedDocument(file.name);
  };

  const processUploadedDocument = (fileName: string) => {
    setIsExtractingDoc(true);
    setExtractedDocData(null);
    setIsImportModalOpen(true);

    setTimeout(() => {
      setIsExtractingDoc(false);
      const lower = fileName.toLowerCase();

      let matchedId = 'a_epe';
      let title = 'EPE Santa Fe';
      let provider = 'Empresa Provincial de la Energía';
      let amount = 41200;
      let dueDate = '2026-11-09';
      let group: BillGroup = 'hogar';
      let paymentMethod: PaymentMethodType = 'pago_manual';
      let paymentMethodDetail = 'Pago Manual';

      if (lower.includes('gas') || lower.includes('litoral')) {
        matchedId = lower.includes('mama') ? 'g_gas_mama' : 'a_gas';
        title = lower.includes('mama') ? 'GAS Mamá' : 'GAS (Litoral Gas)';
        provider = 'Litoral Gas S.A.';
        amount = 16400;
        dueDate = '2026-11-19';
        group = lower.includes('mama') ? 'mama' : 'hogar';
        paymentMethod = 'pago_manual';
        paymentMethodDetail = lower.includes('mama') ? 'Pago Manual / Débito BSF' : 'Pago Manual';
      } else if (lower.includes('agua')) {
        matchedId = lower.includes('mama') ? 'g_agua_mama' : 'a_agua';
        title = lower.includes('mama') ? 'AGUA' : 'AGUA';
        provider = 'Aguas Santafesinas S.A.';
        amount = 12900;
        dueDate = '2026-11-13';
        group = lower.includes('mama') ? 'mama' : 'hogar';
      } else if (lower.includes('rural') || lower.includes('inmobiliario rural')) {
        matchedId = 'f_inmob_rural';
        title = 'Inmobiliario Rural';
        provider = 'API Santa Fe Rural';
        amount = 51000;
        dueDate = '2026-11-20';
        group = 'campo';
      } else if (lower.includes('patente')) {
        matchedId = 'c_patente';
        title = 'Patente Automotor';
        provider = 'Comuna / API Patentes';
        amount = 38000;
        dueDate = '2026-11-25';
        group = 'movilidad';
      } else if (lower.includes('epe mama') || lower.includes('luz mama')) {
        matchedId = 'g_epe_mama';
        title = 'EPE Mamá';
        provider = 'Empresa Provincial de la Energía';
        amount = 22800;
        dueDate = '2026-11-09';
        group = 'mama';
      }

      setExtractedDocData({
        serviceId: matchedId,
        title,
        provider,
        amount,
        dueDate,
        group,
        paymentMethod,
        paymentMethodDetail,
        notes: `Factura extraída automáticamente de ${fileName}`,
      });
    }, 1200);
  };

  const handleApplyImportedDoc = () => {
    if (!extractedDocData) return;

    setBills(prev => {
      const exists = prev.some(b => b.id === extractedDocData.serviceId);
      if (exists) {
        return prev.map(b =>
          b.id === extractedDocData.serviceId
            ? {
                ...b,
                amount: extractedDocData.amount,
                dueDate: extractedDocData.dueDate || b.dueDate,
                notes: extractedDocData.notes,
              }
            : b
        );
      } else {
        const newBill: Bill = {
          id: 'b_doc_' + Date.now(),
          title: extractedDocData.title,
          provider: extractedDocData.provider,
          amount: extractedDocData.amount,
          dueDate: extractedDocData.dueDate,
          dueDay: parseInt(extractedDocData.dueDate.split('-')[2] || '10', 10),
          group: extractedDocData.group,
          paymentMethod: extractedDocData.paymentMethod,
          paymentMethodDetail: extractedDocData.paymentMethodDetail,
          status: 'pending',
          notes: extractedDocData.notes,
        };
        return [newBill, ...prev];
      }
    });

    setIsImportModalOpen(false);
    setExtractedDocData(null);
    if (globalFileInputRef.current) globalFileInputRef.current.value = '';
    alert('¡Factura clasificada y agendada con éxito!');
  };

  const toggleNeed = (id: string) => {
    setShoppingList(prev => prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item)));
  };

  const addNeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNeedTitle.trim()) return;
    const item: ShoppingNeed = {
      id: 'sn_' + Date.now(),
      title: newNeedTitle.trim(),
      urgent: newNeedUrgent,
      completed: false,
    };
    setShoppingList([item, ...shoppingList]);
    setNewNeedTitle('');
    setNewNeedUrgent(false);
  };

  const removeNeed = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-28 select-none">
      {/* Hidden Global Document Input */}
      <input
        type="file"
        ref={globalFileInputRef}
        accept="application/pdf, image/*"
        onChange={handleGlobalFileUpload}
        className="hidden"
      />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3.5 py-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white">Contador de Familia</h1>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Scilingo Hnos. • Renta Campo • Macro & BNA</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isPWAInstalled && (
              <button
                onClick={handleInstallPWA}
                title="Instalar App en Celular o PC"
                className="flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-2 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-950/40 cursor-pointer animate-pulse"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Instalar</span>
              </button>
            )}

            <button
              onClick={() => globalFileInputRef.current?.click()}
              title="Subir Factura o Captura de Correo"
              className="flex items-center gap-1 text-[11px] font-semibold bg-indigo-600/90 hover:bg-indigo-500 text-white px-2 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Factura</span>
            </button>

            <button
              onClick={() => setIsNewTxModalOpen(true)}
              className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </div>

        {/* PERIOD SELECTOR & EXCEL EXPORT BAR */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          {/* Month / Period Dropdown */}
          <div className="flex items-center gap-1.5 flex-1 max-w-[210px] relative">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="relative w-full">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-2.5 py-1.5 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer pr-7 shadow-inner"
              >
                {AVAILABLE_MONTHS.map(m => (
                  <option key={m.key} value={m.key}>
                    📅 {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Export to Excel Button (Direct Download) */}
          <button
            onClick={handleExportToExcel}
            title={`Exportar planilla del mes (${currentMonthLabel}) a Excel / CSV`}
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar a Excel</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 space-y-4">
        {/* Urgent Alert Banner */}
        {urgentBills.length > 0 && activeTab !== 'vencimientos' && (
          <div
            onClick={() => setActiveTab('vencimientos')}
            className="bg-gradient-to-r from-rose-950/80 to-amber-950/80 border border-rose-500/50 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer shadow-lg shadow-rose-950/40 hover:border-rose-400 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <BadgeAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-200">
                  {urgentBills.length} Vencimiento{urgentBills.length > 1 ? 's' : ''} crítico{urgentBills.length > 1 ? 's' : ''} (48 hs)
                </p>
                <p className="text-[11px] text-slate-300">
                  {urgentBills.map(b => `${b.title}`).slice(0, 2).join(', ')}
                  {urgentBills.length > 2 ? ' y más...' : ''}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400 shrink-0" />
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 1: DASHBOARD Y BALANCE GENERAL */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Balance General Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-5 border border-slate-800 shadow-xl">
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" /> Saldo Consolidado Disponible
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Tiempo Real
                </span>
              </div>

              <div className="text-3xl font-black text-white tracking-tight mt-1 mb-3">
                {formatARS(totalBalance)}
              </div>

              {/* Inflow vs Outflow */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Ingresos Totales Mes
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    +{formatARS(monthlyIncome)}
                  </div>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Gastos Totales
                  </div>
                  <div className="text-sm font-bold text-rose-400">
                    -{formatARS(monthlyExpenses)}
                  </div>
                </div>
              </div>

              {/* Net Balance Real-time Row */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Balance Neto del Mes (Superávit):</span>
                <span className={`font-black text-sm ${netOperatingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netOperatingBalance >= 0 ? '+' : ''}{formatARS(netOperatingBalance)}
                </span>
              </div>
            </div>

            {/* SECCIÓN 1: COTIZACIÓN DEL DÓLAR EN VIVO (DÓLAR API REAL-TIME & EDICIÓN MANUAL) */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Cotización Dólar Oficial & Blue
                    </h2>
                    <p className="text-[10px] text-slate-400">Banco Nación (BNA) • InfoDólar Rosario</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {yieldRates.lastDollarFetch ? `Actualizado ${yieldRates.lastDollarFetch}` : 'Online'}
                  </span>
                  <button
                    onClick={() => setIsEditingDollar(!isEditingDollar)}
                    title="Editar cotizaciones de dólar a mano"
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button
                    onClick={fetchDollarQuotes}
                    disabled={isFetchingDollar}
                    title="Actualizar cotización"
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDollar ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Formulario rápido para editar cotizaciones del Dólar */}
              {isEditingDollar && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-emerald-500/40 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400">Ajuste Manual Rápido de Cotizaciones</span>
                    <button
                      onClick={() => setIsEditingDollar(false)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-emerald-400 block font-semibold">Dólar BNA Venta ($)</label>
                      <input
                        type="number"
                        value={yieldRates.dolarOficial}
                        onChange={e => setYieldRates({ ...yieldRates, dolarOficial: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-emerald-400 block font-semibold">Dólar BNA Compra ($)</label>
                      <input
                        type="number"
                        value={yieldRates.dolarOficialCompra}
                        onChange={e => setYieldRates({ ...yieldRates, dolarOficialCompra: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-sky-400 block font-semibold">Dólar Blue Venta ($) (Rosario)</label>
                      <input
                        type="number"
                        value={yieldRates.dolarBlue}
                        onChange={e => setYieldRates({ ...yieldRates, dolarBlue: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-sky-400 block font-semibold">Dólar Blue Compra ($) (Rosario)</label>
                      <input
                        type="number"
                        value={yieldRates.dolarBlueCompra}
                        onChange={e => setYieldRates({ ...yieldRates, dolarBlueCompra: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                {/* Dólar Oficial (Banco Nación - BNA) */}
                <div
                  onClick={() => setIsEditingDollar(true)}
                  title="Tocar para editar cotización Dólar Oficial BNA"
                  className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/30 space-y-1 cursor-pointer hover:border-emerald-400/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Dólar Oficial (BNA)
                    </span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/20 font-semibold">
                      Banco Nación
                    </span>
                  </div>
                  <div className="pt-1 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Venta</span>
                      <span className="text-lg font-black text-white">${yieldRates.dolarOficial.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Compra</span>
                      <span className="text-xs font-bold text-slate-300">${yieldRates.dolarOficialCompra.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 flex items-center justify-between pt-0.5">
                    <span>Ref. BNA</span>
                    <span className="text-emerald-400/80 underline font-medium">Tocar p/ editar</span>
                  </p>
                </div>

                {/* Dólar Blue (Rosario / InfoDólar) */}
                <div
                  onClick={() => setIsEditingDollar(true)}
                  title="Tocar para editar cotización Dólar Blue Rosario"
                  className="bg-slate-950/80 p-3 rounded-2xl border border-sky-500/30 space-y-1 cursor-pointer hover:border-sky-400/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-sky-400" /> Dólar Blue (Rosario)
                    </span>
                    <span className="text-[9px] bg-sky-950 text-sky-300 px-1.5 py-0.2 rounded border border-sky-500/20 font-semibold">
                      InfoDólar
                    </span>
                  </div>
                  <div className="pt-1 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Venta</span>
                      <span className="text-lg font-black text-white">${yieldRates.dolarBlue.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Compra</span>
                      <span className="text-xs font-bold text-slate-300">${yieldRates.dolarBlueCompra.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 flex items-center justify-between pt-0.5">
                    <span>Mercado Local</span>
                    <span className="text-sky-400/80 underline font-medium">Tocar p/ editar</span>
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: OPTIMIZADOR DE RENDIMIENTOS (4 FONDOS / BILLETERAS A LA VISTA) */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                      Rendimientos & Liquidez a la Vista (4 Opciones)
                    </h2>
                    <p className="text-[10px] text-slate-400">Macro Pesos vs. Pellegrini BNA vs. App YPF vs. Mercado Pago</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingRates(!isEditingRates)}
                  className="text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sliders className="w-3 h-3" /> {isEditingRates ? 'Cerrar' : 'Editar Tasas'}
                </button>
              </div>

              {/* Configurable Rates form with Macro and Pellegrini BNA */}
              {isEditingRates && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-indigo-500/40 space-y-2.5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-indigo-400 block mb-0.5 font-semibold">Fondo Macro Pesos (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={yieldRates.fondoMacroPesosTNA}
                        onChange={e => setYieldRates({ ...yieldRates, fondoMacroPesosTNA: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-indigo-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cyan-400 block mb-0.5 font-semibold">Pellegrini BNA (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={yieldRates.fondoPellegriniTNA}
                        onChange={e => setYieldRates({ ...yieldRates, fondoPellegriniTNA: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-cyan-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-blue-400 block mb-0.5 font-semibold">App YPF (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={yieldRates.appYpfTNA}
                        onChange={e => setYieldRates({ ...yieldRates, appYpfTNA: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-blue-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-sky-400 block mb-0.5 font-semibold">Mercado Pago (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={yieldRates.mercadoPagoTNA}
                        onChange={e => setYieldRates({ ...yieldRates, mercadoPagoTNA: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-emerald-400 block mb-0.5 font-semibold">Plazo Fijo (30d %)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={yieldRates.plazoFijoTNA}
                        onChange={e => setYieldRates({ ...yieldRates, plazoFijoTNA: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-emerald-300 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Amount selector */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSimAmount(100000)}
                  className={`flex-1 py-1 px-2 text-[11px] rounded-lg border font-semibold transition-all cursor-pointer ${
                    simAmount === 100000 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  $100.000
                </button>
                <button
                  onClick={() => setSimAmount(500000)}
                  className={`flex-1 py-1 px-2 text-[11px] rounded-lg border font-semibold transition-all cursor-pointer ${
                    simAmount === 500000 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  $500.000
                </button>
                <button
                  onClick={() => setSimAmount(totalBalance)}
                  className={`flex-1 py-1 px-2 text-[11px] rounded-lg border font-semibold transition-all cursor-pointer truncate ${
                    simAmount === totalBalance ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Todo ({formatARS(totalBalance)})
                </button>
              </div>

              {/* COMPARATIVA DE LAS 4 OPCIONES A LA VISTA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider">
                    Semáforo de Liquidez Inmediata (Disponibilidad 24/7)
                  </span>
                  <span className="text-[10px] text-slate-400">Rescate Inmediato</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {yieldSimulations.onDemandWallets.map((w, idx) => {
                    const isWinner = idx === 0;

                    return (
                      <div
                        key={w.id}
                        className={`p-3 rounded-2xl border transition-all relative ${
                          isWinner
                            ? 'bg-gradient-to-br from-cyan-950/70 to-slate-900 border-cyan-500/70 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        {isWinner && (
                          <span className="absolute -top-2.5 right-1.5 text-[8px] font-black bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded-full shadow">
                            🏆 LÍDER
                          </span>
                        )}

                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[11px] font-bold flex items-center gap-1 truncate ${w.textColor}`}>
                            {w.id === 'pellegrini' ? <Landmark className="w-3 h-3 shrink-0" /> : w.id === 'macro_pesos' ? <Building2 className="w-3 h-3 shrink-0" /> : w.id === 'ypf' ? <Fuel className="w-3 h-3 shrink-0" /> : <Smartphone className="w-3 h-3 shrink-0" />}
                            <span className="truncate">{w.name}</span>
                          </span>
                        </div>
                        <div className="text-xs font-black text-white mb-1.5">{w.tna}% TNA</div>

                        <div className="space-y-0.5 pt-1 text-[11px] border-t border-slate-800">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Diario:</span>
                            <strong className="text-emerald-400 font-bold">+{formatARS(w.daily)}</strong>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Mensual:</span>
                            <strong className="text-white font-semibold">+{formatARS(w.monthly)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alerta Inteligente del Contador */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-500/40 flex items-start gap-2.5 text-xs shadow">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-slate-200 text-[11px] leading-relaxed">
                    <strong>Alerta de Estrategia Diaria:</strong> Con dinero disponible en cuenta 24/7, hoy el <strong>{yieldSimulations.bestOnDemand.name}</strong> lidera con un <strong>{yieldSimulations.bestOnDemand.tna}% TNA</strong>, generando <strong>+{formatARS(yieldSimulations.bestOnDemand.daily)} por día</strong> para {formatARS(simAmount)} sin inmovilizar los fondos.
                  </p>
                  <p className="text-slate-400 text-[10px] leading-relaxed border-t border-slate-800/80 pt-1">
                    Fondo Macro en Pesos ({yieldRates.fondoMacroPesosTNA}%) y Fondo Pellegrini BNA ({yieldRates.fondoPellegriniTNA}%) superan ampliamente a las billeteras tradicionales como Mercado Pago ({yieldRates.mercadoPagoTNA}%) o App YPF ({yieldRates.appYpfTNA}%).
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN DEDICADA: PATRIMONIO / INVERSIONES A RESGUARDO (FONDOS BANCO MACRO) */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border-2 border-indigo-500/50 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                        Patrimonio / Inversiones a Resguardo
                      </h2>
                      <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                        Banco Macro
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Fondos Comunes de Inversión (Pesos & Dólares)</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-indigo-300 font-semibold block">Total Invertido (Valuación MEP)</span>
                  <span className="text-sm font-black text-white">{formatARS(yieldSimulations.totalPatrimonioResguardoARS)}</span>
                </div>
              </div>

              {/* CRITERIO CONTABLE DE VISUALIZACIÓN: NOTA INFORMATIVA */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex items-start gap-2 text-xs">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-slate-300 leading-snug">
                  <strong className="text-indigo-300">Criterio Contable:</strong> Estos fondos constituyen capital patrimonial a resguardo y <strong>NO están sumados al Saldo Disponible para Gastos del Mes ({formatARS(totalBalance)})</strong>, protegiendo el flujo operativo destinado a vencimientos y cuotas.
                </p>
              </div>

              {/* GRID CON FONDO MACRO EN PESOS Y FONDO MACRO EN DÓLARES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. FONDO MACRO EN PESOS */}
                <div className="bg-slate-950/90 rounded-2xl p-3.5 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-indigo-400" /> Fondo Macro en Pesos
                    </span>
                    <span className="text-[10px] bg-indigo-950 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                      {yieldRates.fondoMacroPesosTNA}% TNA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-medium">Saldo Invertido (ARS)</label>
                      <input
                        type="number"
                        value={yieldRates.fondoMacroPesosSaldo}
                        onChange={e => setYieldRates({ ...yieldRates, fondoMacroPesosSaldo: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-medium">Tasa Rendimiento (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={yieldRates.fondoMacroPesosTNA}
                        onChange={e => setYieldRates({ ...yieldRates, fondoMacroPesosTNA: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-indigo-300 font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Rendimiento diario estimado:</span>
                      <strong className="text-emerald-400 font-bold">+{formatARS(yieldSimulations.macroPesosActualDaily)} / día</strong>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Rendimiento mensual proyectado:</span>
                      <strong className="text-white font-bold">+{formatARS(yieldSimulations.macroPesosActualMonthly)} / mes</strong>
                    </div>
                  </div>
                </div>

                {/* 2. FONDO MACRO EN DÓLARES */}
                <div className="bg-slate-950/90 rounded-2xl p-3.5 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Fondo Macro en Dólares
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                      {yieldRates.fondoMacroDolaresTNA}% TNA USD
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-medium">Capital Invertido (USD)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-500 font-bold text-xs">US$</span>
                        <input
                          type="number"
                          value={yieldRates.fondoMacroDolaresCapital}
                          onChange={e => setYieldRates({ ...yieldRates, fondoMacroDolaresCapital: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-2 py-1.5 text-white font-bold text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-medium">Tasa Anual USD (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={yieldRates.fondoMacroDolaresTNA}
                        onChange={e => setYieldRates({ ...yieldRates, fondoMacroDolaresTNA: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-300 font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[11px] flex-wrap gap-1">
                      <span className="text-slate-400">Valuación en Pesos:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setYieldRates(prev => ({ ...prev, macroValuationCurrency: 'oficial' }))}
                          title="Valuar a Dólar Oficial BNA"
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            yieldRates.macroValuationCurrency === 'oficial' || !yieldRates.macroValuationCurrency
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Oficial BNA (${yieldRates.dolarOficial.toLocaleString('es-AR')})
                        </button>
                        <button
                          type="button"
                          onClick={() => setYieldRates(prev => ({ ...prev, macroValuationCurrency: 'blue' }))}
                          title="Valuar a Dólar Blue Rosario"
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            yieldRates.macroValuationCurrency === 'blue'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Blue (${yieldRates.dolarBlue.toLocaleString('es-AR')})
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Total en ARS ({yieldRates.macroValuationCurrency === 'blue' ? 'Blue' : 'Oficial BNA'}):</span>
                      <strong className="text-emerald-400 font-bold text-xs">{formatARS(yieldSimulations.macroDolaresPesosEquiv)}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Rendimiento anual estimado en USD:</span>
                      <strong className="text-white font-bold">+US$ {yieldSimulations.macroDolaresAnnualUSD.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / año</strong>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Equivalente mensual en USD:</span>
                      <span className="text-emerald-300 font-semibold">+US$ {yieldSimulations.macroDolaresMonthlyUSD.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/mes (~{formatARS(yieldSimulations.macroDolaresAnnualARS / 12)})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: FUENTES DE INGRESOS */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Wheat className="w-4 h-4 text-amber-400" /> Fuentes de Ingresos Principales
                </h2>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  {currentMonthLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Alquiler del Campo */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-amber-500/30 space-y-1 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Tractor className="w-3.5 h-3.5 text-amber-400" /> Alquiler Campo
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                      Renta Rural
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Arrendamiento acreditado</p>
                  <p className="text-base font-black text-white pt-1">{formatARS(totalAlquilerCampo)}</p>
                </div>

                {/* 2. Comisiones Scilingo Hnos. */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/30 space-y-1 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <Wheat className="w-3.5 h-3.5 text-emerald-400" /> Scilingo Hnos.
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      Liquidación Cereal
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Comisiones de corretaje</p>
                  <p className="text-base font-black text-white pt-1">{formatARS(totalComisionesScilingo)}</p>
                </div>
              </div>

              {/* Subtotal */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subtotal Renta & Comisiones:</span>
                </div>
                <div className="font-bold text-emerald-400 text-sm">
                  {formatARS(totalAlquilerCampo + totalComisionesScilingo)}
                </div>
              </div>
            </div>

            {/* Cuentas & Billeteras Integradas */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> Cuentas & Billeteras
                </h2>
                <span className="text-[11px] text-slate-400">{accounts.length} activas</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {accounts.map(acc => {
                  const isYPF = acc.id === 'app_ypf';
                  return (
                    <div
                      key={acc.id}
                      className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden ${
                        isYPF
                          ? 'bg-gradient-to-br from-blue-950/70 to-slate-900 border-blue-500/50 shadow-md shadow-blue-950/40'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-xl ${acc.color} text-white flex items-center justify-center shadow-sm`}>
                          {isYPF ? <Fuel className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        </div>
                        {acc.badge && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isYPF ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {acc.badge}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-200 truncate">{acc.name}</div>
                      <div className="text-base font-bold text-white mt-0.5">{formatARS(acc.balance)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 2: MIS VENCIMIENTOS E IMPUESTOS COMPLETO */}
        {/* ============================================================== */}
        {activeTab === 'vencimientos' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header with Import Button & Iniciar Nuevo Mes */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-emerald-400" /> Agenda de Vencimientos & Gastos
                </h2>
                <p className="text-xs text-slate-400">Hogar, Tarjetas, Movilidad, Renato, Campo y Mamá</p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => globalFileInputRef.current?.click()}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" /> Subir Factura / PDF
                </button>
                <button
                  onClick={handleStartNewMonth}
                  title="Clonar plantilla, resetear pagos y preparar nuevo mes"
                  className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Iniciar Nuevo Mes
                </button>
                <button
                  onClick={() => setIsNewBillModalOpen(true)}
                  className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-2 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AUDITORÍA Y CIERRE DE FIN DE MES (3 TOTALES SEPARADOS) */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-400" /> Auditoría de Cierre de Mes
                </h3>
                {toConfirmCount > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    {toConfirmCount} a confirmar
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {/* 1. Débitos en Cuenta */}
                <div className="bg-sky-950/40 border border-sky-500/30 rounded-2xl p-2.5 space-y-1">
                  <span className="text-[10px] font-bold text-sky-300 block uppercase">
                    🏦 Débito Cuenta
                  </span>
                  <span className="text-sm font-black text-white block">
                    {formatARS(reconciliationTotals.debitoCuentaTotal)}
                  </span>
                  <span className="text-[9px] text-sky-400/80 block">
                    Pend: {formatARS(reconciliationTotals.debitoCuentaPendiente)}
                  </span>
                </div>

                {/* 2. Débitos en Tarjeta */}
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-2.5 space-y-1">
                  <span className="text-[10px] font-bold text-indigo-300 block uppercase">
                    💳 Débito Tarjeta
                  </span>
                  <span className="text-sm font-black text-white block">
                    {formatARS(reconciliationTotals.debitoTarjetaTotal)}
                  </span>
                  <span className="text-[9px] text-indigo-400/80 block">
                    Resumen: {formatARS(reconciliationTotals.debitoTarjetaPendiente)}
                  </span>
                </div>

                {/* 3. Pagos Manuales */}
                <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-2.5 space-y-1">
                  <span className="text-[10px] font-bold text-amber-300 block uppercase">
                    📱 Pago Manual
                  </span>
                  <span className="text-sm font-black text-white block">
                    {formatARS(reconciliationTotals.pagoManualTotal)}
                  </span>
                  <span className="text-[9px] text-amber-400/80 block">
                    Por pagar: {formatARS(reconciliationTotals.pagoManualPendiente)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Group Filters (A-G) with Smooth Horizontal Scroll */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-semibold block">Clasificación por Destino / Unidad:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
                <button
                  onClick={() => setBillsFilterGroup('all')}
                  className={`py-1.5 px-3 rounded-xl transition-all shrink-0 cursor-pointer ${
                    billsFilterGroup === 'all' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Todos ({bills.length})
                </button>
                <button
                  onClick={() => setBillsFilterGroup('hogar')}
                  className={`py-1.5 px-3 rounded-xl transition-all shrink-0 cursor-pointer ${
                    billsFilterGroup === 'hogar' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🏠 Hogar & YO ({bills.filter(b => b.group === 'hogar').length})
                </button>
                <button
                  onClick={() => setBillsFilterGroup('tarjetas')}
                  className={`py-1.5 px-3 rounded-xl transition-all shrink-0 cursor-pointer ${
                    billsFilterGroup === 'tarjetas' ? 'bg-purple-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  💳 Tarjetas ({bills.filter(b => b.group === 'tarjetas').length})
                </button>
                <button
                  onClick={() => setBillsFilterGroup('movilidad')}
                  className={`py-1.5 px-3 rounded-xl transition-all shrink-0 cursor-pointer ${
                    billsFilterGroup === 'movilidad' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🚗 Movilidad ({bills.filter(b => b.group === 'movilidad').length})
                </button>
                <button
                  onClick={() => setBillsFilterGroup('renato')}
                  className={`py-1.5 px-3 rounded-xl transition-all shrink-0 cursor-pointer ${
                    billsFilterGroup === 'renato' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  ⚽ Renato ({bills.filter(b => b.group === 'renato').length})
                </button>
                <button
                  onClick={() => setBillsFilterGroup('lorena')}
                  className={`py-1.5 px-3 rounded-xl transition-all shrink-0 cursor-pointer ${
                    billsFilterGroup === 'lorena' ? 'bg-pink-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🧘 Lorena ({bills.filter(b => b.group === 'lorena').length})
                </button>
                <button
                  onClick={() => setBillsFilterGroup('campo')}
                  className={`py-1.5 px-3 rounded-xl transition-all shrink-0 cursor-pointer ${
                    billsFilterGroup === 'campo' ? 'bg-amber-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🚜 El Campo ({bills.filter(b => b.group === 'campo').length})
                </button>
                <button
                  onClick={() => setBillsFilterGroup('mama')}
                  className={`py-1.5 px-3 rounded-xl transition-all shrink-0 cursor-pointer ${
                    billsFilterGroup === 'mama' ? 'bg-violet-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  💜 Mamá ({bills.filter(b => b.group === 'mama').length})
                </button>
              </div>
            </div>

            {/* Filter by Payment Method */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-semibold block">Filtrar por Medio de Pago:</span>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-[11px] font-semibold">
                <button
                  onClick={() => setBillsFilterPaymentMethod('all')}
                  className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                    billsFilterPaymentMethod === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setBillsFilterPaymentMethod('debito_cuenta')}
                  className={`py-1.5 rounded-xl transition-all cursor-pointer truncate px-1 ${
                    billsFilterPaymentMethod === 'debito_cuenta' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏦 Débito Cta
                </button>
                <button
                  onClick={() => setBillsFilterPaymentMethod('debito_tarjeta')}
                  className={`py-1.5 rounded-xl transition-all cursor-pointer truncate px-1 ${
                    billsFilterPaymentMethod === 'debito_tarjeta' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💳 Débito TC
                </button>
                <button
                  onClick={() => setBillsFilterPaymentMethod('pago_manual')}
                  className={`py-1.5 rounded-xl transition-all cursor-pointer truncate px-1 ${
                    billsFilterPaymentMethod === 'pago_manual' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📱 Manual
                </button>
              </div>
            </div>

            {/* List of Bills with Real Database items */}
            <div className="space-y-3 pt-1">
              {filteredBills.map(bill => {
                const isPaid = bill.status === 'paid';
                const isToConfirm = bill.amount === null && !bill.isAnnual;

                return (
                  <div
                    key={bill.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      isPaid
                        ? 'bg-slate-900/60 border-slate-800/80 opacity-75'
                        : !bill.isAnnual && getDaysDiff(bill.dueDate) <= 2
                        ? 'bg-gradient-to-r from-rose-950/30 to-slate-900 border-rose-500/40 shadow-sm'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{bill.title}</h3>
                          {getGroupBadge(bill.group)}
                          {getBillStatusBadge(bill)}
                        </div>
                        <p className="text-xs text-slate-400">{bill.provider}</p>
                        <div className="pt-0.5">
                          {getPaymentMethodBadge(bill)}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isToConfirm ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black animate-pulse">
                            A confirmar
                          </span>
                        ) : bill.isAnnual ? (
                          <span className="text-xs font-bold text-indigo-300 block">Pago Anual</span>
                        ) : (
                          <div className="text-base font-black text-white">{formatARS(bill.amount)}</div>
                        )}

                        {!bill.isAnnual && bill.dueDate && (
                          <p className="text-[11px] text-slate-400">Vto: {bill.dueDay ? `Día ${bill.dueDay}` : formatDate(bill.dueDate)}</p>
                        )}
                      </div>
                    </div>

                    {bill.subservices && bill.subservices.length > 0 && (
                      <div className="mt-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                        <span className="text-slate-400 block mb-1">Incluye en el plástico:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {bill.subservices.map((sub, idx) => (
                            <span key={idx} className="bg-slate-900 text-slate-200 px-2 py-0.5 rounded-md border border-slate-800 text-[10px]">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {bill.notes && (
                      <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800/50">
                        {bill.notes}
                      </p>
                    )}

                    {!bill.isAnnual && (
                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                        {isPaid ? (
                          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pagado el {formatDate(bill.paidAt || '')}
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {getDaysDiff(bill.dueDate)} días restantes
                          </div>
                        )}

                        {!isPaid && (
                          <button
                            onClick={() => handleInitiatePayBill(bill)}
                            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" /> {isToConfirm ? 'Cargar Monto y Pagar' : 'Pagar / Descontar'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 3: EL CAMPO */}
        {/* ============================================================== */}
        {activeTab === 'campo' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 p-5 border border-amber-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Tractor className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">El Campo (Chacra & Animales)</h2>
                    <p className="text-xs text-amber-200/80">Renta rural, Julián ($350.000) y avicultura</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-amber-500/30">
                  <span className="text-[10px] text-amber-300 block uppercase font-bold">Renta Arrendamiento</span>
                  <span className="text-lg font-black text-emerald-400">{formatARS(totalAlquilerCampo)}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Gastos del Predio</span>
                  <span className="text-lg font-black text-rose-400">{formatARS(totalCampo)}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 text-right">
                <button
                  onClick={() => setIsNewTxModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow cursor-pointer ml-auto"
                >
                  <Plus className="w-4 h-4" /> Registrar Gasto del Campo
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-amber-400" /> Vencimientos Asociados al Predio
              </h3>
              <div className="space-y-2">
                {currentMonthBills.filter(b => b.group === 'campo').map(b => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{b.title}</span>
                      <span className="text-[10px] text-slate-400">Vence: {b.dueDay ? `Día ${b.dueDay}` : formatDate(b.dueDate)} • {b.paymentMethodDetail}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">{formatARS(b.amount)}</span>
                      {b.status === 'paid' ? (
                        <span className="text-[10px] text-emerald-400 font-semibold">🟢 Pagado</span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-semibold">🟡 Pendiente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Historial de Operaciones del Campo</h3>
                <span className="text-[11px] text-slate-400">{campoExpenses.length} registros</span>
              </div>

              <div className="space-y-2">
                {campoExpenses.map(item => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {item.campoCategory === 'gallinas' ? '🥚' : item.campoCategory === 'mascotas' ? '🐶' : item.campoCategory === 'julian' ? '👨‍🌾' : '🚜'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{item.description}</p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {formatDate(item.date)} • {item.campoCategory || 'general'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-rose-400">-{formatARS(item.amount)}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {accounts.find(a => a.id === item.accountId)?.name || 'Cuenta'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 4: ESCÁNER DE TICKETS & ALMACÉN */}
        {/* ============================================================== */}
        {activeTab === 'scanner' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-lg shadow-emerald-950">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Relevador de Compras & Supermercado</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Registrá tickets de Supermercado y SuperRural para auditar aumentos de precios en la canasta básica.
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-1">
                <button
                  onClick={() => globalFileInputRef.current?.click()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/50 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Camera className="w-4 h-4" /> Tomar Foto / Subir Ticket
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Canasta de Precios Frecuentes
                </h3>
                <span className="text-[11px] text-slate-400">Nov 2026</span>
              </div>

              <div className="space-y-2">
                {basket.map(item => {
                  const diff = item.currentPrice - item.previousPrice;
                  const percent = item.previousPrice > 0 ? ((diff / item.previousPrice) * 100).toFixed(1) : 0;
                  const isIncreased = diff > 0;

                  return (
                    <div key={item.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-200">{item.name}</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{item.unit}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Rubro: {item.category} • Previo: {formatARS(item.previousPrice)}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-white">{formatARS(item.currentPrice)}</div>
                        {isIncreased ? (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30 flex items-center gap-0.5 justify-end">
                            <TrendingUp className="w-3 h-3" /> +{percent}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Estable</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-amber-400" /> Lista de Faltantes para el Súper
                </h3>
                <span className="text-[11px] text-amber-400">
                  {shoppingList.filter(s => !s.completed).length} pendientes
                </span>
              </div>

              <form onSubmit={addNeed} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar faltante..."
                  value={newNeedTitle}
                  onChange={e => setNewNeedTitle(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-1.5">
                {shoppingList.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleNeed(item.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      item.completed ? 'bg-slate-950/60 border-slate-800/60 opacity-60 line-through' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span className="text-xs font-medium text-slate-200">{item.title}</span>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeNeed(item.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 5: GESTIÓN EXCLUSIVA DE MI MAMÁ (BANCO SANTA FE) */}
        {/* ============================================================== */}
        {activeTab === 'mama' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-900 p-4 rounded-3xl border border-purple-500/30">
              <div className="flex items-center gap-2 mb-1">
                <HeartHandshake className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Finanzas & Vencimientos de Mamá</h2>
              </div>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                Gestión administrativa independiente en Banco Santa Fe. Solo jubilación, cuentas bancarias e impuestos a su nombre.
              </p>

              <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-purple-300 font-bold block">
                    Saldo Total Mamá
                  </span>
                  <span className="text-2xl font-black text-white">{formatARS(totalMamaBalance)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-purple-300 block">Jubilación Acreditada</span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    Al día
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cuentas Bancarias Independientes</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {mamaAccounts.map(mAcc => (
                  <div key={mAcc.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl ${mAcc.color} text-white flex items-center justify-center`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {mAcc.badge}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-200">{mAcc.name}</div>
                    <div className="text-base font-black text-white mt-0.5">{formatARS(mAcc.balance)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Servicios de Mamá ({currentMonthLabel})</span>
                <span className="text-[10px] text-purple-400">{currentMonthBills.filter(b => b.group === 'mama').length} ítems</span>
              </h3>

              <div className="space-y-2">
                {currentMonthBills.filter(b => b.group === 'mama').map(bill => (
                  <div key={bill.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{bill.title}</span>
                        {getBillStatusBadge(bill)}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Vto: Día {bill.dueDay} • {bill.paymentMethodDetail}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-white">{formatARS(bill.amount)}</div>
                      {bill.status !== 'paid' && (
                        <button
                          onClick={() => handleInitiatePayBill(bill)}
                          className="mt-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          Pagar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 6: SEGMENTACIÓN Y GASTOS DE RENATO */}
        {/* ============================================================== */}
        {activeTab === 'renato' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 p-5 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 font-bold">
                    ⚽
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Auditoría de Gastos de Renato</h2>
                    <p className="text-xs text-slate-400">Colegio, Club, Fútbol, Gimnasio y Roller ({currentMonthLabel})</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">
                    Total Destinado en el Mes
                  </span>
                  <span className="text-2xl font-black text-emerald-400">{formatARS(totalRenato)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">% de Egresos</span>
                  <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                    {((totalRenato / (monthlyExpenses || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Actividades y Cuotas de Renato</h3>
              <div className="space-y-2">
                {currentMonthBills.filter(b => b.group === 'renato').map(bill => (
                  <div key={bill.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{bill.title}</span>
                        {getBillStatusBadge(bill)}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Vto: {bill.dueDay ? `Día ${bill.dueDay}` : 'Anual'} • {bill.paymentMethodDetail}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-white">{formatARS(bill.amount)}</div>
                      {bill.status !== 'paid' && !bill.isAnnual && (
                        <button
                          onClick={() => handleInitiatePayBill(bill)}
                          className="mt-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          Pagar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: CLASIFICAR FACTURA / COMPROBANTE SUBIDO */}
      {/* ============================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Clasificador de Documentos</h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setExtractedDocData(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isExtractingDoc ? (
              <div className="p-6 bg-slate-950 rounded-2xl border border-indigo-500/30 text-center space-y-2 animate-pulse">
                <Sparkles className="w-7 h-7 text-indigo-400 mx-auto animate-spin" />
                <p className="text-xs font-bold text-white">Analizando documento con IA...</p>
                <p className="text-[10px] text-slate-400">Extrayendo emisor, importe, vencimiento y medio de pago sugerido</p>
              </div>
            ) : extractedDocData ? (
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span className="truncate font-semibold">{docName || 'Comprobante digital'}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                    Autocompletado
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Servicio Detectado / Título</label>
                    <input
                      type="text"
                      value={extractedDocData.title}
                      onChange={e => setExtractedDocData({ ...extractedDocData, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Importe Extraído ($)</label>
                      <input
                        type="number"
                        value={extractedDocData.amount}
                        onChange={e => setExtractedDocData({ ...extractedDocData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Fecha de Vencimiento</label>
                      <input
                        type="date"
                        value={extractedDocData.dueDate}
                        onChange={e => setExtractedDocData({ ...extractedDocData, dueDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Destino / Unidad</label>
                      <select
                        value={extractedDocData.group}
                        onChange={e => setExtractedDocData({ ...extractedDocData, group: e.target.value as BillGroup })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="hogar">🏠 Hogar & YO</option>
                        <option value="tarjetas">💳 Tarjetas & Streaming</option>
                        <option value="movilidad">🚗 Movilidad</option>
                        <option value="renato">⚽ Renato</option>
                        <option value="lorena">🧘 Lorena</option>
                        <option value="campo">🚜 El Campo</option>
                        <option value="mama">💜 Mamá</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Medio de Pago</label>
                      <select
                        value={extractedDocData.paymentMethod}
                        onChange={e => setExtractedDocData({ ...extractedDocData, paymentMethod: e.target.value as PaymentMethodType })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="pago_manual">📱 Pago Manual</option>
                        <option value="debito_cuenta">🏦 Débito en Cuenta</option>
                        <option value="debito_tarjeta">💳 Débito en Tarjeta</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleApplyImportedDoc}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Agendar y Actualizar Vencimiento
                  </button>
                  <button
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setExtractedDocData(null);
                    }}
                    className="bg-slate-800 text-slate-300 font-semibold text-xs px-3 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR PAGO Y DESCONTAR SALDO */}
      {/* ============================================================== */}
      {isPayBillModalOpen && selectedBillToPay && (
        <PayBillConfirmModal
          bill={selectedBillToPay}
          accounts={selectedBillToPay.group === 'mama' ? mamaAccounts : accounts}
          defaultAccountId={payFromAccountId}
          onClose={() => {
            setIsPayBillModalOpen(false);
            setSelectedBillToPay(null);
          }}
          onConfirm={(finalAmount, chosenAccId) => {
            setPayFromAccountId(chosenAccId);
            handleConfirmPayBill(finalAmount);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: NUEVA TRANSACCIÓN (CON FUENTES PREDETERMINADAS) */}
      {/* ============================================================== */}
      {isNewTxModalOpen && (
        <NewTransactionModal
          accounts={accounts}
          mamaAccounts={mamaAccounts}
          initialCostCenter={activeTab === 'campo' ? 'campo' : activeTab === 'renato' ? 'renato' : 'hogar'}
          onClose={() => setIsNewTxModalOpen(false)}
          onAdd={tx => {
            if (tx.type === 'expense') {
              if (tx.owner === 'mama') {
                setMamaAccounts(prev =>
                  prev.map(a => (a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a))
                );
              } else {
                setAccounts(prev =>
                  prev.map(a => (a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a))
                );
              }
            } else if (tx.type === 'income') {
              if (tx.owner === 'mama') {
                setMamaAccounts(prev =>
                  prev.map(a => (a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a))
                );
              } else {
                setAccounts(prev =>
                  prev.map(a => (a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a))
                );
              }
            }
            setTransactions(prev => [tx, ...prev]);
            setIsNewTxModalOpen(false);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: NUEVO SERVICIO / FACTURA MANUAL */}
      {/* ============================================================== */}
      {isNewBillModalOpen && (
        <NewBillModal
          initialGroup={activeTab === 'campo' ? 'campo' : activeTab === 'mama' ? 'mama' : 'hogar'}
          onClose={() => setIsNewBillModalOpen(false)}
          onAdd={newBill => {
            setBills(prev => [newBill, ...prev]);
            setIsNewBillModalOpen(false);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: GUÍA DE INSTALACIÓN PWA (MÓVIL & ESCRITORIO) */}
      {/* ============================================================== */}
      {showIOSInstallModal && (
        <PWAInstallGuideModal onClose={() => setShowIOSInstallModal(false)} />
      )}

      {/* ============================================================== */}
      {/* FIXED BOTTOM NAVIGATION BAR */}
      {/* ============================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-1 py-1.5 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-1 px-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('vencimientos')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all shrink-0 relative cursor-pointer ${
              activeTab === 'vencimientos' ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarClock className="w-5 h-5" />
            <span className="text-[10px]">Vencimientos</span>
            {urgentBills.length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('campo')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'campo' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tractor className="w-5 h-5" />
            <span className="text-[10px]">El Campo</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'scanner' ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px]">Almacén</span>
          </button>

          <button
            onClick={() => setActiveTab('mama')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'mama' ? 'text-purple-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartHandshake className="w-5 h-5" />
            <span className="text-[10px]">Mamá</span>
          </button>

          <button
            onClick={() => setActiveTab('renato')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'renato' ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints className="w-5 h-5" />
            <span className="text-[10px]">Renato</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENT MODAL: CONFIRMAR PAGO (SOPORTA ÍTEMS "A CONFIRMAR")
// ============================================================================
function PayBillConfirmModal({
  bill,
  accounts,
  defaultAccountId,
  onClose,
  onConfirm,
}: {
  bill: Bill;
  accounts: Account[];
  defaultAccountId: string;
  onClose: () => void;
  onConfirm: (finalAmount: number, chosenAccountId: string) => void;
}) {
  const [amountInput, setAmountInput] = useState<string>(bill.amount !== null ? bill.amount.toString() : '');
  const [selectedAccId, setSelectedAccId] = useState<string>(defaultAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountInput);
    if (!val || val <= 0) {
      alert('Por favor ingresá el importe real de la factura para pagar.');
      return;
    }
    onConfirm(val, selectedAccId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Confirmar Pago de Vencimiento</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Servicio / Impuesto:</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{bill.paymentMethodDetail}</span>
            </div>
            <p className="text-sm font-bold text-white">{bill.title}</p>
            <p className="text-xs text-slate-400">{bill.provider}</p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              {bill.amount === null ? 'Ingresá el importe exacto de la factura ($):' : 'Importe a debitar ($):'}
            </label>
            <input
              type="number"
              value={amountInput}
              onChange={e => setAmountInput(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Debitar automáticamente de:</label>
            <select
              value={selectedAccId}
              onChange={e => setSelectedAccId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} - Saldo: {formatARS(acc.balance)}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl shadow cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Confirmar y Descontar Saldo
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs px-4 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENT MODAL: REGISTRAR TRANSACCIÓN (CON FUENTES PREDETERMINADAS)
// ============================================================================
function NewTransactionModal({
  accounts,
  mamaAccounts,
  initialCostCenter = 'hogar',
  onClose,
  onAdd,
}: {
  accounts: Account[];
  mamaAccounts: Account[];
  initialCostCenter?: Transaction['costCenter'];
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('income');
  const [owner, setOwner] = useState<'personal' | 'mama'>('personal');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'banco_santa_fe');
  const [costCenter, setCostCenter] = useState<Transaction['costCenter']>(initialCostCenter);
  const [incomeSource, setIncomeSource] = useState<IncomeSourceType>('alquiler_campo');

  const handleSelectIncomePreset = (source: IncomeSourceType, defaultDesc: string, defaultAccId: string) => {
    setIncomeSource(source);
    setDescription(defaultDesc);
    if (accounts.some(a => a.id === defaultAccId)) {
      setAccountId(defaultAccId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0 || !description.trim()) return;

    const tx: Transaction = {
      id: 'tx_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: description.trim(),
      amount: val,
      type,
      accountId,
      costCenter: owner === 'mama' ? 'mama' : costCenter,
      incomeSource: type === 'income' ? incomeSource : undefined,
      owner,
    };
    onAdd(tx);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" /> Registrar Movimiento
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setOwner('personal');
                setAccountId(accounts[0]?.id || 'banco_santa_fe');
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                owner === 'personal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Familiar / Campo / Propio
            </button>
            <button
              type="button"
              onClick={() => {
                setOwner('mama');
                setAccountId(mamaAccounts[0]?.id || 'mama_bsf');
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                owner === 'mama' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cuenta de Mamá
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Ingreso / Cobro
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                type === 'expense' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Gasto / Salida
            </button>
          </div>

          {/* Preset Buttons for Income */}
          {type === 'income' && owner === 'personal' && (
            <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                Fuentes Predeterminadas de Ingreso:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectIncomePreset(
                      'alquiler_campo',
                      'Cobro Alquiler del Campo (Renta de arrendamiento rural)',
                      'banco_santa_fe'
                    )
                  }
                  className={`p-2 rounded-lg text-left text-xs border transition-all cursor-pointer ${
                    incomeSource === 'alquiler_campo'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-bold">🌾 Alquiler Campo</span>
                  <span className="text-[10px] text-slate-400">Renta rural BSF</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectIncomePreset(
                      'comisiones_scilingo',
                      'Comisiones Corretaje Scilingo Hnos. (Liquidación de cereal)',
                      'banco_macro'
                    )
                  }
                  className={`p-2 rounded-lg text-left text-xs border transition-all cursor-pointer ${
                    incomeSource === 'comisiones_scilingo'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-bold">🌽 Scilingo Hnos.</span>
                  <span className="text-[10px] text-slate-400">Liquidación cereal Macro</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Descripción</label>
            <input
              type="text"
              placeholder="Ej: Cobro Alquiler Campo, Comisiones Scilingo Hnos..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Importe en Pesos ($)</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Cuenta / Billetera</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {(owner === 'mama' ? mamaAccounts : accounts).map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatARS(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Guardar Movimiento
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 text-slate-300 font-semibold text-xs px-3 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENT MODAL: NUEVO SERVICIO / FACTURA MANUAL
// ============================================================================
function NewBillModal({
  initialGroup = 'hogar',
  onClose,
  onAdd,
}: {
  initialGroup?: BillGroup;
  onClose: () => void;
  onAdd: (bill: Bill) => void;
}) {
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [group, setGroup] = useState<BillGroup>(initialGroup);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('debito_cuenta');
  const [paymentMethodDetail, setPaymentMethodDetail] = useState('Banco Macro');
  const [notes, setNotes] = useState('');
  const [isAnnual, setIsAnnual] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = amount ? parseFloat(amount) : null;
    if (!title.trim()) return;

    const dueDay = dueDate ? parseInt(dueDate.split('-')[2] || '10', 10) : 0;

    const newBill: Bill = {
      id: 'b_' + Date.now(),
      title: title.trim(),
      provider: provider.trim() || title.trim(),
      amount: val,
      dueDate,
      dueDay,
      group,
      paymentMethod,
      paymentMethodDetail: paymentMethodDetail.trim() || 'Manual',
      status: isAnnual ? 'paid' : 'pending',
      isAnnual,
      notes: notes.trim(),
    };
    onAdd(newBill);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-emerald-400" /> Nuevo Vencimiento / Servicio
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Destino / Grupo</label>
            <select
              value={group}
              onChange={e => setGroup(e.target.value as BillGroup)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="hogar">🏠 Hogar & YO</option>
              <option value="tarjetas">💳 Tarjetas & Suscripciones</option>
              <option value="movilidad">🚗 Movilidad & Vehículos</option>
              <option value="renato">⚽ Renato</option>
              <option value="lorena">🧘 Lorena</option>
              <option value="campo">🚜 El Campo</option>
              <option value="mama">💜 Mamá (Banco Santa Fe)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nombre del Servicio / Título</label>
            <input
              type="text"
              placeholder="Ej: EPE, Litoral Gas, Patente, Starlink..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Importe ($) (Vacío = A confirmar)</label>
              <input
                type="number"
                placeholder="A confirmar"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Fecha de Vencimiento</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Medio de Pago</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="debito_cuenta">🏦 Débito en Cuenta</option>
                <option value="debito_tarjeta">💳 Débito en Tarjeta</option>
                <option value="pago_manual">📱 Pago Manual</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Detalle (Banco / Plástico)</label>
              <input
                type="text"
                placeholder="Ej: Banco Macro, BNA, Visa..."
                value={paymentMethodDetail}
                onChange={e => setPaymentMethodDetail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="chkAnnual"
              checked={isAnnual}
              onChange={e => setIsAnnual(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="chkAnnual" className="text-xs text-slate-300">
              Es "Pago Anual" (no computar en sumatoria mensual)
            </label>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Guardar Servicio
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 text-slate-300 font-semibold text-xs px-3 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: GUÍA DE INSTALACIÓN PWA (IPHONE / ANDROID / PC)
// ============================================================================
function PWAInstallGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white font-bold shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Instalar en tu Celular</h3>
            <p className="text-xs text-slate-400">Acceso directo como app nativa</p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800/80 text-xs text-slate-300">
          <div className="space-y-1">
            <p className="font-bold text-emerald-400 flex items-center gap-1.5">
              📱 En iPhone / iPad (Safari):
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-300 leading-relaxed">
              <li>Tocá el botón <strong>Compartir</strong> (<Share2 className="w-3.5 h-3.5 inline text-sky-400" />) en la barra de Safari.</li>
              <li>Deslizá hacia abajo y tocá <strong>"Agregar al inicio"</strong>.</li>
              <li>Confirmá tocando <strong>"Agregar"</strong> arriba a la derecha.</li>
            </ol>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-800">
            <p className="font-bold text-cyan-400 flex items-center gap-1.5">
              🤖 En Android (Chrome / Brave):
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-300 leading-relaxed">
              <li>Tocá el menú de opciones (los <strong>3 puntos ⋮</strong>).</li>
              <li>Elegí <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
            </ol>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          ¡Listo, entendido!
        </button>
      </div>
    </div>
  );
}
