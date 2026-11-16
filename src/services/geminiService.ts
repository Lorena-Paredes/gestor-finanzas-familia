import { GoogleGenAI, Type } from '@google/genai';
import { GeminiExtractedData } from '../types/finance';

export interface AnalyzeDocumentPayload {
  fileBase64?: string;
  mimeType?: string;
  rawText?: string;
  contextHint?: string;
}

const SYSTEM_INSTRUCTION = `Eres un contador argentino experto en administración familiar, financiera y agropecuaria.
Analizás:
1. Facturas de servicios e impuestos (EPE Santa Fe, Litoral Gas, Aguas Santafesinas, Telecom/Flow, Starlink, Fibertec, TGI, Inmobiliario Urbano/Rural, API Santa Fe, Patentes, OSDE, Binaria, Monotributo ARCA/AFIP).
2. Resúmenes de tarjetas de crédito (Visa Macro, Nativa Visa BNA, Nativa Mastercard, Mercado Pago, Visa/Master/Amex de cualquier banco).
3. Certificados de Plazo Fijo en Pesos o Dólares (especialmente "SCC Mutual Sport Club Cañadense", "Sport Club Cañadense", Banco Macro, Banco ICBC, BNA, Banco Santa Fe).
4. Tickets de supermercado (Supermercado, SuperRural) y liquidaciones o cobros (Alquiler del Campo, Comisiones Scilingo Hnos., Jubilación).

Reglas de detección:
1. documentKind:
   - "credit_card_statement": si es un resumen o liquidación de tarjeta de crédito (Visa, Mastercard, Amex, Nativa, Mercado Pago).
   - "fixed_term_certificate": si es un certificado, comprobante o renovación de Plazo Fijo (en ARS o USD, como SCC Mutual Sport Club Cañadense).
   - "receipt": si es un ticket de compra / supermercado.
   - "income_settlement": si es una liquidación de ingresos / alquiler / comisión / jubilación.
   - "service_bill": para facturas de servicios, impuestos, cuotas o mails de aviso de vencimiento.
2. Si documentKind === "fixed_term_certificate", completá obligatoriamente "fixedTermData" con: entity (ej. "SCC Mutual Sport Club Cañadense"), currency ("USD" o "ARS"), certificateNumber, capital, termDays (plazo en días), startDate (YYYY-MM-DD), maturityDate (YYYY-MM-DD), tna (tasa nominal anual %), interestAmount (estímulo o interés a cobrar), totalReturn (total a reembolsar = capital + interés).
3. Titularidad (ownership):
   - Si menciona "María Ester", "Iaia", "Mamá", devuelve "maria_ester". Si no, "propia".
4. Tipo de movimiento (movementType):
   - Cobro recibido, liquidación de cereales, acreditación, alquiler cobrado, jubilación -> "income".
   - Boleta a pagar, resumen de tarjeta, compra, impuesto o constitución de plazo fijo -> "expense".
5. Categoría (category):
   - "campo" (Campo y Cereales, Starlink Campo, Inmobiliario Rural, Julián, Gallinas, Mascotas, Scilingo Hnos.)
   - "mama" (Administración María Ester / Iaia)
   - "tarjetas" (Resúmenes de tarjeta de crédito y suscripciones)
   - "renato" (Colegio, Club, Robert / Fútbol Renato, Gimnasio, Inglés)
   - "movilidad" (Préstamo ICBC Ford Territory, Plan Ovalo Ford, Patente, Combustible YPF)
   - "lorena" (Actividades de Lorena)
   - "hogar" (Servicios del hogar: EPE, Gas, Agua, Internet, Alarma, TGI, OSDE, Monotributo, Estudio Contable, Supermercado)
6. Fechas siempre en formato YYYY-MM-DD. Importes numéricos puros (sin símbolo $ ni u$s).`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    documentKind: {
      type: Type.STRING,
      description: 'Uno de: service_bill, credit_card_statement, fixed_term_certificate, receipt, income_settlement',
    },
    provider: {
      type: Type.STRING,
      description: 'Nombre del emisor, entidad mutual, banco o empresa de servicio.',
    },
    title: {
      type: Type.STRING,
      description: 'Título corto y claro del concepto.',
    },
    amount: {
      type: Type.NUMBER,
      description: 'Importe total o capital numérico positivo.',
    },
    dueDate: {
      type: Type.STRING,
      description: 'Fecha de vencimiento o de operación en formato YYYY-MM-DD.',
    },
    closingDate: {
      type: Type.STRING,
      description: 'Fecha de cierre en formato YYYY-MM-DD si es resumen de tarjeta, o cadena vacía.',
    },
    ownership: {
      type: Type.STRING,
      description: 'Uno de: propia, maria_ester',
    },
    movementType: {
      type: Type.STRING,
      description: 'Uno de: expense, income',
    },
    category: {
      type: Type.STRING,
      description: 'Uno de: campo, mama, tarjetas, renato, movilidad, lorena, hogar',
    },
    paymentMethod: {
      type: Type.STRING,
      description: 'Uno de: debito_cuenta, debito_tarjeta, pago_manual',
    },
    paymentMethodDetail: {
      type: Type.STRING,
      description: 'Banco, tarjeta o billetera sugerida (ej. Banco ICBC, Banco Macro, BNA, Mercado Pago).',
    },
    cardName: {
      type: Type.STRING,
      description: 'Si es resumen de tarjeta, nombre de la tarjeta (ej. Visa Macro, Nativa Visa, Mastercard).',
    },
    notes: {
      type: Type.STRING,
      description: 'Resumen breve con observaciones clave detectadas.',
    },
    lineItems: {
      type: Type.ARRAY,
      description: 'Consumos individuales o ítems detectados en el resumen o ticket.',
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          installments: { type: Type.STRING },
        },
        required: ['description', 'amount'],
      },
    },
    fixedTermData: {
      type: Type.OBJECT,
      description: 'Datos del certificado de plazo fijo si documentKind es fixed_term_certificate.',
      properties: {
        entity: { type: Type.STRING },
        currency: { type: Type.STRING },
        certificateNumber: { type: Type.STRING },
        capital: { type: Type.NUMBER },
        termDays: { type: Type.NUMBER },
        startDate: { type: Type.STRING },
        maturityDate: { type: Type.STRING },
        tna: { type: Type.NUMBER },
        interestAmount: { type: Type.NUMBER },
        totalReturn: { type: Type.NUMBER },
      },
    },
  },
  required: [
    'documentKind',
    'provider',
    'title',
    'amount',
    'dueDate',
    'ownership',
    'movementType',
    'category',
    'paymentMethod',
    'paymentMethodDetail',
  ],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getErrorStatus(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return Number((error as { status?: number }).status) || 0;
  }
  return 0;
}

function isServiceOverloadedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const status = getErrorStatus(error);
  return (
    status === 503 ||
    status === 429 ||
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('resource_exhausted')
  );
}

function isEncryptedOrInvalidPdfError(error: unknown, mimeType?: string): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const status = getErrorStatus(error);
  const isPdf = (mimeType || '').toLowerCase().includes('pdf');
  if (!isPdf) return false;
  return (
    msg.includes('password') ||
    msg.includes('encrypted') ||
    msg.includes('protected') ||
    (status === 400 &&
      (msg.includes('unable to process') ||
        msg.includes('invalid_argument') ||
        msg.includes('document') ||
        msg.includes('corrupt') ||
        msg.includes('no pages')))
  );
}

function isApiKeyError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const status = getErrorStatus(error);
  return (
    status === 401 ||
    status === 403 ||
    msg.includes('api_key_invalid') ||
    msg.includes('api key not valid') ||
    msg.includes('permission_denied')
  );
}

function parseGeminiJson(rawText: string | undefined): GeminiExtractedData {
  const trimmed = (rawText || '{}').trim();
  const cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned || '{}') as GeminiExtractedData;
}

export async function analyzeDocumentWithGemini(
  payload: AnalyzeDocumentPayload
): Promise<GeminiExtractedData> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error(
      'Falta configurar la variable de entorno VITE_GEMINI_API_KEY (por ejemplo en Settings > Environment Variables de Vercel).'
    );
  }

  const { fileBase64, mimeType, rawText, contextHint } = payload;

  if (!fileBase64 && (!rawText || !rawText.trim())) {
    throw new Error('Debes enviar una imagen/PDF o pegar el texto de la boleta o correo.');
  }

  const ai = new GoogleGenAI({ apiKey: String(apiKey).trim() });

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        mimeType,
        data: fileBase64,
      },
    });
  }

  const promptLines = [
    'Extraé los datos estructurados del comprobante, factura, certificado de plazo fijo, resumen de tarjeta o correo adjunto.',
    contextHint ? `Contexto desde donde se subió: ${contextHint}.` : '',
    rawText?.trim() ? `Texto pegado por el usuario:\n"""\n${rawText.trim()}\n"""` : '',
  ].filter(Boolean);

  parts.push({ text: promptLines.join('\n\n') });

  const models = [
    'gemini-4-hydrogen',
    'gemini-4-hydrogen',
    'gemini-4-hydrogen',
    'gemini-3.1-flash-lite',
  ];

  let lastError: unknown = null;

  for (let attempt = 0; attempt < models.length; attempt++) {
    const model = models[attempt];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });
      return parseGeminiJson(response.text);
    } catch (err) {
      lastError = err;
      if (isServiceOverloadedError(err) && attempt < models.length - 1) {
        const waitMs = 2000 + attempt * 500;
        await sleep(waitMs);
        continue;
      }
      break;
    }
  }

  if (isEncryptedOrInvalidPdfError(lastError, mimeType)) {
    throw new Error(
      'Este PDF está protegido con contraseña. Abrilo en tu navegador, guardalo con Imprimir > Guardar como PDF (sin clave) o subí una captura de pantalla.'
    );
  }

  if (isServiceOverloadedError(lastError)) {
    throw new Error(
      'Los servidores de Gemini tienen alta demanda en este momento. Se reintentó automáticamente 3 veces sin éxito; por favor probá de nuevo en unos segundos.'
    );
  }

  if (isApiKeyError(lastError)) {
    throw new Error(
      'La clave de API de Gemini (VITE_GEMINI_API_KEY) es inválida o no tiene permisos suficientes.'
    );
  }

  throw new Error(
    lastError instanceof Error
      ? lastError.message
      : 'Error interno procesando el documento con Gemini.'
  );
}
