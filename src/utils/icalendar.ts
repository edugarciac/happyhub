// Generación de calendarios iCalendar (RFC 5545) para el feed de suscripción

export interface IcsEvent {
  uid: string;
  /** 'YYYY-MM-DD' */
  date: string;
  /** 'HH:MM' hora local de Madrid */
  start: string;
  /** 'HH:MM'; si es anterior o igual a start, termina al día siguiente */
  end: string;
  summary: string;
  description?: string;
  location?: string;
  status?: 'TENTATIVE' | 'CONFIRMED';
  lastModified?: Date;
}

const TZID = 'Europe/Madrid';

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TZID}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Pliega una línea en trozos de 75 octetos (los siguientes empiezan con un espacio) sin partir caracteres UTF-8 */
export function foldIcsLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char, 'utf8');
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function localDateTime(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

function nextDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildIcsCalendar(name: string, events: IcsEvent[], now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HappyHub//Reservas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(name)}`,
    `X-WR-TIMEZONE:${TZID}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
    ...VTIMEZONE,
  ];
  for (const e of events) {
    const endDate = e.end <= e.start ? nextDay(e.date) : e.date;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${utcStamp(now)}`,
      ...(e.lastModified ? [`LAST-MODIFIED:${utcStamp(e.lastModified)}`] : []),
      `DTSTART;TZID=${TZID}:${localDateTime(e.date, e.start)}`,
      `DTEND;TZID=${TZID}:${localDateTime(endDate, e.end)}`,
      `SUMMARY:${escapeIcsText(e.summary)}`,
      ...(e.description ? [`DESCRIPTION:${escapeIcsText(e.description)}`] : []),
      ...(e.location ? [`LOCATION:${escapeIcsText(e.location)}`] : []),
      ...(e.status ? [`STATUS:${e.status}`] : []),
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}
