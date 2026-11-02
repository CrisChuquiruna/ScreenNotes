import React, { useState } from 'react';
import { getCurrentWindow, LogicalSize, LogicalPosition } from '@tauri-apps/api/window';
import { Pin, PinOff, Minus, X, StickyNote, Calendar, ChevronUp, ChevronDown } from 'lucide-react';

interface TitleBarProps {
  activeTab: 'notes' | 'routine';
  setActiveTab: (tab: 'notes' | 'routine') => void;
  isCompact: boolean;
  setIsCompact: (compact: boolean | ((prev: boolean) => boolean)) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeTab,
  setActiveTab,
  isCompact,
  setIsCompact,
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

  // Expandir la ventana hacia arriba manteniendo la base fija en pantalla
  const expandWindow = async () => {
    try {
      const appWindow = getCurrentWindow();
      const currentPos = await appWindow.outerPosition();
      const scaleFactor = await appWindow.scaleFactor();

      const normalHeight = 580;
      const compactHeight = 175;
      const windowWidth = 420;

      const currentLogicalY = currentPos.y / scaleFactor;
      const currentLogicalX = currentPos.x / scaleFactor;

      const delta = normalHeight - compactHeight;
      const newY = currentLogicalY - delta;

      await appWindow.setSize(new LogicalSize(windowWidth, normalHeight));
      await appWindow.setPosition(new LogicalPosition(currentLogicalX, newY));
      setIsCompact(false);
    } catch (err) {
      console.error('Error expanding window:', err);
    }
  };

  // Alternar entre modo Widget Compacto y modo Normal Expandido manteniendo la base fija
  const toggleCompactMode = async () => {
    try {
      const appWindow = getCurrentWindow();
      const nextState = !isCompact;

      const currentPos = await appWindow.outerPosition();
      const scaleFactor = await appWindow.scaleFactor();

      const normalHeight = 580;
      const compactHeight = 175;
      const windowWidth = 420;

      const currentLogicalY = currentPos.y / scaleFactor;
      const currentLogicalX = currentPos.x / scaleFactor;

      if (nextState) {
        // Al compactar: el borde inferior se mantiene donde estaba, la parte superior baja
        const delta = normalHeight - compactHeight;
        const newY = currentLogicalY + delta;

        await appWindow.setSize(new LogicalSize(windowWidth, compactHeight));
        await appWindow.setPosition(new LogicalPosition(currentLogicalX, newY));
      } else {
        // Al expandir: la parte superior sube, el borde inferior se mantiene
        const delta = normalHeight - compactHeight;
        const newY = currentLogicalY - delta;

        await appWindow.setSize(new LogicalSize(windowWidth, normalHeight));
        await appWindow.setPosition(new LogicalPosition(currentLogicalX, newY));
      }
      setIsCompact(nextState);
    } catch (err) {
      console.error('Error changing window size/position:', err);
    }
  };

  // Si hace clic en "Notas" estando en modo compacto, se auto-expande la ventana
  const handleTabClick = (tab: 'notes' | 'routine') => {
    if (tab === 'notes' && isCompact) {
      expandWindow();
    }
    setActiveTab(tab);
  };

  // Al minimizar: se oculta a la bandeja del sistema (System Tray)
  const minimizeToTray = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.hide();
    } catch (err) {
      console.error('Error hiding to tray:', err);
    }
  };

  // Al presionar la X: también se oculta a la bandeja del sistema
  const closeToTray = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.hide();
    } catch (err) {
      console.error('Error hiding to tray:', err);
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
          onClick={() => handleTabClick('routine')}
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
          onClick={() => handleTabClick('notes')}
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
        {/* Botón Compactar / Expandir Widget */}
        <button
          onClick={toggleCompactMode}
          title={isCompact ? 'Expandir hacia arriba' : 'Compactar hacia abajo (fijo sobre la hora)'}
          className="p-1.5 rounded-md text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
        >
          {isCompact ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

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

        {/* Minimizar a la bandeja */}
        <button
          onClick={minimizeToTray}
          title="Minimizar a la bandeja del sistema"
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Minus size={13} />
        </button>

        {/* Cerrar a la bandeja */}
        <button
          onClick={closeToTray}
          title="Ocultar en la bandeja (no cierra la app)"
          className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
