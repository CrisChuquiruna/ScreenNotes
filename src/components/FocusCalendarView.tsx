import React, { useState } from 'react';
import { Target, Clock, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { DayRoutine, CalendarEvent } from '../types';
import { GoogleCalendarWidget } from './GoogleCalendarWidget';

interface FocusCalendarViewProps {
  routines: DayRoutine[];
  onUpdateRoutine: (updated: DayRoutine) => void;
  calendarEvents: CalendarEvent[];
  onAddCalendarEvent: (event: CalendarEvent) => void;
  onSyncGoogleEvents?: (events: CalendarEvent[]) => void;
}

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const FocusCalendarView: React.FC<FocusCalendarViewProps> = ({
  routines,
  onUpdateRoutine,
  calendarEvents,
  onAddCalendarEvent,
  onSyncGoogleEvents,
}) => {
  // Día actual del sistema (0-6)
  const todayIndex = new Date().getDay();
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

  const currentRoutine = routines.find((r) => r.dayIndex === selectedDayIndex) || {
    dayIndex: selectedDayIndex,
    dayName: DAYS_SHORT[selectedDayIndex],
    focus: 'Planificar el día',
    colorTag: 'blue',
    timeBlocks: [],
  };

  // Formulario nuevo timeblock
  const [newTime, setNewTime] = useState('');
  const [newTask, setNewTask] = useState('');

  const handleFocusChange = (val: string) => {
    onUpdateRoutine({
      ...currentRoutine,
      focus: val,
    });
  };

  const handleAddTimeBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const newBlock = {
      id: Date.now().toString(),
      time: newTime.trim() || 'Cualquier hora',
      task: newTask.trim(),
      completed: false,
    };

    onUpdateRoutine({
      ...currentRoutine,
      timeBlocks: [...currentRoutine.timeBlocks, newBlock],
    });

    setNewTask('');
    setNewTime('');
  };

  const toggleBlockCompleted = (blockId: string) => {
    const updatedBlocks = currentRoutine.timeBlocks.map((b) =>
      b.id === blockId ? { ...b, completed: !b.completed } : b
    );
    onUpdateRoutine({
      ...currentRoutine,
      timeBlocks: updatedBlocks,
    });
  };

  const deleteBlock = (blockId: string) => {
    const updatedBlocks = currentRoutine.timeBlocks.filter((b) => b.id !== blockId);
    onUpdateRoutine({
      ...currentRoutine,
      timeBlocks: updatedBlocks,
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/95 backdrop-blur-2xl border-x border-b border-white/10 rounded-b-xl overflow-hidden text-zinc-100">
      {/* Selector de días de la semana (Lunes a Domingo) */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/50 border-b border-white/5">
        {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
          const isToday = dayIdx === todayIndex;
          const isSelected = dayIdx === selectedDayIndex;
          const dayData = routines.find((r) => r.dayIndex === dayIdx);
          const hasFocus = Boolean(dayData?.focus && dayData.focus.trim());

          return (
            <button
              key={dayIdx}
              onClick={() => setSelectedDayIndex(dayIdx)}
              className={`flex flex-col items-center py-1.5 px-2 rounded-lg text-xs transition-all relative cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/30 border border-blue-500/50 text-white font-bold shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold">{DAYS_SHORT[dayIdx]}</span>
              {isToday && (
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-0.5" title="Hoy" />
              )}
              {hasFocus && !isToday && (
                <span className="w-1 h-1 bg-zinc-500 rounded-full mt-1" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Widget de Google Calendar integrado */}
        <GoogleCalendarWidget
          events={calendarEvents}
          onAddEvent={onAddCalendarEvent}
          onSyncGoogleEvents={onSyncGoogleEvents}
        />

        {/* Tarjeta Enfoque del Día (Daily Focus) */}
        <div className="bg-gradient-to-r from-zinc-900/95 to-zinc-900/70 border border-white/10 rounded-xl p-3 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
            <Target size={14} className="text-amber-400" />
            <span>Foco principal de {currentRoutine.dayName}</span>
          </div>

          <input
            type="text"
            value={currentRoutine.focus}
            onChange={(e) => handleFocusChange(e.target.value)}
            placeholder="Ej: Blender & Modelado 3D, Buscar trabajo..."
            className="w-full bg-transparent text-white font-bold text-base focus:outline-none placeholder-zinc-600 border-b border-transparent focus:border-amber-400/50 transition-colors py-0.5"
          />
        </div>

        {/* Lista de Rutina / Bloques de Horas */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
              <Clock size={13} />
              <span>Horarios & Rutina</span>
            </div>
            <span className="text-[11px] text-zinc-500">
              {currentRoutine.timeBlocks.filter((b) => b.completed).length} /{' '}
              {currentRoutine.timeBlocks.length}
            </span>
          </div>

          {/* Items de la rutina */}
          <div className="space-y-1.5">
            {currentRoutine.timeBlocks.length === 0 ? (
              <div className="text-center py-3 text-xs text-zinc-500">
                No hay bloques de rutina para este día
              </div>
            ) : (
              currentRoutine.timeBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                    block.completed
                      ? 'bg-black/40 border-white/5 text-zinc-500 line-through'
                      : 'bg-white/5 border-white/10 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => toggleBlockCompleted(block.id)}
                      className="text-zinc-400 hover:text-blue-400 transition-colors flex-shrink-0 cursor-pointer"
                    >
                      {block.completed ? (
                        <CheckCircle2 size={16} className="text-blue-400" />
                      ) : (
                        <Circle size={16} />
                      )}
                    </button>
                    <span className="text-[11px] font-mono text-blue-300/80 bg-blue-500/10 px-1 rounded flex-shrink-0">
                      {block.time}
                    </span>
                    <span className="text-xs truncate">{block.task}</span>
                  </div>

                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                    title="Eliminar bloque"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Formulario rápido para agregar bloque de horario */}
          <form onSubmit={handleAddTimeBlock} className="mt-3 pt-2 border-t border-white/5 flex gap-1.5">
            <input
              type="text"
              placeholder="09:00 - 13:00"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-24 bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="¿Qué vas a hacer?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs flex items-center transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
