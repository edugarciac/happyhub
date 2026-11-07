// Formato de las respuestas del chatbot en el widget (sin dependencias de React)
import { CONTACT_INFO } from '@/config/contact';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Markdown mínimo y seguro de las respuestas: enlaces, negrita y listas. Todo lo demás se escapa. */
export function renderAssistantText(text: string, guideBasePath: string): string {
  const inline = (line: string) =>
    escapeHtml(line)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, rawHref: string) => {
        let href = rawHref.replace(/&amp;/g, '&');
        if (!/^(\/(?!\/)|https:\/\/)/.test(href)) return label;
        // En la tablet (/guia-sala/panel) no hay WhatsApp instalado: se muestra el número
        if (guideBasePath.startsWith('/guia-sala/panel') && /^https:\/\/wa\.me\//.test(href)) {
          return `${label} (WhatsApp <strong>${CONTACT_INFO.phoneFormatted}</strong>)`;
        }
        if (guideBasePath !== '/guia-sala' && /^\/guia-sala(\/|$)/.test(href) && !href.startsWith(guideBasePath)) {
          href = guideBasePath + href.slice('/guia-sala'.length);
        }
        const external = href.startsWith('https://');
        return `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
      });

  const html: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) html.push(`<ul>${list.map((li) => `<li>${li}</li>`).join('')}</ul>`);
    list = [];
  };
  for (const line of text.split('\n')) {
    const item = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
    if (item) {
      list.push(inline(item[1]));
    } else {
      flush();
      if (line.trim()) html.push(`<p>${inline(line)}</p>`);
    }
  }
  flush();
  return html.join('');
}
