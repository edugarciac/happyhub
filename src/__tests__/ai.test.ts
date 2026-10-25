const create = jest.fn();
jest.mock('@anthropic-ai/sdk', () => ({ __esModule: true, default: jest.fn(() => ({ messages: { create } })) }));

import { generateText, TEXT_MODEL } from '@/lib/ai';

const reply = (stop_reason: string, content: any[]) => ({ stop_reason, content });

beforeEach(() => {
  create.mockReset();
  process.env.ANTHROPIC_API_KEY = 'test';
});

describe('generateText', () => {
  it('uses Claude Haiku 5.5 without sampling parameters', async () => {
    create.mockResolvedValue(reply('end_turn', [{ type: 'text', text: '{"suggestions":[]}' }]));
    await generateText('prompt', 'system');
    const params = create.mock.calls[0][0];
    expect(TEXT_MODEL).toBe('claude-haiku-5-5');
    expect(params).toMatchObject({ model: 'claude-haiku-5-5', output_config: { effort: 'low' }, system: 'system' });
    expect(params).not.toHaveProperty('temperature');
  });

  it('skips thinking blocks and returns the text', async () => {
    create.mockResolvedValue(
      reply('end_turn', [{ type: 'thinking', thinking: '', signature: 's' }, { type: 'text', text: '{"suggestions":[1]}' }])
    );
    expect(await generateText('p')).toBe('{"suggestions":[1]}');
  });

  it('throws on a refusal or a cut-off answer', async () => {
    create.mockResolvedValueOnce(reply('refusal', []));
    await expect(generateText('p')).rejects.toThrow(/rechazado/);
    create.mockResolvedValueOnce(reply('max_tokens', [{ type: 'thinking', thinking: '', signature: 's' }]));
    await expect(generateText('p')).rejects.toThrow(/cortado/);
  });
});
