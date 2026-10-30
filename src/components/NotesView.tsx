import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plus, Trash2, Edit3, Eye, Palette, CheckSquare } from 'lucide-react';
import { Note } from '../types';

interface NotesViewProps {
  notes: Note[];
  activeNoteId: string;
  setActiveNoteId: (id: string) => void;
  onUpdateNote: (updated: Note) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
}

const COLOR_CLASSES: Record<Note['color'], { bg: string; border: string; accent: string }> = {
  slate: {
    bg: 'bg-zinc-950/95',
    border: 'border-zinc-800/80',
    accent: 'bg-zinc-600',
  },
  amber: {
    bg: 'bg-[#1c140a]/95',
    border: 'border-amber-700/50',
    accent: 'bg-amber-500',
  },
  emerald: {
    bg: 'bg-[#091a14]/95',
    border: 'border-emerald-700/50',
    accent: 'bg-emerald-500',
  },
  violet: {
    bg: 'bg-[#160d24]/95',
    border: 'border-purple-700/50',
    accent: 'bg-purple-500',
  },
  rose: {
    bg: 'bg-[#220d14]/95',
    border: 'border-rose-700/50',
    accent: 'bg-rose-500',
  },
  sky: {
    bg: 'bg-[#0a1826]/95',
    border: 'border-sky-700/50',
    accent: 'bg-sky-500',
  },
};

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  activeNoteId,
  setActiveNoteId,
  onUpdateNote,
  onCreateNote,
  onDeleteNote,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  if (!currentNote) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 h-full">
        <p className="mb-3 text-sm">No tienes notas todavía</p>
        <button
          onClick={onCreateNote}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-colors"
        >
          <Plus size={14} />
          Crear mi primera nota
        </button>
      </div>
    );
  }

  const theme = COLOR_CLASSES[currentNote.color] || COLOR_CLASSES.slate;

  const insertMarkdown = (prefix: string, suffix = '') => {
    const textarea = document.getElementById('note-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = currentNote.content;
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || 'texto'}${suffix}`;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    onUpdateNote({ ...currentNote, content: newContent, updatedAt: Date.now() });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected || 'texto').length);
    }, 10);
  };

  const handleCheckboxToggle = (index: number) => {
    let checkCount = 0;
    const updatedContent = currentNote.content.replace(/\[([ xX])\]/g, (match, state) => {
      if (checkCount === index) {
        checkCount++;
        return state === ' ' ? '[x]' : '[ ]';
      }
      checkCount++;
      return match;
    });

    onUpdateNote({ ...currentNote, content: updatedContent, updatedAt: Date.now() });
  };

  return (
    <div className={`flex flex-col h-full ${theme.bg} backdrop-blur-2xl border-x border-b ${theme.border} rounded-b-xl overflow-hidden transition-colors duration-300`}>
      {/* Barra de pestañas de notas y acciones */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/5">
        {/* Selector de notas (chips) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[260px] py-1">
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveNoteId(n.id)}
              className={`px-2 py-0.5 rounded-md text-xs truncate max-w-[90px] transition-all cursor-pointer ${
                n.id === currentNote.id
                  ? 'bg-white/20 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {n.title || 'Sin título'}
            </button>
          ))}
          <button
            onClick={onCreateNote}
            title="Nueva nota"
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Herramientas de la nota actual */}
        <div className="flex items-center gap-1">
          {/* Paleta de colores */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Cambiar color de nota"
              className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
            >
              <Palette size={13} />
            </button>

            {showColorPicker && (
              <div className="absolute right-0 top-7 z-50 p-1.5 bg-zinc-900 border border-white/20 rounded-lg shadow-xl flex gap-1.5">
                {(['slate', 'amber', 'emerald', 'violet', 'sky', 'rose'] as Note['color'][]).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onUpdateNote({ ...currentNote, color: c, updatedAt: Date.now() });
                      setShowColorPicker(false);
                    }}
                    className={`w-5 h-5 rounded-full ${COLOR_CLASSES[c].accent} border-2 ${
                      currentNote.color === c ? 'border-white scale-110' : 'border-transparent'
                    } transition-all cursor-pointer`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Toggle Editar / Ver */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'Ver Markdown' : 'Editar nota'}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isEditing ? 'text-blue-400 bg-blue-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
          </button>

          {/* Eliminar nota */}
          {notes.length > 1 && (
            <button
              onClick={() => onDeleteNote(currentNote.id)}
              title="Eliminar esta nota"
              className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Título de la nota */}
      <div className="px-4 pt-3 pb-1">
        <input
          type="text"
          value={currentNote.title}
          onChange={(e) => onUpdateNote({ ...currentNote, title: e.target.value, updatedAt: Date.now() })}
          placeholder="Título de la nota..."
          className="w-full bg-transparent text-white font-bold text-base focus:outline-none placeholder-white/30"
        />
      </div>

      {/* Editor Markdown Toolbar */}
      {isEditing && (
        <div className="flex items-center gap-1 px-3 py-1 bg-white/5 border-y border-white/5 text-zinc-400 text-xs">
          <button
            onClick={() => insertMarkdown('# ')}
            className="px-1.5 py-0.5 hover:text-white hover:bg-white/10 rounded cursor-pointer"
            title="Encabezado H1"
          >
            H1
          </button>
          <button
            onClick={() => insertMarkdown('## ')}
            className="px-1.5 py-0.5 hover:text-white hover:bg-white/10 rounded cursor-pointer"
            title="Encabezado H2"
          >
            H2
          </button>
          <button
            onClick={() => insertMarkdown('**', '**')}
            className="px-1.5 py-0.5 hover:text-white hover:bg-white/10 font-bold rounded cursor-pointer"
            title="Negrita"
          >
            B
          </button>
          <button
            onClick={() => insertMarkdown('*', '*')}
            className="px-1.5 py-0.5 hover:text-white hover:bg-white/10 italic rounded cursor-pointer"
            title="Cursiva"
          >
            I
          </button>
          <button
            onClick={() => insertMarkdown('- [ ] ')}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:text-white hover:bg-white/10 rounded cursor-pointer"
            title="Tarea con Checkbox"
          >
            <CheckSquare size={12} /> Tarea
          </button>
          <button
            onClick={() => insertMarkdown('- ')}
            className="px-1.5 py-0.5 hover:text-white hover:bg-white/10 rounded cursor-pointer"
            title="Lista con viñetas"
          >
            • Lista
          </button>
        </div>
      )}

      {/* Contenido: Editor textarea o Vista Markdown */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isEditing ? (
          <textarea
            id="note-textarea"
            value={currentNote.content}
            onChange={(e) => onUpdateNote({ ...currentNote, content: e.target.value, updatedAt: Date.now() })}
            placeholder="Escribe en Markdown... Usa - [ ] para crear tareas interactivas."
            className="w-full h-full bg-transparent resize-none text-zinc-200 text-sm focus:outline-none font-mono leading-relaxed placeholder-white/20"
          />
        ) : (
          <div className="markdown-body text-sm text-zinc-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                input: ({ checked, ...props }) => {
                  return (
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const allBoxes = document.querySelectorAll('.markdown-body input[type="checkbox"]');
                        const index = Array.from(allBoxes).indexOf(props as unknown as Element);
                        if (index !== -1) handleCheckboxToggle(index);
                      }}
                      className="cursor-pointer accent-blue-500 rounded"
                    />
                  );
                },
              }}
            >
              {currentNote.content || '*Esta nota está vacía. Haz clic en el lápiz arriba para escribir.*'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
