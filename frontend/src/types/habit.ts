export interface HabitLog {
  id: string;
  date: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  archived: boolean;
  position: number;
  frequencyDays: string[];
  reminderTime: string | null;
  logs: HabitLog[];
}
