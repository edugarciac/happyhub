import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'No autenticado' });

  const userId = parseInt((session.user as any).id as string, 10);
  const eventId = parseInt(req.query.id as string, 10);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID inválido' });

  const event = await getCollaborativeEventById(eventId);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;
  if (!participant && !isOrganizer) return res.status(403).json({ error: 'Sin acceso' });

  const parsed = suggestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { participantTypes, context } = parsed.data;
  const eventType = event.category || 'fiesta';

  const templatesResult = await query(
    `SELECT title, description, tags FROM activity_templates
     WHERE $1 = ANY(event_types) OR array_length(event_types, 1) IS NULL
     ORDER BY usage_count DESC LIMIT 10`,
    [eventType]
  );

  const templatesContext = templatesResult.rows.length > 0
    ? templatesResult.rows.map((t: any) =>
        `- ${t.title}${t.description ? ': ' + t.description : ''}`
      ).join('\n')
    : '';

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
    console.error('Error generando sugerencias:', err);
    return res.status(500).json({ error: 'Error generando sugerencias' });
  }
}
