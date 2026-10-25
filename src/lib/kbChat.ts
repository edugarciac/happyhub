// src/lib/kbChat.ts
// Chatbot de clientes: responde con la base de conocimiento (content/kb) y consulta
// precios y disponibilidad en la BD con herramientas de solo lectura.
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { anthropic } from '@/lib/ai';
import { getBookedSlots } from '@/lib/bookedSlots';
import { getKbPromptText } from '@/lib/kb';
import { getActivePricingRules } from '@/lib/pricingRules';
import { computeReservationPrice } from '@/lib/reservationPricing';
import { BOOKINGS_FROM_DATE, BOOKINGS_FROM_LABEL, todayInMadrid } from '@/config/opening';
import { CONTACT_INFO } from '@/config/contact';
import { MAX_CHAT_MESSAGES, MAX_CHAT_MESSAGE_LENGTH } from '@/config/chat';
import { SECURITY_DEPOSIT_AMOUNT } from '@/config/payments';
import { OPENING_DISCOUNT, isOpeningDiscountActive } from '@/config/promotions';
import {
  AFTERNOON_EXTENSION_UNTIL,
  BOOKABLE_TIME_SLOTS,
  EXTRA_HOUR_PRICE,
  MAX_EXTRA_HOURS,
  TIME_SLOTS,
  type TimeSlot,
} from '@/utils/pricing';

/** Modelo del chatbot (decisión del propietario, 2026-10-25: Haiku por coste) */
export const CHAT_MODEL = 'claude-haiku-5-5';
const MAX_TOOL_ROUNDS = 4;

/** Las respuestas del asistente vuelven en el historial y pueden ser algo más largas */
const MAX_ASSISTANT_MESSAGE_LENGTH = 4000;

/** Petición de /api/chat: historial que guarda el widget, alternando cliente y asistente */
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(MAX_ASSISTANT_MESSAGE_LENGTH),
      })
    )
    .min(1)
    .max(MAX_CHAT_MESSAGES)
    .refine((m) => m.every((t) => t.role === 'assistant' || t.content.length <= MAX_CHAT_MESSAGE_LENGTH), `Cada mensaje puede tener como máximo ${MAX_CHAT_MESSAGE_LENGTH} caracteres`)
    .refine((m) => m.length > 0 && m[0].role === 'user' && m[m.length - 1].role === 'user', 'La conversación debe empezar y acabar con un mensaje del cliente')
    .refine((m) => m.every((t, i) => i === 0 || t.role !== m[i - 1].role), 'Los mensajes deben alternar cliente y asistente'),
});

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatReply {
  reply: string;
  /** El bot no sabe la respuesta o el cliente pide una persona: el widget muestra el botón de WhatsApp */
  handoff: boolean;
}

const RULE_LABELS: Record<string, string> = {
  weekday_morning: 'Mañana (10:00–14:00) de lunes a viernes',
  weekday_afternoon: 'Tarde (16:00–20:00) de lunes a jueves',
  friday_afternoon: 'Tarde (16:00–20:00) del viernes',
  weekend_morning: 'Mañana (10:00–14:00) de sábado o domingo',
  weekend_afternoon: 'Tarde (16:00–20:00) de sábado o domingo',
  holiday_morning: 'Mañana de festivo o víspera de festivo',
  holiday_afternoon: 'Tarde de festivo o víspera de festivo',
};

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const SYSTEM_RULES = `Eres el asistente de HappyHub, un espacio para eventos privados (cumpleaños, celebraciones familiares…) en ${CONTACT_INFO.address.full}. Atiendes a clientes y posibles clientes en la web y en la tablet de la sala.

Cómo respondes:
- Usa solo la información de la GUÍA de abajo y lo que devuelvan las herramientas. No inventes normas, servicios, horarios ni precios.
- Precios y disponibilidad: usa siempre las herramientas consultar_precios y consultar_disponibilidad. Si una cifra de la guía no coincide con una herramienta, manda la herramienta.
- Si la respuesta no está en la guía ni en las herramientas, o el cliente quiere hablar con una persona, dilo con naturalidad y llama a derivar_a_whatsapp.
- No puedes crear, cambiar ni cancelar reservas. Para reservar, enlaza a /reservas; para ver fechas libres, a /disponibilidad.
- Cuando expliques algo de la guía, añade el enlace a su página (la URL que aparece en cada documento) con formato Markdown: [texto](/guia-sala/...).
- No compartas datos de otras reservas ni de otros clientes.
- Responde en el idioma del cliente (por defecto, castellano), en tono cercano y breve: 1–4 frases o una lista corta. Sin títulos.`;

let systemCache: string | null = null;

/** Prompt de sistema estable (se cachea en la API): reglas + guía completa */
export function buildSystemPrompt(): string {
  if (!systemCache) {
    systemCache = `${SYSTEM_RULES}\n\n<guia>\n${getKbPromptText()}\n</guia>`;
  }
  return systemCache;
}

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'consultar_precios',
    description:
      'Devuelve la tarifa vigente de HappyHub desde la base de datos: precio del alquiler por tipo de día y franja, horas adicionales, señal, fianza y descuentos activos. Úsala para cualquier pregunta sobre precios.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    name: 'consultar_disponibilidad',
    description:
      'Indica si las franjas de mañana y tarde de una fecha concreta están libres u ocupadas, y el precio de cada franja libre ese día (con festivos y descuentos aplicados). Úsala cuando el cliente pregunte por un día concreto; convierte expresiones como "el sábado que viene" a una fecha usando la fecha de hoy.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
      },
      required: ['fecha'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'derivar_a_whatsapp',
    description:
      'Muestra al cliente un botón para escribir al equipo de HappyHub por WhatsApp. Úsala cuando no sepas la respuesta, cuando el cliente pida hablar con una persona o cuando necesite algo que tú no puedes hacer.',
    input_schema: {
      type: 'object',
      properties: {
        motivo: { type: 'string', description: 'Motivo breve de la derivación' },
      },
      required: ['motivo'],
      additionalProperties: false,
    },
    strict: true,
  },
];

function slotLabel(slot: TimeSlot): string {
  const info = TIME_SLOTS.find((s) => s.id === slot);
  return info ? `${info.label} (${info.startTime}–${info.endTime})` : slot;
}

export async function consultarPrecios(): Promise<string> {
  const rules = await getActivePricingRules();
  const prices = Object.entries(RULE_LABELS).map(([key, label]) => {
    const price = rules[key];
    return { franja: label, precio: price ? `${price} €` : 'a consultar' };
  });
  return JSON.stringify({
    alquiler: prices,
    horas_adicionales: `La tarde se puede ampliar hasta las ${AFTERNOON_EXTENSION_UNTIL}h, máximo ${MAX_EXTRA_HOURS} horas, a ${EXTRA_HOUR_PRICE} € cada hora.`,
    senal: 'Al aprobar la reserva se paga una señal del 30% del total.',
    fianza: `${SECURITY_DEPOSIT_AMOUNT} €, bloqueados en tarjeta el día del evento y liberados tras revisar el espacio.`,
    descuento: isOpeningDiscountActive()
      ? `${OPENING_DISCOUNT.label}: ${OPENING_DISCOUNT.percent}% en el alquiler para solicitudes hasta el ${OPENING_DISCOUNT.requestedUntilLabel} y eventos hasta el ${OPENING_DISCOUNT.eventUntilLabel}.`
      : 'Ninguno activo.',
    mas_informacion: '/precios',
  });
}

export async function consultarDisponibilidad(fecha: string): Promise<string> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(`${fecha}T12:00:00Z`))) {
    return JSON.stringify({ error: 'Fecha no válida. Usa el formato YYYY-MM-DD.' });
  }
  const today = todayInMadrid();
  if (fecha < today) return JSON.stringify({ fecha, error: 'Esa fecha ya ha pasado.' });
  if (fecha < BOOKINGS_FROM_DATE) {
    return JSON.stringify({ fecha, error: `Las reservas empiezan el ${BOOKINGS_FROM_LABEL}.` });
  }

  const booked = await getBookedSlots(fecha);
  const franjas = await Promise.all(
    BOOKABLE_TIME_SLOTS.map(async (slot) => {
      if (booked.some((b) => b.timeSlot === slot)) return { franja: slotLabel(slot), estado: 'ocupada' };
      const price = await computeReservationPrice({ date: fecha, timeSlot: slot, extraHours: 0, extraIds: [] });
      return {
        franja: slotLabel(slot),
        estado: 'libre',
        precio: price.ok
          ? `${price.total} €${price.discount ? ` (incluye ${price.discount} € de descuento)` : ''}, señal ${price.deposit} €`
          : 'a consultar',
      };
    })
  );
  const weekday = WEEKDAYS[new Date(`${fecha}T12:00:00Z`).getUTCDay()];
  return JSON.stringify({ fecha, dia: weekday, franjas, reservar: '/reservas' });
}

async function runTool(block: Anthropic.ToolUseBlock): Promise<{ content: string; isError?: boolean; handoff?: boolean }> {
  const input = (block.input ?? {}) as Record<string, unknown>;
  try {
    switch (block.name) {
      case 'consultar_precios':
        return { content: await consultarPrecios() };
      case 'consultar_disponibilidad':
        return { content: await consultarDisponibilidad(String(input.fecha ?? '')) };
      case 'derivar_a_whatsapp':
        return { content: 'El cliente verá un botón para escribir por WhatsApp.', handoff: true };
      default:
        return { content: `Herramienta desconocida: ${block.name}`, isError: true };
    }
  } catch (error) {
    console.error(`[chat] Error en la herramienta ${block.name}:`, error);
    return { content: 'No se ha podido consultar ahora mismo.', isError: true };
  }
}

export const HANDOFF_FALLBACK =
  'Ahora mismo no puedo ayudarte con esto. Escríbenos por WhatsApp y te respondemos enseguida.';

/** Responde al último mensaje del cliente. `history` alterna user/assistant y termina en user. */
export async function answerChat(history: ChatTurn[]): Promise<ChatReply> {
  const today = todayInMadrid();
  const messages: Anthropic.MessageParam[] = history.map((t) => ({ role: t.role, content: t.content }));
  let handoff = false;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 4096,
      output_config: { effort: 'low' },
      tools: CHAT_TOOLS,
      system: [
        // Bloque estable y cacheado: reglas + guía. Lo variable (la fecha) va después del corte.
        { type: 'text', text: buildSystemPrompt(), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: `Hoy es ${WEEKDAYS[new Date(`${today}T12:00:00Z`).getUTCDay()]}, ${today} (hora de Madrid).` },
      ],
      messages,
    });

    if (response.stop_reason === 'refusal') {
      return { reply: HANDOFF_FALLBACK, handoff: true };
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (response.stop_reason !== 'tool_use') {
      return text ? { reply: text, handoff } : { reply: HANDOFF_FALLBACK, handoff: true };
    }

    // Se devuelve el turno completo (incluidos los bloques de razonamiento) antes de los resultados
    messages.push({ role: 'assistant', content: response.content });
    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    const results = await Promise.all(toolUses.map(runTool));
    if (results.some((r) => r.handoff)) handoff = true;
    messages.push({
      role: 'user',
      content: toolUses.map((block, i) => ({
        type: 'tool_result' as const,
        tool_use_id: block.id,
        content: results[i].content,
        ...(results[i].isError ? { is_error: true } : {}),
      })),
    });
  }

  return { reply: HANDOFF_FALLBACK, handoff: true };
}
