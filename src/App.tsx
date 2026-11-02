import { useState, useEffect, useCallback } from 'react';
import { getCurrentWindow, LogicalPosition, currentMonitor } from '@tauri-apps/api/window';
import { TitleBar } from './components/TitleBar';
import { NotesView } from './components/NotesView';
import { FocusCalendarView } from './components/FocusCalendarView';
import { Note, DayRoutine, CalendarEvent } from './types';

const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Mi primera nota',
    content: `# Título de la nota
Escribe aquí tu contenido o notas rápidas...

- [ ] Tarea pendiente
- [x] Tarea completada

> **Tip:** Usa el ícono del lápiz para editar o la paleta para cambiar de color.`,
    color: 'slate',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const INITIAL_ROUTINES: DayRoutine[] = [
  {
    dayIndex: 1,
    dayName: 'Lunes',
    focus: '',
    colorTag: 'sky',
    timeBlocks: [],
  },
  {
    dayIndex: 2,
    dayName: 'Martes',
    focus: '',
    colorTag: 'amber',
    timeBlocks: [],
  },
  {
    dayIndex: 3,
    dayName: 'Miércoles',
    focus: '',
    colorTag: 'emerald',
    timeBlocks: [],
  },
  {
    dayIndex: 4,
    dayName: 'Jueves',
    focus: '',
    colorTag: 'violet',
    timeBlocks: [],
  },
  {
    dayIndex: 5,
    dayName: 'Viernes',
    focus: '',
    colorTag: 'rose',
    timeBlocks: [],
  },
  {
    dayIndex: 6,
    dayName: 'Sábado',
    focus: '',
    colorTag: 'slate',
    timeBlocks: [],
  },
  {
    dayIndex: 0,
    dayName: 'Domingo',
    focus: '',
    colorTag: 'slate',
    timeBlocks: [],
  },
];

const INITIAL_EVENTS: CalendarEvent[] = [];

export function App() {
  const [activeTab, setActiveTab] = useState<'notes' | 'routine'>('routine');
  const [isCompact, setIsCompact] = useState(false);

  // Posicionar la app inicialmente arriba del reloj de Windows en el primer arranque
  useEffect(() => {
    const initPosition = async () => {
      const hasPositioned = localStorage.getItem('screen_has_positioned');
      if (!hasPositioned) {
        try {
          const monitor = await currentMonitor();
          if (monitor) {
            const scale = monitor.scaleFactor;
            const screenW = monitor.size.width / scale;
            const screenH = monitor.size.height / scale;

            const winW = 420;
            const winH = 580;
            const taskbarMargin = 60;
            const sideMargin = 16;

            const targetX = screenW - winW - sideMargin;
            const targetY = screenH - winH - taskbarMargin;

            const appWindow = getCurrentWindow();
            await appWindow.setPosition(new LogicalPosition(targetX, targetY));
            localStorage.setItem('screen_has_positioned', 'true');
          }
        } catch (err) {
          console.error('Error auto-positioning window:', err);
        }
      }
    };
    initPosition();
  }, []);

  // Notas (si tenía datos precargados viejos, migramos a limpios)
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('screen_notes');
    if (!saved) return INITIAL_NOTES;
    try {
      const parsed = JSON.parse(saved);
      // Si aún contiene el demo inicial viejo de Blender / CV, reseteamos a genérico
      if (Array.isArray(parsed) && parsed[0]?.title === 'Ideas & Tareas Rápidas') {
        return INITIAL_NOTES;
      }
      return parsed;
    } catch {
      return INITIAL_NOTES;
    }
  });
  const [activeNoteId, setActiveNoteId] = useState<string>(() => notes[0]?.id || 'note-1');

  // Rutinas (si tenía datos precargados de demostración viejos, limpiamos a estructura en blanco)
  const [routines, setRoutines] = useState<DayRoutine[]>(() => {
    const saved = localStorage.getItem('screen_routines');
    if (!saved) return INITIAL_ROUTINES;
    try {
      const parsed = JSON.parse(saved);
      // Si contiene los textos viejos de ejemplo, reseteamos a rutinas limpias
      if (Array.isArray(parsed) && parsed.some((r: DayRoutine) => r.focus?.includes('Blender'))) {
        return INITIAL_ROUTINES;
      }
      return parsed;
    } catch {
      return INITIAL_ROUTINES;
    }
  });

  // Eventos de calendario (inicia vacío sin eventos mock)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('screen_events');
    if (!saved) return INITIAL_EVENTS;
    try {
      const parsed = JSON.parse(saved);
      // Filtrar el demo viejo si existía
      if (Array.isArray(parsed)) {
        return parsed.filter((e: CalendarEvent) => e.title !== 'Revisión de avance semanal');
      }
      return parsed;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  // Persistencia
  useEffect(() => {
    localStorage.setItem('screen_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('screen_routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('screen_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  // Handlers de notas
  const handleUpdateNote = (updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Nueva Nota',
      content: '# Título\n\n- [ ] Tarea pendiente',
      color: 'slate',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (activeNoteId === id && remaining.length > 0) {
      setActiveNoteId(remaining[0].id);
    }
  };

  // Handlers de rutinas
  const handleUpdateRoutine = (updated: DayRoutine) => {
    setRoutines((prev) =>
      prev.map((r) => (r.dayIndex === updated.dayIndex ? updated : r))
    );
  };

  // Handlers de eventos
  const handleAddCalendarEvent = (event: CalendarEvent) => {
    setCalendarEvents((prev) => [...prev, event]);
  };

  const handleSyncGoogleEvents = useCallback((googleEvents: CalendarEvent[]) => {
    setCalendarEvents((prev) => {
      const manualEvents = prev.filter((e) => !e.isGoogleEvent);
      const prevGoogle = prev.filter((e) => e.isGoogleEvent);
      if (
        prevGoogle.length === googleEvents.length &&
        prevGoogle.every((ev, i) => ev.id === googleEvents[i]?.id && ev.startTime === googleEvents[i]?.startTime)
      ) {
        return prev;
      }
      return [...manualEvents, ...googleEvents];
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen p-1 select-none overflow-hidden">
      <div className="flex flex-col h-full rounded-xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl">
        <TitleBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCompact={isCompact}
          setIsCompact={setIsCompact}
        />

        <div className="flex-1 overflow-hidden">
          {activeTab === 'notes' ? (
            <NotesView
              notes={notes}
              activeNoteId={activeNoteId}
              setActiveNoteId={setActiveNoteId}
              onUpdateNote={handleUpdateNote}
              onCreateNote={handleCreateNote}
              onDeleteNote={handleDeleteNote}
            />
          ) : (
            <FocusCalendarView
              routines={routines}
              onUpdateRoutine={handleUpdateRoutine}
              calendarEvents={calendarEvents}
              onAddCalendarEvent={handleAddCalendarEvent}
              onSyncGoogleEvents={handleSyncGoogleEvents}
              isCompact={isCompact}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
