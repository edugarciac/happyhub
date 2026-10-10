import { sendAdminNotification } from '@/lib/whatsapp';

describe('sendAdminNotification via CallMeBot', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, ADMIN_WHATSAPP_NUMBER: '638 39 06 00', CALLMEBOT_API_KEY: 'k123' };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('calls CallMeBot with the admin phone, encoded text and api key', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => 'Message queued. You will receive it in a few seconds.' });
    global.fetch = fetchMock as any;

    await expect(sendAdminNotification('🆕 Nueva reserva & más')).resolves.toBe(true);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://api.callmebot.com/whatsapp.php');
    expect(url.searchParams.get('phone')).toBe('+34638390600');
    expect(url.searchParams.get('text')).toBe('🆕 Nueva reserva & más');
    expect(url.searchParams.get('apikey')).toBe('k123');
  });

  it('returns false when CallMeBot answers with an error page', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '<p>APIKey is invalid</p>' }) as any;
    await expect(sendAdminNotification('hola')).resolves.toBe(false);
  });

  it('returns false when the request fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('timeout')) as any;
    await expect(sendAdminNotification('hola')).resolves.toBe(false);
  });
});
