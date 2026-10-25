import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import { answerChat, chatRequestSchema, HANDOFF_FALLBACK, type ChatReply } from '@/lib/kbChat';
import { chatIpHash, takeChatQuota } from '@/lib/chatLimits';

type ChatResponse = ChatReply | { error: string; reply?: string; handoff?: boolean };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ChatResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Petición no válida' });
  }

  try {
    const limited = await takeChatQuota(chatIpHash(req));
    if (limited) {
      return res.status(429).json({
        error: 'rate_limited',
        reply: 'Has enviado muchos mensajes seguidos. Si lo necesitas, escríbenos por WhatsApp y te atendemos.',
        handoff: true,
      });
    }

    return res.status(200).json(await answerChat(parsed.data.messages));
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('[chat] Error de la API de Claude:', error.status, error.message);
    } else {
      console.error('[chat] Error:', error);
    }
    return res.status(503).json({ error: 'unavailable', reply: HANDOFF_FALLBACK, handoff: true });
  }
}
