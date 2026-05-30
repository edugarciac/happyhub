// src/pages/api/events/collaborative/[id]/regalo/suggest.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getCollaborativeEventById, getParticipantByUserId } from '@/utils/db/collaborative-events';
import { generateText } from '@/lib/ai';
import { searchWeb } from '@/lib/search';

const suggestSchema = z.object({
  personDescription: z.string().min(1).max(500),
  eventType: z.string().min(1).max(100),
  budget: z.string().min(1).max(50),
});

interface GiftSuggestion {
  title: string;
  description: string;
  price_approx: string;
  url: string | null;
  emoji: string;
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

  const { personDescription, eventType, budget } = parsed.data;

  // Step 1: Buscar productos reales en la web
  const searchQuery = `ideas regalo ${eventType} ${personDescription} presupuesto ${budget}`;
  const webResults = await searchWeb(searchQuery, 5);

  const webContext = webResults.length > 0
    ? webResults.map((r, i) => `${i + 1}. ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 200)}`).join('\n\n')
    : 'No hay resultados de búsqueda disponibles.';

  // Step 2: Claude genera sugerencias estructuradas
  const systemPrompt = `Eres un asesor de regalos experto para eventos sociales españoles. Generas ideas de regalos personalizadas, prácticas y culturalmente apropiadas. Respondes SIEMPRE en JSON válido con este formato exacto:
{"suggestions":[{"title":"string","description":"string","price_approx":"string","url":"string|null","emoji":"string"}]}
Genera entre 4 y 6 sugerencias. El emoji debe ser relevante al regalo. La descripción es breve (1-2 frases en español). price_approx es una cadena como "~€45" o "€80–€120". Para url: usa solo las URLs de los resultados de búsqueda que sean realmente relevantes; si no hay ninguna relevante, usa null.`;

  const userPrompt = `Tipo de evento: ${eventType}
Persona: ${personDescription}
Presupuesto: ${budget}

Resultados de búsqueda web disponibles:
${webContext}

Genera sugerencias de regalo personalizadas y variadas.`;

  try {
    const aiResponse = await generateText(userPrompt, systemPrompt);
    // Claude puede envolver el JSON en bloques de código markdown
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Respuesta IA inválida' });

    const result = JSON.parse(jsonMatch[0]) as { suggestions: GiftSuggestion[] };
    return res.status(200).json({ suggestions: result.suggestions });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error generando sugerencias: ' + err.message });
  }
}
