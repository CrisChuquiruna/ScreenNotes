import React, { useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Pin, PinOff, Minus, X, StickyNote, Calendar } from 'lucide-react';

interface TitleBarProps {
  activeTab: 'notes' | 'routine';
  setActiveTab: (tab: 'notes' | 'routine') => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const [isPinned, setIsPinned] = useState(false);

  const togglePin = async () => {
    try {
      const appWindow = getCurrentWindow();
      const nextState = !isPinned;
      await appWindow.setAlwaysOnTop(nextState);
      setIsPinned(nextState);
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const minimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (err) {
      console.error('Error minimizing:', err);
    }
  };

  const close = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (err) {
      console.error('Error closing:', err);
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between px-3 py-2 bg-zinc-950/90 backdrop-blur-2xl border-b border-white/10 select-none cursor-move rounded-t-xl"
    >
      {/* Pestañas */}
      <div className="flex items-center gap-1.5" data-tauri-drag-region>
        <button
          onClick={() => setActiveTab('routine')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'routine'
              ? 'bg-blue-600/30 border border-blue-500/40 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Calendar size={14} />
          Rutina & Focus
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-blue-600/30 border border-blue-500/40 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <StickyNote size={14} />
          Notas
        </button>
      </div>

      {/* Controles de ventana */}
      <div className="flex items-center gap-1">
        {/* Pin / Always on Top */}
        <button
          onClick={togglePin}
          title={isPinned ? 'Desanclar del frente' : 'Fijar siempre al frente'}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            isPinned
              ? 'text-blue-400 bg-blue-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {isPinned ? <Pin size={13} /> : <PinOff size={13} />}
        </button>

        {/* Minimizar */}
        <button
          onClick={minimize}
          title="Minimizar"
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Minus size={13} />
        </button>

        {/* Cerrar */}
        <button
          onClick={close}
          title="Cerrar"
          className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
