import React, { useState } from 'react';
import { Target, Clock, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { DayRoutine, CalendarEvent } from '../types';
import { GoogleCalendarWidget } from './GoogleCalendarWidget';
import { CustomTimeInput } from './CustomTimeInput';

interface FocusCalendarViewProps {
  routines: DayRoutine[];
  onUpdateRoutine: (updated: DayRoutine) => void;
  calendarEvents: CalendarEvent[];
  onAddCalendarEvent: (event: CalendarEvent) => void;
  onSyncGoogleEvents?: (events: CalendarEvent[]) => void;
  isCompact?: boolean;
}

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const FocusCalendarView: React.FC<FocusCalendarViewProps> = ({
  routines,
  onUpdateRoutine,
  calendarEvents,
  onAddCalendarEvent,
  onSyncGoogleEvents,
  isCompact = false,
}) => {
  const todayIndex = new Date().getDay();
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

  const currentRoutine = routines.find((r) => r.dayIndex === selectedDayIndex) || {
    dayIndex: selectedDayIndex,
    dayName: DAYS_SHORT[selectedDayIndex],
    focus: '',
    colorTag: 'blue',
    timeBlocks: [],
  };

  // Horas por defecto con selector personalizado
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [newTask, setNewTask] = useState('');

  // Encontrar el hábito/rutina más cercano de hoy según la hora actual
  const todayRoutine = routines.find((r) => r.dayIndex === todayIndex);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseStartMinutes = (timeStr: string): number => {
    const startPart = timeStr.split('-')[0]?.trim();
    if (!startPart || !startPart.includes(':')) return 99999;
    const [h, m] = startPart.split(':').map((v) => parseInt(v, 10) || 0);
    return h * 60 + m;
  };

  const upcomingHabits = (todayRoutine?.timeBlocks || [])
    .filter((b) => !b.completed)
    .sort((a, b) => {
      const diffA = parseStartMinutes(a.time) - currentMinutes;
      const diffB = parseStartMinutes(b.time) - currentMinutes;
      return (diffA < -30 ? diffA + 1440 : diffA) - (diffB < -30 ? diffB + 1440 : diffB);
    });

  const nextHabit = upcomingHabits[0] || null;

  const handleFocusChange = (val: string) => {
    onUpdateRoutine({
      ...currentRoutine,
      focus: val,
    });
  };

  const handleAddTimeBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const timeRange = startTime && endTime
      ? `${startTime} - ${endTime}`
      : startTime || 'Hora no especificada';

    const newBlock = {
      id: Date.now().toString(),
      time: timeRange,
      task: newTask.trim(),
      completed: false,
    };

    onUpdateRoutine({
      ...currentRoutine,
      timeBlocks: [...currentRoutine.timeBlocks, newBlock],
    });

    setNewTask('');
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
      {/* Selector de días de la semana (oculto en modo compacto) */}
      {!isCompact && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-black/50 border-b border-white/5">
          {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
            const isToday = dayIdx === todayIndex;
            const isSelected = dayIdx === selectedDayIndex;
            const dayData = routines.find((r) => r.dayIndex === dayIdx);
            const hasFocus = Boolean(dayData?.focus && dayData.focus.trim());

            return (
              <button
                key={dayIdx}
                onClick={() => setSelectedDayIndex(dayIdx)}
                className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs transition-all relative cursor-pointer ${
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
                  <span className="w-1 h-1 bg-zinc-500 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Contenedor principal: en modo compacto usa flex flex-col h-full para distribuir dinámicamente el espacio */}
      <div className={`flex-1 overflow-y-auto ${isCompact ? 'p-2 flex flex-col gap-2 h-full' : 'p-2.5 space-y-2.5'}`}>
        {/* Widget de Google Calendar integrado (con flex-1 en compacto para expandir si no hay hábito) */}
        <GoogleCalendarWidget
          events={calendarEvents}
          onAddEvent={onAddCalendarEvent}
          onSyncGoogleEvents={onSyncGoogleEvents}
          isCompact={isCompact}
          hasHabit={Boolean(nextHabit)}
        />

        {/* Tarjeta de Rutina/Hábito más cercano en modo compacto (con flex-1 para expandir si no hay evento de calendar) */}
        {isCompact && nextHabit && (
          <div className="flex-1 min-h-[46px] bg-gradient-to-r from-emerald-950/50 to-teal-950/40 border border-emerald-500/35 rounded-lg px-3 py-2 shadow-sm flex items-center justify-between gap-2 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded font-semibold flex-shrink-0">
                {nextHabit.time}
              </span>
              <span className="text-xs text-zinc-100 font-semibold truncate">
                {nextHabit.task}
              </span>
            </div>
            <button
              onClick={() => toggleBlockCompleted(nextHabit.id)}
              className="text-zinc-400 hover:text-emerald-400 transition-colors ml-1.5 flex-shrink-0 cursor-pointer"
              title="Marcar completado"
            >
              <CheckCircle2 size={16} />
            </button>
          </div>
        )}

        {/* Secciones expandidas (solo en modo normal) */}
        {!isCompact && (
          <>
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
                placeholder="Escribe el objetivo o foco del día aquí..."
                className="w-full bg-transparent text-white font-bold text-base focus:outline-none placeholder-zinc-600 border-b border-transparent focus:border-amber-400/50 transition-colors py-0.5"
              />
            </div>

            {/* Lista de Hábitos & Rutinas */}
            <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                  <Clock size={13} />
                  <span>Hábitos & Rutinas</span>
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
                    No hay hábitos o rutinas programadas para este día
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
                        className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer flex-shrink-0 ml-1"
                        title="Eliminar bloque"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Formulario */}
              <form onSubmit={handleAddTimeBlock} className="mt-3 pt-2.5 border-t border-white/5 flex flex-col gap-2">
                <div className="flex items-center gap-2 w-full">
                  <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-1 flex-shrink-0">
                    <CustomTimeInput
                      label="De"
                      value={startTime}
                      onChange={setStartTime}
                    />
                    <CustomTimeInput
                      label="a"
                      value={endTime}
                      onChange={setEndTime}
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Descripción..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />

                  <button
                    type="submit"
                    className="flex-shrink-0 w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer shadow-sm active:scale-95"
                    title="Agregar hábito o rutina"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
