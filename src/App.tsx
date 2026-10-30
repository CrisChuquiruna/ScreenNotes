import { useState, useEffect, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { NotesView } from './components/NotesView';
import { FocusCalendarView } from './components/FocusCalendarView';
import { Note, DayRoutine, CalendarEvent } from './types';

const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Ideas & Tareas Rápidas',
    content: `# ScreenNotes 🚀
Notita anclada a tu pantalla.

- [x] Probar soporte Markdown
- [ ] Renderizar escena 3D en Blender
- [ ] Actualizar CV y perfil de LinkedIn

> **Tip:** Haz clic en el ícono de lápiz para editar, o en el pin de arriba para dejarla flotando.`,
    color: 'slate',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const INITIAL_ROUTINES: DayRoutine[] = [
  {
    dayIndex: 1, // Lunes
    dayName: 'Lunes',
    focus: 'Planificación & Proyectos',
    colorTag: 'sky',
    timeBlocks: [
      { id: '1', time: '09:00 - 13:00', task: 'Organizar la semana y revisar código', completed: true },
      { id: '2', time: '14:30 - 18:00', task: 'Desarrollo de features principales', completed: false },
    ],
  },
  {
    dayIndex: 2, // Martes
    dayName: 'Martes',
    focus: '🎨 Blender & Modelado 3D',
    colorTag: 'amber',
    timeBlocks: [
      { id: '3', time: '10:00 - 13:00', task: 'Modelado de personajes y assets', completed: false },
      { id: '4', time: '15:00 - 18:00', task: 'Texturizado, shading y render', completed: false },
    ],
  },
  {
    dayIndex: 3, // Miércoles
    dayName: 'Miércoles',
    focus: '💼 Buscar Trabajo & Portfolio',
    colorTag: 'emerald',
    timeBlocks: [
      { id: '5', time: '09:30 - 12:30', task: 'Enviar postulaciones y conectar en LinkedIn', completed: false },
      { id: '6', time: '14:00 - 17:00', task: 'Mejorar proyectos del portfolio', completed: false },
    ],
  },
  {
    dayIndex: 4, // Jueves
    dayName: 'Jueves',
    focus: 'Programación & Aprendizaje',
    colorTag: 'violet',
    timeBlocks: [
      { id: '7', time: '09:00 - 13:00', task: 'Prácticas y cursos técnicos', completed: false },
    ],
  },
  {
    dayIndex: 5, // Viernes
    dayName: 'Viernes',
    focus: 'Review Semanal & Deploy',
    colorTag: 'rose',
    timeBlocks: [
      { id: '8', time: '10:00 - 14:00', task: 'Cierre de objetivos y commits', completed: false },
    ],
  },
  {
    dayIndex: 6, // Sábado
    dayName: 'Sábado',
    focus: 'Proyectos Personales & Relax',
    colorTag: 'slate',
    timeBlocks: [],
  },
  {
    dayIndex: 0, // Domingo
    dayName: 'Domingo',
    focus: 'Descanso & Desconexión',
    colorTag: 'slate',
    timeBlocks: [],
  },
];

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Revisión de avance semanal',
    startTime: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
  },
];

export function App() {
  // Ahora inicia por defecto en 'routine'
  const [activeTab, setActiveTab] = useState<'notes' | 'routine'>('routine');

  // Notas
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('screen_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });
  const [activeNoteId, setActiveNoteId] = useState<string>(() => notes[0]?.id || 'note-1');

  // Rutinas
  const [routines, setRoutines] = useState<DayRoutine[]>(() => {
    const saved = localStorage.getItem('screen_routines');
    return saved ? JSON.parse(saved) : INITIAL_ROUTINES;
  });

  // Eventos de calendario
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('screen_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
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
      content: '# Nueva Nota\n\n- [ ] Primera tarea',
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
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
