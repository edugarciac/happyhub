// src/lib/ai.ts
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Modelo de las sugerencias de regalo y actividades (migrado de Haiku 4.5, 2026-10-25) */
export const TEXT_MODEL = 'claude-haiku-5-5';

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no está configurada');
  }

  const message = await anthropic.messages.create({
    model: TEXT_MODEL,
    // Haiku 5.5 razona antes de responder y ese razonamiento cuenta en el límite
    max_tokens: 8000,
    output_config: { effort: 'low' },
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [{ role: 'user', content: prompt }],
  });

  if (message.stop_reason === 'refusal') throw new Error('La IA ha rechazado la petición');

  // La respuesta puede empezar por bloques de razonamiento: se leen solo los de texto
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
  if (!text) {
    throw new Error(message.stop_reason === 'max_tokens' ? 'La respuesta de la IA se ha cortado' : 'Respuesta vacía de la IA');
  }
  return text;
}
