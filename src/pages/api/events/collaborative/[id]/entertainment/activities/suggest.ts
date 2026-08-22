import type { NextApiResponse } from 'next';
import { withCollaborativeEventAuth } from '@/lib/apiMiddleware';
import { query } from '@/lib/db';
import { generateText } from '@/lib/ai';
import { searchWeb } from '@/lib/search';
import { z } from 'zod';

const suggestSchema = z.object({
  participantTypes: z.array(z.string()).min(1),
  context: z.string().max(500).optional(),
});

interface ActivitySuggestion {
  title: string;
  description: string;
  emoji: string;
  tags: string[];
}

export default withCollaborativeEventAuth(async (req, res, ctx) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, event } = ctx;

  const parsed = suggestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { participantTypes, context } = parsed.data;
  const eventType = event.category || 'fiesta';

  let templatesContext = '';
  try {
    const templatesResult = await query(
      `SELECT title, description, tags FROM activity_templates
       WHERE $1 = ANY(event_types) OR array_length(event_types, 1) IS NULL
       ORDER BY usage_count DESC LIMIT 10`,
      [eventType]
    );
    templatesContext = templatesResult.rows.length > 0
      ? templatesResult.rows.map((t: any) =>
          `- ${t.title}${t.description ? ': ' + t.description : ''}`
        ).join('\n')
      : '';
  } catch (dbErr: any) {
    console.error('[suggest] DB query failed (activity_templates):', dbErr?.message);
  }

  const searchQuery = `actividades juegos ${eventType} ${participantTypes.join(' ')} fiesta ideas`;
  const webResults = await searchWeb(searchQuery, 5);
  const webContext = webResults.length > 0
    ? webResults.map((r: any, i: number) => `${i + 1}. ${r.title}\n${r.content.slice(0, 200)}`).join('\n\n')
    : '';

  const systemPrompt = `Eres un experto en organización de fiestas y eventos sociales en España. Generas ideas de actividades entretenidas, prácticas y culturalmente apropiadas. Respondes SIEMPRE en JSON válido:
{"suggestions":[{"title":"string","description":"string","emoji":"string","tags":["string"]}]}
Genera entre 5 y 8 sugerencias variadas. emoji debe ser relevante. description es breve (1-2 frases en español).`;

  const userPrompt = `Tipo de evento: ${eventType}
Tipo de participantes: ${participantTypes.join(', ')}
${context ? `Contexto adicional: ${context}` : ''}

${templatesContext ? `Actividades de nuestra base de conocimiento:\n${templatesContext}\n` : ''}
${webContext ? `Ideas de internet:\n${webContext}` : ''}

Genera actividades variadas y apropiadas para este evento.`;

  try {
    const aiResponse = await generateText(userPrompt, systemPrompt);
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Respuesta IA inválida' });

    try {
      const result = JSON.parse(jsonMatch[0]) as { suggestions: ActivitySuggestion[] };
      return res.status(200).json({ suggestions: result.suggestions });
    } catch {
      return res.status(500).json({ error: 'Respuesta IA inválida' });
    }
  } catch (err: any) {
    console.error('[suggest] Error generando sugerencias:', err);
    console.error('[suggest] Error details:', err?.message, err?.status, err?.error);
    return res.status(500).json({ error: 'Error generando sugerencias: ' + (err?.message || 'unknown') });
  }
});
