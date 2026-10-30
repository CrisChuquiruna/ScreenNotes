import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, RefreshCw, LogOut, AlertCircle, Settings } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { CalendarEvent } from '../types';

const DEFAULT_CLIENT_ID = '367307084461-rsf0pfb3u5i2qded3jeiuaao98eq0vti.apps.googleusercontent.com';
const DEFAULT_CLIENT_SECRET = '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';

interface GoogleAuthResponse {
  access_token: string;
  email?: string;
  name?: string;
}

interface GoogleApiEventItem {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
}

interface GoogleCalendarWidgetProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onSyncGoogleEvents?: (events: CalendarEvent[]) => void;
}

export const GoogleCalendarWidget: React.FC<GoogleCalendarWidgetProps> = ({
  events,
  onSyncGoogleEvents,
}) => {
  const [clientId, setClientId] = useState(() => localStorage.getItem('gcal_client_id') || DEFAULT_CLIENT_ID);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('gcal_token') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('gcal_email') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('gcal_name') || '');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
  const [timeLeftText, setTimeLeftText] = useState<string>('');

  // Sincronizar eventos desde Google Calendar API
  const fetchEvents = useCallback(async (tokenToUse?: string) => {
    const token = tokenToUse || accessToken;
    if (!token) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const jsonStr = await invoke<string>('fetch_google_events', { accessToken: token });
      const data: { items?: GoogleApiEventItem[] } = JSON.parse(jsonStr);

      const items = data.items || [];
      const parsed: CalendarEvent[] = items
        .filter((it) => it.start?.dateTime || it.start?.date)
        .map((it) => {
          const startTime = it.start?.dateTime || it.start?.date || '';
          return {
            id: it.id,
            title: it.summary || 'Sin título',
            startTime: new Date(startTime).toISOString(),
            endTime: it.end?.dateTime ? new Date(it.end.dateTime).toISOString() : undefined,
            location: it.location,
            isGoogleEvent: true,
          };
        });

      if (onSyncGoogleEvents) {
        onSyncGoogleEvents(parsed);
      }
    } catch (err: unknown) {
      console.error('Error fetching google events:', err);
      const msg = typeof err === 'string' ? err : (err as Error)?.message || 'Error de red';
      if (msg === 'SESSION_EXPIRED') {
        setErrorMessage('Tu sesión de Google expiró. Por favor vuelve a iniciar sesión.');
        handleLogout();
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, onSyncGoogleEvents]);

  // Usamos ref para que el polling de 10 min no cree loops de re-render
  const fetchEventsRef = useRef(fetchEvents);
  fetchEventsRef.current = fetchEvents;

  // Sincronización automática periódica cada 10 min si está logueado
  useEffect(() => {
    if (accessToken) {
      fetchEventsRef.current();
      const interval = setInterval(() => {
        fetchEventsRef.current();
      }, 10 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [accessToken]);

  // Iniciar sesión con Google (OAuth 2.0 PKCE)
  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await invoke<GoogleAuthResponse>('google_login', {
        clientId: clientId.trim(),
        clientSecret: DEFAULT_CLIENT_SECRET,
      });
      setAccessToken(res.access_token);
      localStorage.setItem('gcal_token', res.access_token);

      if (res.email) {
        setUserEmail(res.email);
        localStorage.setItem('gcal_email', res.email);
      }
      if (res.name) {
        setUserName(res.name);
        localStorage.setItem('gcal_name', res.name);
      }

      fetchEvents(res.access_token);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = typeof err === 'string' ? err : (err as Error)?.message || 'No se pudo completar el login';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setAccessToken('');
    setUserEmail('');
    setUserName('');
    localStorage.removeItem('gcal_token');
    localStorage.removeItem('gcal_email');
    localStorage.removeItem('gcal_name');
    if (onSyncGoogleEvents) {
      onSyncGoogleEvents([]);
    }
  };

  // Calcular el evento más próximo y actualizar el contador cada minuto
  useEffect(() => {
    const updateClosestEvent = () => {
      if (!events.length) {
        setNextEvent(null);
        return;
      }

      const now = new Date();
      const upcoming = events
        .map((ev) => {
          let date = new Date(ev.startTime);
          if (isNaN(date.getTime())) {
            const [h, m] = ev.startTime.split(':').map(Number);
            date = new Date();
            date.setHours(h || 0, m || 0, 0, 0);
          }
          return { ...ev, dateObj: date };
        })
        .filter((ev) => ev.dateObj.getTime() >= now.getTime() - 1000 * 60 * 20)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

      if (upcoming.length > 0) {
        const closest = upcoming[0];
        setNextEvent(closest);

        const diffMs = closest.dateObj.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / (1000 * 60));

        if (diffMins <= 0) {
          setTimeLeftText('¡Ocurriendo ahora!');
        } else if (diffMins < 60) {
          setTimeLeftText(`en ${diffMins} min`);
        } else {
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          setTimeLeftText(`en ${hours}h ${mins > 0 ? `${mins}m` : ''}`);
        }
      } else {
        setNextEvent(null);
      }
    };

    updateClosestEvent();
    const interval = setInterval(updateClosestEvent, 30 * 1000);
    return () => clearInterval(interval);
  }, [events]);

  return (
    <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 backdrop-blur-md">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <CalendarIcon size={14} className="text-blue-400" />
          <span>Próximo Evento</span>
          {accessToken && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Google Calendar Conectado" />
          )}
        </div>

        <div className="flex items-center gap-1">
          {accessToken && (
            <button
              onClick={() => fetchEvents()}
              disabled={isLoading}
              title="Refrescar eventos"
              className={`p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors ${
                isLoading ? 'animate-spin text-blue-400' : ''
              }`}
            >
              <RefreshCw size={12} />
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Configuración de Google"
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors"
          >
            <Settings size={12} />
          </button>
        </div>
      </div>

      {/* Alerta de Error */}
      {errorMessage && (
        <div className="flex items-start gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mb-2 leading-tight">
          <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Aviso:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Si está autenticado: muestra el evento o mensaje */}
      {accessToken ? (
        <div>
          {nextEvent ? (
            <div className="bg-gradient-to-r from-blue-950/50 to-indigo-950/40 border border-blue-500/30 rounded-lg p-2.5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded">
                  {timeLeftText}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Clock size={11} />
                  <span>
                    {new Date(nextEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="font-semibold text-sm text-zinc-100 truncate">{nextEvent.title}</div>
              {nextEvent.location && (
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">{nextEvent.location}</div>
              )}
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-zinc-500">
              No tienes eventos programados en las próximas horas
            </div>
          )}

          {/* Info de cuenta conectada */}
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="truncate max-w-[200px]" title={userEmail || userName}>
              {userEmail || userName || 'Cuenta conectada'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-red-400/80 hover:text-red-300 text-[10px] px-1.5 py-0.5 hover:bg-red-500/10 rounded transition-colors"
            >
              <LogOut size={11} />
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : (
        /* Si NO está autenticado: Botón llamativo de login con Google */
        <div className="text-center py-2">
          <p className="text-[11px] text-zinc-400 mb-2.5">
            Conecta tu cuenta para ver tus eventos en tiempo real.
          </p>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white text-zinc-800 hover:bg-zinc-100 font-semibold text-xs py-2 px-3 rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Abriendo navegador...' : 'Iniciar sesión con Google'}</span>
          </button>
        </div>
      )}

      {/* Configuración avanzada (Client ID) */}
      {showSettings && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs">
          <div>
            <label className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
              Google Client ID:
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                localStorage.setItem('gcal_client_id', e.target.value);
              }}
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 text-[11px] font-mono"
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={() => setShowSettings(false)}
              className="px-2.5 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[11px]"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
