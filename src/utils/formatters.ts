import { Bill, BillGroup, PaymentMethodType, Transaction } from '../types/finance';

export const safeNumber = (val: unknown): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

export const formatARS = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0';
  const clean = safeNumber(amount);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(clean);
};

export const formatUSD = (amount: number | null | undefined): string => {
  const clean = safeNumber(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(clean);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

export const getDaysDiff = (targetDateStr: string): number => {
  if (!targetDateStr) return 999;
  const target = new Date(targetDateStr + 'T00:00:00');
  if (Number.isNaN(target.getTime())) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const exportMonthToCSV = (
  monthKey: string,
  monthLabel: string,
  bills: Bill[],
  transactions: Transaction[],
  monthlyIncome: number,
  monthlyExpenses: number,
  netOperatingBalance: number
) => {
  const rows: string[] = [];
  rows.push('\uFEFF"Período: ' + monthLabel + '"');
  rows.push('"Generado el: ' + new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR') + '"');
  rows.push('');

  rows.push('"--- MOVIMIENTOS REGISTRADOS (INGRESOS Y EGRESOS) ---"');
  rows.push(['"Fecha"', '"Tipo"', '"Descripción"', '"Categoría"', '"Titular"', '"Importe (ARS)"'].join(';'));

  transactions.forEach((t) => {
    const signAmt = t.type === 'income' ? t.amount : -t.amount;
    rows.push(
      [
        `"${formatDate(t.date)}"`,
        `"${t.type === 'income' ? 'Ingreso (+)' : 'Egreso (-)'}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${t.costCenter}"`,
        `"${t.owner === 'mama' ? 'María Ester (Iaia)' : 'Personal / Familia'}"`,
        `"${signAmt}"`,
      ].join(';')
    );
  });

  rows.push('');
  rows.push('"--- SERVICIOS, IMPUESTOS Y VENCIMIENTOS ---"');
  rows.push(
    [
      '"Categoría"',
      '"Concepto / Servicio"',
      '"Proveedor"',
      '"Vencimiento"',
      '"Importe (ARS)"',
      '"Medio de Pago"',
      '"Estado"',
      '"Fecha de Pago"',
    ].join(';')
  );

  const groupNames: Record<BillGroup, string> = {
    hogar: 'Hogar y Personal',
    tarjetas: 'Tarjetas y Suscripciones',
    movilidad: 'Movilidad y Ford',
    renato: 'Renato',
    lorena: 'Lorena',
    campo: 'Campo y Cereales',
    mama: 'María Ester (Iaia)',
  };

  const paymentMethodNames: Record<PaymentMethodType, string> = {
    debito_cuenta: 'Débito en Cuenta',
    debito_tarjeta: 'Débito en Tarjeta',
    pago_manual: 'Pago Manual',
  };

  bills.forEach((b) => {
    rows.push(
      [
        `"${groupNames[b.group] || b.group}"`,
        `"${(b.title || '').replace(/"/g, '""')}"`,
        `"${(b.provider || '').replace(/"/g, '""')}"`,
        `"${b.dueDate ? formatDate(b.dueDate) : `Día ${b.dueDay || '-'}`}"`,
        `"${safeNumber(b.amount)}"`,
        `"${paymentMethodNames[b.paymentMethod] || b.paymentMethod}"`,
        `"${b.status === 'paid' ? 'Pagado' : 'Pendiente'}"`,
        `"${b.paidAt ? formatDate(b.paidAt) : '-'}"`,
      ].join(';')
    );
  });

  rows.push('');
  rows.push('"--- RESUMEN NETO DEL MES ---"');
  rows.push(`"Total Ingresos (+)";"${monthlyIncome}"`);
  rows.push(`"Total Egresos (-)";"-${monthlyExpenses}"`);
  rows.push(`"Balance Neto";"${netOperatingBalance}"`);

  const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Finanzas_Familia_${monthKey}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
