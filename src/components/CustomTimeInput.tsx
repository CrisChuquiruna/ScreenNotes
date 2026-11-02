import React, { useState, useRef, useEffect } from 'react';

interface CustomTimeInputProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

// Lista completa de todas las horas cada 30 minutos (00:00 a 23:30)
const ALL_HOURS: string[] = [];
for (let h = 0; h < 24; h++) {
  const hh = h.toString().padStart(2, '0');
  ALL_HOURS.push(`${hh}:00`);
  ALL_HOURS.push(`${hh}:30`);
}

export const CustomTimeInput: React.FC<CustomTimeInputProps> = ({
  value,
  onChange,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll automático a la hora seleccionada al abrir
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedEl = dropdownRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        (selectedEl as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  // Manejo de teclado con soporte natural para Backspace/Delete en cualquier posición del cursor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    // Teclas permitidas
    if (['ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
      return;
    }

    // Manejo de Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      let text = value;

      if (start !== end) {
        // Si hay una selección resaltada, borra el rango y reacomoda
        const before = text.slice(0, start);
        const after = text.slice(end);
        const next = (before + after).replace(/[^0-9:]/g, '');
        onChange(next);
        setTimeout(() => input.setSelectionRange(start, start), 0);
        return;
      }

      if (start > 0) {
        // Si el cursor está justo después de los dos puntos (:), salta y borra el dígito anterior
        const deleteIndex = start === 3 ? start - 2 : start - 1;
        const before = text.slice(0, deleteIndex);
        const after = text.slice(deleteIndex + 1);
        const next = before + after;
        onChange(next);
        setTimeout(() => input.setSelectionRange(deleteIndex, deleteIndex), 0);
      }
      return;
    }

    // Manejo de Delete
    if (e.key === 'Delete') {
      e.preventDefault();
      let text = value;

      if (start !== end) {
        const before = text.slice(0, start);
        const after = text.slice(end);
        const next = (before + after).replace(/[^0-9:]/g, '');
        onChange(next);
        setTimeout(() => input.setSelectionRange(start, start), 0);
        return;
      }

      if (start < text.length) {
        // Si el cursor está justo antes de los dos puntos (:), salta y borra el dígito siguiente
        const deleteIndex = start === 2 ? start + 1 : start;
        const before = text.slice(0, deleteIndex);
        const after = text.slice(deleteIndex + 1);
        const next = before + after;
        onChange(next);
        setTimeout(() => input.setSelectionRange(deleteIndex, deleteIndex), 0);
      }
      return;
    }

    // Si escribe ':' manualmente
    if (e.key === ':') {
      e.preventDefault();
      if (!value.includes(':') && value.length > 0) {
        onChange(value + ':');
        setTimeout(() => input.setSelectionRange(value.length + 1, value.length + 1), 0);
      }
      return;
    }

    // Bloquear cualquier tecla que no sea un número (0-9)
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // Inserción de un número en la posición actual del cursor
    e.preventDefault();
    const digit = e.key;
    const text = value;

    // Si hay selección o texto existente
    const before = text.slice(0, start);
    const after = text.slice(end);
    let next = before + digit + after;

    // Si tiene 2 dígitos y no tiene ':', agregar ':'
    const rawDigits = next.replace(/\D/g, '');
    if (rawDigits.length === 2 && !next.includes(':')) {
      next = rawDigits + ':';
    } else if (rawDigits.length > 2 && !next.includes(':')) {
      next = `${rawDigits.slice(0, 2)}:${rawDigits.slice(2, 4)}`;
    }

    // Limitar longitud máxima a 5 caracteres (HH:MM)
    if (next.length <= 5) {
      onChange(next);
      const newPos = start + 1 === 2 && next.includes(':') ? start + 2 : start + 1;
      setTimeout(() => input.setSelectionRange(newPos, newPos), 0);
    }
  };

  // Al salir del campo (onBlur), normalizar si quedó incompleto
  const handleBlur = () => {
    if (!value) return;
    const parts = value.split(':');
    let h = parts[0]?.replace(/\D/g, '') || '';
    let m = parts[1]?.replace(/\D/g, '') || '';

    if (h.length === 1) h = `0${h}`;
    if (h.length === 0) h = '00';
    const numH = parseInt(h, 10);
    if (numH > 23) h = '23';

    if (m.length === 1) m = `${m}0`;
    if (m.length === 0) m = '00';
    const numM = parseInt(m, 10);
    if (numM > 59) m = '59';

    onChange(`${h}:${m}`);
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      {label && (
        <span className="text-[10px] text-zinc-400 uppercase font-semibold mr-1 select-none">
          {label}
        </span>
      )}

      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className="flex items-center justify-center bg-black/60 hover:bg-black/80 border border-white/10 hover:border-blue-500/50 rounded px-2 py-0.5 transition-colors cursor-text"
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onChange={() => {}} // El control total de caracteres y cursor se maneja en onKeyDown
          onBlur={handleBlur}
          placeholder="00:00"
          className="w-12 bg-transparent text-xs font-mono font-medium text-center text-zinc-100 placeholder-zinc-600 focus:outline-none selection:bg-blue-600 tracking-wider"
        />
      </div>

      {/* Menú desplegable completo con todas las horas */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-1.5 left-0 z-50 w-28 max-h-48 overflow-y-auto bg-zinc-900/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-2xl p-1 no-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="text-[9px] uppercase font-bold text-zinc-400 px-2 py-1 tracking-wider border-b border-white/5 mb-0.5">
            Horas
          </div>
          {ALL_HOURS.map((t) => {
            const isSelected = t === value;
            return (
              <button
                key={t}
                type="button"
                data-selected={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(t);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 py-1 rounded-md text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{t}</span>
                {isSelected && <span className="w-1 h-1 rounded-full bg-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
