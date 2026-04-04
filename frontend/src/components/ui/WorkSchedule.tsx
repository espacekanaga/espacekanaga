import { useState } from 'react';

type DaySchedule = {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((day) => ({
  day: day.key,
  isOpen: day.key !== 'sunday',
  openTime: '08:00',
  closeTime: '18:00',
}));

interface WorkScheduleProps {
  schedule?: DaySchedule[];
  onChange?: (schedule: DaySchedule[]) => void;
  disabled?: boolean;
}

export function WorkSchedule({ schedule = DEFAULT_SCHEDULE, onChange, disabled = false }: WorkScheduleProps) {
  const [localSchedule, setLocalSchedule] = useState<DaySchedule[]>(schedule);

  const handleToggleDay = (index: number) => {
    const newSchedule = [...localSchedule];
    newSchedule[index].isOpen = !newSchedule[index].isOpen;
    setLocalSchedule(newSchedule);
    onChange?.(newSchedule);
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    const newSchedule = [...localSchedule];
    newSchedule[index][field] = value;
    setLocalSchedule(newSchedule);
    onChange?.(newSchedule);
  };

  return (
    <div className="space-y-2">
      {DAYS.map((day, index) => (
        <div
          key={day.key}
          className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border transition-all ${
            localSchedule[index]?.isOpen
              ? 'border-slate-200/70 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/20'
              : 'border-slate-200/30 dark:border-slate-700/30 bg-slate-100/30 dark:bg-slate-800/20 opacity-60'
          }`}
        >
          {/* Day row with checkbox */}
          <label className="flex items-center gap-2 min-w-[80px] sm:min-w-[100px]">
            <input
              type="checkbox"
              checked={localSchedule[index]?.isOpen}
              onChange={() => handleToggleDay(index)}
              disabled={disabled}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {day.label}
            </span>
          </label>

          {/* Time inputs - stacked on mobile, row on desktop */}
          {localSchedule[index]?.isOpen ? (
            <div className="flex items-center gap-2 flex-1 ml-6 sm:ml-0">
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-slate-500 hidden sm:inline">De</span>
                <input
                  type="time"
                  value={localSchedule[index]?.openTime}
                  onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)}
                  disabled={disabled}
                  className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-w-[70px] sm:min-w-[80px]"
                />
              </div>
              <span className="text-slate-500 text-sm">-</span>
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-slate-500 hidden sm:inline">À</span>
                <input
                  type="time"
                  value={localSchedule[index]?.closeTime}
                  onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)}
                  disabled={disabled}
                  className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-w-[70px] sm:min-w-[80px]"
                />
              </div>
            </div>
          ) : (
            <span className="text-sm text-slate-500 dark:text-slate-400 flex-1 ml-6 sm:ml-0">Fermé</span>
          )}
        </div>
      ))}
    </div>
  );
}

export type { DaySchedule };
