import { api } from "./client";

export type HabitPayload = {
  name: string;
  icon: string;
  color: string;
  frequencyDays: string[];
  reminderTime: string | null;
};

export async function getHabits() {
  const response = await api.get("/habits");
  return response.data;
}

export async function createHabit(data: HabitPayload) {
  const response = await api.post("/habits", data);
  return response.data;
}

export async function toggleHabit(habitId: string, date: string) {
  const response = await api.post(`/habits/${habitId}/toggle`, {
    date,
  });

  return response.data;
}

export async function updateHabit(habitId: string, data: HabitPayload) {
  const response = await api.patch(`/habits/${habitId}`, data);
  return response.data;
}

export async function reorderHabits(habitIds: string[]) {
  const response = await api.patch("/habits/reorder", {
    habitIds,
  });

  return response.data;
}

export async function deleteHabit(habitId: string) {
  const response = await api.delete(`/habits/${habitId}`);
  return response.data;
}
