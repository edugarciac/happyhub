jest.mock('@/lib/ai', () => ({ anthropic: { messages: { create: jest.fn() } } }));
jest.mock('@/lib/bookedSlots', () => ({ getBookedSlots: jest.fn() }));
jest.mock('@/lib/pricingRules', () => ({ getActivePricingRules: jest.fn() }));
jest.mock('@/lib/reservationPricing', () => ({ computeReservationPrice: jest.fn() }));

import { anthropic } from '@/lib/ai';
import { getBookedSlots } from '@/lib/bookedSlots';
import { getActivePricingRules } from '@/lib/pricingRules';
import { computeReservationPrice } from '@/lib/reservationPricing';
import {
  answerChat,
  buildSystemPrompt,
  chatRequestSchema,
  consultarDisponibilidad,
  consultarPrecios,
  CHAT_MODEL,
} from '@/lib/kbChat';
import { renderAssistantText } from '@/lib/chatFormat';

const create = anthropic.messages.create as jest.Mock;

function message(stop_reason: string, content: any[]) {
  return { id: 'msg', type: 'message', role: 'assistant', model: CHAT_MODEL, stop_reason, content, usage: {} };
}

beforeEach(() => jest.clearAllMocks());

describe('chatRequestSchema', () => {
  const ok = (messages: unknown) => chatRequestSchema.safeParse({ messages }).success;

  it('accepts an alternating conversation that ends with the customer', () => {
    expect(ok([{ role: 'user', content: 'Hola' }])).toBe(true);
    expect(ok([{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }, { role: 'user', content: 'c' }])).toBe(true);
  });

  it('rejects bad shapes and long messages', () => {
    expect(ok([])).toBe(false);
    expect(ok([{ role: 'assistant', content: 'b' }, { role: 'user', content: 'c' }])).toBe(false);
    expect(ok([{ role: 'user', content: 'a' }, { role: 'user', content: 'c' }])).toBe(false);
    expect(ok([{ role: 'system', content: 'a' }])).toBe(false);
    expect(ok([{ role: 'user', content: 'x'.repeat(1001) }])).toBe(false);
    expect(ok(Array.from({ length: 21 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x' })))).toBe(false);
  });
});

describe('system prompt', () => {
  const prompt = buildSystemPrompt();

  it('contains the public guide with web links and resolved variables', () => {
    expect(prompt).toContain('Chiquipark');
    expect(prompt).toContain('URL: /guia-sala/operaciones/encender-sala');
    expect(prompt).toContain('](/guia-sala/zonas/sala-kids)');
    expect(prompt).not.toMatch(/\{\{\w+\}\}/);
    expect(prompt).not.toMatch(/\]\([^)]*\.md/);
  });

  it('never contains the internal manual', () => {
    expect(prompt).not.toContain('climate.aidoo_pro');
    expect(prompt).not.toContain('Dar acceso al manual');
  });

  it('is stable between calls so it can be cached', () => {
    expect(buildSystemPrompt()).toBe(prompt);
    expect(prompt).not.toMatch(/Hoy es/);
  });
});

describe('tools', () => {
  it('consultar_precios reads the active rules and marks missing ones as a consultar', async () => {
    (getActivePricingRules as jest.Mock).mockResolvedValue({ weekend_afternoon: 200, holiday_morning: 0 });
    const result = JSON.parse(await consultarPrecios());
    expect(result.alquiler).toContainEqual({ franja: 'Tarde (16:00–20:00) de sábado o domingo', precio: '200 €' });
    expect(result.alquiler).toContainEqual({ franja: 'Mañana de festivo o víspera de festivo', precio: 'a consultar' });
  });

  it('consultar_disponibilidad rejects bad and past dates without querying', async () => {
    expect(JSON.parse(await consultarDisponibilidad('mañana')).error).toMatch(/no válida/);
    expect(JSON.parse(await consultarDisponibilidad('2020-01-01')).error).toMatch(/pasado/);
    expect(getBookedSlots).not.toHaveBeenCalled();
  });

  it('consultar_disponibilidad reports taken and free slots with their price', async () => {
    (getBookedSlots as jest.Mock).mockResolvedValue([{ date: '2030-06-15', timeSlot: 'morning' }]);
    (computeReservationPrice as jest.Mock).mockResolvedValue({ ok: true, basePrice: 200, discount: 0, extrasTotal: 0, total: 200, deposit: 60 });
    const result = JSON.parse(await consultarDisponibilidad('2030-06-15'));
    expect(result.dia).toBe('sábado');
    expect(result.franjas[0]).toEqual({ franja: 'Mañana (10:00–14:00)', estado: 'ocupada' });
    expect(result.franjas[1]).toMatchObject({ estado: 'libre', precio: '200 €, señal 60 €' });
    expect(computeReservationPrice).toHaveBeenCalledTimes(1);
  });
});

describe('answerChat', () => {
  it('runs a tool and answers, caching the guide and keeping the date out of the cached block', async () => {
    (getActivePricingRules as jest.Mock).mockResolvedValue({ weekend_afternoon: 200 });
    create
      .mockResolvedValueOnce(message('tool_use', [{ type: 'tool_use', id: 't1', name: 'consultar_precios', input: {} }]))
      .mockResolvedValueOnce(message('end_turn', [{ type: 'text', text: 'Un sábado por la tarde son 200 €.' }]));

    const result = await answerChat([{ role: 'user', content: '¿Cuánto cuesta un sábado?' }]);

    expect(result).toEqual({ reply: 'Un sábado por la tarde son 200 €.', handoff: false });
    const first = create.mock.calls[0][0];
    expect(first.model).toBe('claude-haiku-5-5');
    expect(first.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(first.system[1].text).toMatch(/^Hoy es/);
    const second = create.mock.calls[1][0];
    expect(second.messages[2].content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 't1' });
    expect(second.messages[2].content[0].content).toContain('200 €');
  });

  it('flags the WhatsApp handoff', async () => {
    create
      .mockResolvedValueOnce(message('tool_use', [{ type: 'tool_use', id: 't1', name: 'derivar_a_whatsapp', input: { motivo: 'factura' } }]))
      .mockResolvedValueOnce(message('end_turn', [{ type: 'text', text: 'Mejor por WhatsApp.' }]));
    expect(await answerChat([{ role: 'user', content: '¿Me hacéis factura?' }])).toEqual({ reply: 'Mejor por WhatsApp.', handoff: true });
  });

  it('hands off on a refusal and when the tool loop does not finish', async () => {
    create.mockResolvedValueOnce(message('refusal', []));
    expect((await answerChat([{ role: 'user', content: 'x' }])).handoff).toBe(true);

    create.mockResolvedValue(message('tool_use', [{ type: 'tool_use', id: 't', name: 'consultar_precios', input: {} }]));
    (getActivePricingRules as jest.Mock).mockResolvedValue({});
    expect((await answerChat([{ role: 'user', content: 'x' }])).handoff).toBe(true);
    expect(create).toHaveBeenCalledTimes(1 + 4);
  });
});

describe('renderAssistantText', () => {
  it('escapes HTML and only keeps safe links', () => {
    const html = renderAssistantText('<img src=x onerror=alert(1)> [mal](javascript:alert(1)) [ok](/reservas)', '/guia-sala');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('<a href="/reservas">ok</a>');
  });

  it('keeps the tablet inside /guia-sala/panel', () => {
    expect(renderAssistantText('[Sala Kids](/guia-sala/zonas/sala-kids)', '/guia-sala/panel')).toContain(
      'href="/guia-sala/panel/zonas/sala-kids"'
    );
  });

  it('renders bold and lists', () => {
    expect(renderAssistantText('Pulsa **Activar**:\n- uno\n- dos', '/guia-sala')).toBe(
      '<p>Pulsa <strong>Activar</strong>:</p><ul><li>uno</li><li>dos</li></ul>'
    );
  });
});
