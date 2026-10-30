import { CalendarEvent } from '../types';

/**
 * Parsea una fecha en formato iCalendar (ej: 20261028T183000Z o 20261028)
 */
function parseIcsDate(raw: string): Date | null {
  if (!raw) return null;
  const clean = raw.trim();

  // Formato UTC: 20261028T183000Z
  if (clean.includes('T')) {
    const parts = clean.split('T');
    const datePart = parts[0];
    const timePart = parts[1].replace('Z', '');

    const year = parseInt(datePart.substring(0, 4), 10);
    const month = parseInt(datePart.substring(4, 6), 10) - 1;
    const day = parseInt(datePart.substring(6, 8), 10);

    const hours = parseInt(timePart.substring(0, 2), 10) || 0;
    const minutes = parseInt(timePart.substring(2, 4), 10) || 0;
    const seconds = parseInt(timePart.substring(4, 6), 10) || 0;

    if (clean.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    }
    return new Date(year, month, day, hours, minutes, seconds);
  }

  // Formato solo fecha (día completo): 20261028
  if (clean.length >= 8) {
    const year = parseInt(clean.substring(0, 4), 10);
    const month = parseInt(clean.substring(4, 6), 10) - 1;
    const day = parseInt(clean.substring(6, 8), 10);
    return new Date(year, month, day, 0, 0, 0);
  }

  return null;
}

/**
 * Parsea el texto del archivo .ics de Google Calendar y extrae los eventos
 */
export function parseICalendar(icsContent: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsContent.split(/\r\n|\n|\r/);

  let inEvent = false;
  let currentSummary = '';
  let currentStart = '';
  let currentEnd = '';
  let currentLocation = '';
  let currentUid = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Manejo de líneas partidas de iCal (que empiezan con espacio o tab)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].substring(1);
    }

    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      currentSummary = '';
      currentStart = '';
      currentEnd = '';
      currentLocation = '';
      currentUid = '';
      continue;
    }

    if (line.startsWith('END:VEVENT')) {
      inEvent = false;
      const startDate = parseIcsDate(currentStart);

      if (startDate && currentSummary) {
        events.push({
          id: currentUid || `event-${Date.now()}-${Math.random()}`,
          title: currentSummary,
          startTime: startDate.toISOString(),
          endTime: currentEnd ? parseIcsDate(currentEnd)?.toISOString() : undefined,
          location: currentLocation,
          isGoogleEvent: true,
        });
      }
      continue;
    }

    if (!inEvent) continue;

    if (line.startsWith('SUMMARY:')) {
      currentSummary = line.substring(8).replace(/\\,/g, ',').replace(/\\;/g, ';').trim();
    } else if (line.startsWith('DTSTART')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        currentStart = line.substring(colonIdx + 1).trim();
      }
    } else if (line.startsWith('DTEND')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        currentEnd = line.substring(colonIdx + 1).trim();
      }
    } else if (line.startsWith('LOCATION:')) {
      currentLocation = line.substring(9).replace(/\\,/g, ',').trim();
    } else if (line.startsWith('UID:')) {
      currentUid = line.substring(4).trim();
    }
  }

  // Filtrar eventos de hoy en adelante (desde hace 2 horas para no perder el que recién empezó)
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  return events
    .filter((e) => new Date(e.startTime).getTime() >= twoHoursAgo)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}
