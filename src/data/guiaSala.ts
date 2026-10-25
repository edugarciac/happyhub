// Guía de uso de la sala (panel de la tablet, luces, aire, música).
// Se muestra en /guia-sala y en /guia-sala/panel (incrustada en el panel de Home Assistant).
import { CONTACT_INFO } from '@/config/contact';
import { FAQ_CATEGORIES, type FaqCategory } from '@/data/faqs';

/** Nombre Bluetooth del amplificador de la sala. Debe coincidir con el configurado en la app WiiM Home. */
export const BLUETOOTH_NAME = 'HappyHub Música';

const SALA_CATEGORIES: FaqCategory[] = [
  {
    title: 'El panel de la sala',
    emoji: '🎛️',
    faqs: [
      {
        question: '¿Desde dónde se controla la sala?',
        answer:
          'Desde la tablet de la pared, con el panel de HappyHub. Desde ahí controlas las luces, el aire acondicionado y la música. Toca cualquier botón para encender o apagar.',
      },
      {
        question: '¿Cómo enciendo todo al llegar?',
        answer:
          'Pulsa el botón verde «Activar». Enciende las luces y la música de la sala de una vez. Después puedes ajustar cada cosa por separado.',
      },
      {
        question: '¿Qué hago al terminar el evento?',
        answer:
          'Pulsa el botón rojo «Desactivar» y confirma. Apaga luces, aire y música y desconecta el móvil que esté sonando.',
      },
      {
        question: 'El panel no responde, ¿qué hago?',
        answer: `Espera unos segundos y vuelve a tocar el botón: algunas órdenes tardan un poco en aplicarse. Si sigue sin funcionar, llámanos o escríbenos por WhatsApp al ${CONTACT_INFO.phoneFormatted}.`,
      },
    ],
  },
  {
    title: 'Luces',
    emoji: '💡',
    faqs: [
      {
        question: '¿Cómo enciendo o apago las luces?',
        answer:
          'En el bloque «Luces» del panel tienes un botón por zona: Sala Principal, Sala Kids, Barra y Jardín. Tócalo para encender o apagar. El icono se ilumina cuando la luz está encendida.',
      },
      {
        question: '¿Puedo dejar una zona apagada?',
        answer:
          'Sí. Cada zona es independiente: por ejemplo, puedes dejar la Sala Kids encendida y apagar la Sala Principal durante una proyección.',
      },
    ],
  },
  {
    title: 'Aire acondicionado',
    emoji: '❄️',
    faqs: [
      {
        question: '¿Cómo cambio la temperatura?',
        answer:
          'En el bloque «Aire acondicionado» hay un control para la Sala Principal y otro para la Sala Kids. Usa los botones − y + para bajar o subir la temperatura.',
      },
      {
        question: '¿Cómo pongo frío, calor o solo ventilador?',
        answer:
          'Debajo de cada sala elige el modo: frío, calor, ventilador o apagado. El cambio se aplica en unos segundos.',
      },
      {
        question: 'La sala tarda en enfriarse, ¿es normal?',
        answer:
          'Sí, sobre todo con mucha gente. Cuanto antes lo enciendas y ajustes, mejor: el aire tarda unos minutos en notarse en toda la sala.',
      },
    ],
  },
  {
    title: 'Música y Bluetooth',
    emoji: '🎵',
    faqs: [
      {
        question: '¿Cómo pongo música desde mi móvil?',
        answer: `1) En el panel, pulsa «Conectar mi móvil» y confirma. 2) Espera a que la tarjeta de estado diga «Listo para conectar». 3) En tu móvil, abre Ajustes → Bluetooth y elige «${BLUETOOTH_NAME}». 4) Pon la música en tu app favorita.`,
      },
      {
        question: 'Mi móvil no encuentra el altavoz',
        answer: `Pulsa otra vez «Conectar mi móvil» y espera unos 10 segundos. Apaga y enciende el Bluetooth de tu móvil y busca de nuevo «${BLUETOOTH_NAME}». Si otro móvil se conectó antes, pídele que desactive su Bluetooth.`,
      },
      {
        question: 'Hay otro móvil sonando y quiero poner el mío',
        answer:
          'Pulsa «Conectar mi móvil» y confirma. El móvil anterior se desconecta y el altavoz queda libre para emparejar el tuyo.',
      },
      {
        question: '¿Qué es la Gramola?',
        answer:
          'Son listas de música preparadas por HappyHub para que no tengas que usar tu móvil: Música Española, Cumpleaños, Verbena y Remember. Entra en «Gramola» y toca la que quieras.',
      },
      {
        question: '¿Cómo subo o bajo el volumen?',
        answer:
          'Con la barra de volumen de la tarjeta «Sonando ahora» del panel, o desde tu móvil si estás conectado por Bluetooth. El volumen máximo de la sala está limitado para cumplir la normativa de ruido.',
      },
      {
        question: '¿Cómo paso de canción o la pauso?',
        answer:
          'En la tarjeta «Sonando ahora» tienes los botones de anterior, reproducir/pausa y siguiente. Si suena desde tu móvil, también puedes hacerlo desde él.',
      },
    ],
  },
];

const AYUDA_CATEGORY: FaqCategory = {
  title: 'Ayuda',
  emoji: '🆘',
  faqs: [
    {
      question: '¿A quién llamo si algo no funciona?',
      answer: `Nuestro equipo está disponible por teléfono durante todo el evento. Llámanos o escríbenos por WhatsApp al ${CONTACT_INFO.phoneFormatted}.`,
    },
  ],
};

/** Categorías de la reserva que también interesan durante el evento (se omite «La reserva»). */
const FROM_FAQS = FAQ_CATEGORIES.filter((c) => c.title !== 'La reserva');

export const GUIA_SALA_CATEGORIES: FaqCategory[] = [...SALA_CATEGORIES, ...FROM_FAQS, AYUDA_CATEGORY];

/** Minúsculas y sin acentos, para buscar «musica» y encontrar «música». */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Filtra preguntas por texto (pregunta y respuesta) y, opcionalmente, por categoría. */
export function filterGuia(
  categories: FaqCategory[],
  query: string,
  category: string | null = null,
): FaqCategory[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  return categories
    .filter((c) => !category || c.title === category)
    .map((c) => ({
      ...c,
      faqs: c.faqs.filter((f) => {
        const haystack = normalizeText(`${f.question} ${f.answer}`);
        return terms.every((t) => haystack.includes(t));
      }),
    }))
    .filter((c) => c.faqs.length > 0);
}
