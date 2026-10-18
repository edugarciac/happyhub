import { withAudit, sanitizeBody, recordAuditEvent } from '@/lib/audit';
import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
const mockQuery = query as jest.Mock;

function mockRes() {
  const res: any = { statusCode: 200, sent: undefined as unknown };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    res.sent = body;
    return res;
  };
  return res;
}

const auditInsert = () => mockQuery.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO audit_events'));

describe('audit', () => {
  beforeEach(() => {
    mockQuery.mockReset().mockResolvedValue({ rows: [] });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('drops secrets and truncates long text', () => {
    const clean = sanitizeBody({ email: 'a@b.c', password: 'x', termsText: 'long', message: 'm'.repeat(400) });
    expect(clean).not.toHaveProperty('password');
    expect(clean).not.toHaveProperty('termsText');
    expect(String(clean.message).length).toBeLessThan(310);
  });

  it('records a failed request with its status and step, then sends the response', async () => {
    const handler = withAudit('reservation.web', async (_req, res) => {
      res.status(409).json({ success: false, error: 'Ya reservada', step: 'availability' });
    });
    const res = mockRes();
    await handler({ method: 'POST', headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }, body: { email: 'Ana@X.com', password: 'p' } } as any, res);

    expect(res.sent).toEqual({ success: false, error: 'Ya reservada', step: 'availability' });
    const [, params] = auditInsert()!;
    expect(params.slice(0, 7)).toEqual(['reservation.web', 'failure', 'availability', 'ana@x.com', null, 409, '1.2.3.4']);
    expect(params[9]).not.toContain('"password"');
  });

  it('never breaks the request when the audit table is unavailable', async () => {
    mockQuery.mockRejectedValue(new Error('db down'));
    await expect(recordAuditEvent({}, { eventType: 'auth.login', outcome: 'failure', reason: 'bad_password' })).resolves.toBeUndefined();
  });
});
