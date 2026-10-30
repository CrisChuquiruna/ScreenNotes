export interface Note {
  id: string;
  title: string;
  content: string;
  color: 'slate' | 'amber' | 'emerald' | 'violet' | 'rose' | 'sky';
  createdAt: number;
  updatedAt: number;
}

export interface DayRoutine {
  dayIndex: number; // 0 = Domingo, 1 = Lunes, etc.
  dayName: string;
  focus: string; // ej. "Blender & 3D"
  colorTag: string;
  timeBlocks: {
    id: string;
    time: string; // ej. "09:00 - 12:00"
    task: string;
    completed: boolean;
  }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO string o "15:30"
  endTime?: string;
  location?: string;
  isGoogleEvent?: boolean;
}
