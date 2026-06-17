import { Fragment, useEffect, useState } from "react";
import { Plus, LogOut } from "lucide-react";
import {
  createHabit,
  deleteHabit,
  getHabits,
  reorderHabits,
  toggleHabit,
  updateHabit,
} from "../api/habits";
import type { Habit } from "../types/habit";
import dayjs from "dayjs";
import "dayjs/locale/es-mx";
import { HabitIcon } from "../components/HabitIcon";
import * as Icons from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableHabitCard } from "../components/SortableHabitCard";
import EmptyHabits from "../components/EmptyHabits";

dayjs.locale("es-mx");

const icons = Object.keys(Icons)
  .filter((key) => {
    return (
      /^[A-Z]/.test(key) &&
      key !== "Icon" &&
      key !== "LucideIcon" &&
      key !== "createLucideIcon" &&
      !key.endsWith("Icon")
    );
  })
  .sort();

const habitColors = [
  "#f87171", // rojo
  "#fb923c", // naranja
  "#facc15", // amarillo
  "#a3e635", // lima
  "#4ade80", // verde
  "#34d399", // esmeralda
  "#2dd4bf", // teal
  "#22d3ee", // cyan
  "#38bdf8", // sky
  "#60a5fa", // azul
  "#818cf8", // índigo
  "#a78bfa", // violeta
  "#c084fc", // morado
  "#e879f9", // fucsia
  "#f472b6", // rosa
  "#94a3b8", // gris azulado

  // Nuevos
  "#ef4444", // rojo intenso
  "#f59e0b", // ámbar
  "#84cc16", // verde oliva
  "#10b981", // emerald fuerte
  "#06b6d4", // turquesa
  "#3b82f6", // azul brillante
  "#8b5cf6", // púrpura profundo
  "#ec4899", // pink fuerte
];

const weekDays = [
  { key: "mon", label: "L" },
  { key: "tue", label: "M" },
  { key: "wed", label: "X" },
  { key: "thu", label: "J" },
  { key: "fri", label: "V" },
  { key: "sat", label: "S" },
  { key: "sun", label: "D" },
];

function getLastDays(days: number) {
  return Array.from({ length: days }).map((_, index) => {
    return dayjs()
      .subtract(days - 1 - index, "day")
      .format("YYYY-MM-DD");
  });
}

function isCompleted(habit: Habit, date: string) {
  return habit.logs.some(
    (log) => dayjs(log.date).format("YYYY-MM-DD") === date,
  );
}

function getHabitScheduleText(habit: Habit) {
  const days =
    habit.frequencyDays.length === 0
      ? "Todos los días"
      : weekDays
          .filter((day) => habit.frequencyDays.includes(day.key))
          .map((day) => day.label)
          .join(" ");

  return habit.reminderTime ? `${days} · ${habit.reminderTime}` : days;
}

function getDayKey(date: string) {
  const index = dayjs(date).day();

  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][index];
}

function doesHabitApplyOnDate(habit: Habit, date: string) {
  if (habit.frequencyDays.length === 0) return true;

  return habit.frequencyDays.includes(getDayKey(date));
}

function formatHabitTime(time: string | null) {
  if (!time) return "Sin horario";

  return dayjs(`2026-01-01T${time}`).format("h:mm A");
}

function getTimePeriod(time: string | null) {
  if (!time) return "Sin horario";

  const hour = Number(time.split(":")[0]);

  if (hour < 12) return "Mañana";
  if (hour < 19) return "Tarde";
  return "Noche";
}

type Props = {
  onLogout: () => void;
};

export default function DashboardPage({ onLogout }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Dumbbell");
  const [color, setColor] = useState("#a855f7");
  const [frequencyDays, setFrequencyDays] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState("");
  const [iconSearch, setIconSearch] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const lastDays = getLastDays(5);
  const today = dayjs().format("YYYY-MM-DD");

  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const isEditing = editingHabitId !== null;
  const [viewMode, setViewMode] = useState<"week" | "today">("week");
  const [weekSortMode, setWeekSortMode] = useState<"manual" | "time">("time");

  const todayHabits = habits
    .filter((habit) => doesHabitApplyOnDate(habit, today))
    .sort((a, b) => {
      if (!a.reminderTime && !b.reminderTime) return 0;
      if (!a.reminderTime) return 1;
      if (!b.reminderTime) return -1;

      return a.reminderTime.localeCompare(b.reminderTime);
    });

  const weekHabits =
    weekSortMode === "time"
      ? [...habits].sort((a, b) => {
          if (!a.reminderTime && !b.reminderTime) return 0;
          if (!a.reminderTime) return 1;
          if (!b.reminderTime) return -1;

          return a.reminderTime.localeCompare(b.reminderTime);
        })
      : habits;

  function resetForm() {
    setName("");
    setIcon("Dumbbell");
    setColor("#a855f7");
    setIconSearch("");
    setEditingHabitId(null);
    setFrequencyDays([]);
    setReminderTime("");
  }

  function closeModal() {
    setIsCreating(false);
    resetForm();
  }

  function openCreateModal() {
    resetForm();
    setIsCreating(true);
  }

  function openEditModal(habit: Habit) {
    setEditingHabitId(habit.id);
    setName(habit.name);
    setIcon(habit.icon);
    setColor(habit.color);
    setIconSearch("");
    setIsCreating(true);
    setFrequencyDays(habit.frequencyDays ?? []);
    setReminderTime(habit.reminderTime ?? "");
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = habits.findIndex((habit) => habit.id === active.id);
    const newIndex = habits.findIndex((habit) => habit.id === over.id);

    const newHabits = arrayMove(habits, oldIndex, newIndex);

    setHabits(newHabits);
    await reorderHabits(newHabits.map((habit) => habit.id));
  }

  async function loadHabits() {
    const data = await getHabits();
    setHabits(data);
  }

  useEffect(() => {
    void getHabits().then(setHabits);
  }, []);

  // async function handleToggle(habitId: string) {
  //   const today = new Date().toISOString().slice(0, 10);
  //   await toggleHabit(habitId, today);
  //   await loadHabits();
  // }

  const filteredIcons = icons
    .filter((iconName) =>
      iconName.toLowerCase().includes(iconSearch.toLowerCase()),
    )
    .slice(0, iconSearch ? 1200 : 1200);

  return (
    <main className="min-h-screen bg-[#111113] text-white px-5 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <button onClick={openCreateModal}>
            <Plus size={34} />
          </button>

          <h1 className="text-4xl font-bold">
            Habi<span className="text-purple-500">tus</span>
          </h1>

          <button onClick={onLogout}>
            <LogOut size={34} />
          </button>
        </header>

        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={`rounded-xl py-2 font-semibold ${
              viewMode === "week" ? "bg-purple-600 text-white" : "text-white/50"
            }`}
          >
            Semana
          </button>

          <button
            type="button"
            onClick={() => setViewMode("today")}
            className={`rounded-xl py-2 font-semibold ${
              viewMode === "today"
                ? "bg-purple-600 text-white"
                : "text-white/50"
            }`}
          >
            Hoy
          </button>
        </div>

        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <form
              onSubmit={async (event) => {
                event.preventDefault();

                if (isEditing) {
                  await updateHabit(editingHabitId, {
                    name,
                    icon,
                    color,
                    frequencyDays,
                    reminderTime: reminderTime || null,
                  });
                } else {
                  await createHabit({
                    name,
                    icon,
                    color,
                    frequencyDays,
                    reminderTime: reminderTime || null,
                  });
                }

                closeModal();
                await loadHabits();
              }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#151518] p-5 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {isEditing ? "Editar hábito" : "Crear hábito"}
                </h2>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-white/10 px-3 py-2 text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nombre del hábito"
                  className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none"
                />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsIconPickerOpen(true)}
                    className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3"
                  >
                    <span className="text-white/60">Icono</span>
                    <HabitIcon name={icon} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsColorPickerOpen(true)}
                    className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3"
                  >
                    <span className="text-white/60">Color</span>
                    <span
                      className="h-6 w-6 rounded-lg border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-white/60">Días que aplica</p>

                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                      const active = frequencyDays.includes(day.key);

                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            setFrequencyDays((current) =>
                              active
                                ? current.filter((d) => d !== day.key)
                                : [...current, day.key],
                            );
                          }}
                          className={`rounded-xl border py-3 font-semibold transition ${
                            active
                              ? "border-purple-500 bg-purple-500/20 text-purple-300"
                              : "border-white/10 bg-white/5 text-white/60"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-white/40">
                    Si no eliges días, aplica todos los días.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-white/60">Hora del hábito</p>

                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(event) => setReminderTime(event.target.value)}
                    className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none"
                  />
                </div>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full rounded-xl bg-red-500/20 py-3 font-semibold text-red-300"
                  >
                    Borrar hábito
                  </button>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-xl bg-white/10 py-3"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-purple-600 py-3 font-semibold"
                  >
                    {isEditing ? "Guardar" : "Crear"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {isIconPickerOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[#151518]">
              <div className="sticky top-0 z-10 border-b border-white/10 bg-[#151518] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Elegir icono</h2>

                  <button
                    type="button"
                    onClick={() => setIsIconPickerOpen(false)}
                    className="rounded-xl bg-white/10 px-3 py-2"
                  >
                    ✕
                  </button>
                </div>

                <input
                  value={iconSearch}
                  onChange={(event) => setIconSearch(event.target.value)}
                  placeholder="Buscar icono..."
                  className="w-full rounded-xl bg-white/10 px-4 py-3 outline-none"
                />
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-5">
                <div className="grid grid-cols-6 gap-2">
                  {filteredIcons.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        setIcon(iconName);
                        setIsIconPickerOpen(false);
                      }}
                      title={iconName}
                      className={`flex h-12 items-center justify-center rounded-xl border transition ${
                        icon === iconName
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <HabitIcon name={iconName} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isColorPickerOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#151518] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Elegir color</h2>
                <button
                  type="button"
                  onClick={() => setIsColorPickerOpen(false)}
                  className="rounded-xl bg-white/10 px-3 py-2"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-6 gap-3">
                {habitColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      setIsColorPickerOpen(false);
                    }}
                    className={`h-8 w-8 rounded-xl border transition ${
                      color === c ? "scale-110 border-white" : "border-white/10"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-red-500/20 bg-[#151518] p-5 shadow-2xl">
              <h2 className="text-xl font-bold text-white">Borrar hábito</h2>

              <p className="mt-2 text-sm text-white/60">
                Esta acción eliminará el hábito y todos sus registros. No se
                puede deshacer.
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 rounded-xl bg-white/10 py-3 font-semibold text-white/70"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!editingHabitId) return;

                    await deleteHabit(editingHabitId);
                    setIsDeleteModalOpen(false);
                    closeModal();
                    await loadHabits();
                  }}
                  className="flex-1 rounded-xl bg-red-500 py-3 font-semibold text-white"
                >
                  Sí, borrar
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === "week" && (
          <Fragment>
            {/* <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3 px-4 text-center text-sm text-white/70">
              <div />
            </div> */}

            <div className="mb-3 flex items-center justify-between px-2">
              <div className="ml-1">
                <h2 className="text-2xl font-bold">Últimos 5 días</h2>
                <p className="text-sm text-white/45">Progreso semanal</p>
              </div>
              <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setWeekSortMode("time")}
                  className={`rounded-lg px-3 py-1.5 font-medium ${
                    weekSortMode === "time"
                      ? "bg-white/10 text-white"
                      : "text-white/45"
                  }`}
                >
                  Hora
                </button>
                <button
                  type="button"
                  onClick={() => setWeekSortMode("manual")}
                  className={`rounded-lg px-3 py-1.5 font-medium ${
                    weekSortMode === "manual"
                      ? "bg-white/10 text-white"
                      : "text-white/45"
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>

            <section className="space-y-3 p-2">
              {weekSortMode === "manual" ? (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={weekHabits.map((habit) => habit.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {weekHabits.map((habit) => (
                        <SortableHabitCard key={habit.id} habit={habit}>
                          <div className="rounded-2xl border border-white/10 bg-black/40 py-5 shadow-lg">
                            <div className="space-y-4 px-4">
                              <button
                                type="button"
                                onClick={() => openEditModal(habit)}
                                className="flex w-full items-center gap-3 text-left"
                              >
                                <div
                                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                                  style={{
                                    backgroundColor: `${habit.color}18`,
                                  }}
                                >
                                  <div className="grid h-5 w-5 place-items-center">
                                    <HabitIcon name={habit.icon} />
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="text-md font-medium leading-tight line-clamp-2">
                                    {habit.name}
                                  </div>

                                  <div className="text-xs text-white/45">
                                    {getHabitScheduleText(habit)}
                                  </div>
                                </div>
                              </button>

                              <div className="grid grid-cols-5 gap-5 text-xs text-white/45">
                                {lastDays.map((date) => {
                                  const d = dayjs(date);

                                  return (
                                    <div key={date} className="text-center">
                                      <div>{d.format("dd")}</div>
                                      <div>{d.format("D")}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="grid grid-cols-5 gap-5">
                                {lastDays.map((date) => {
                                  const completed = isCompleted(habit, date);
                                  const applies = doesHabitApplyOnDate(
                                    habit,
                                    date,
                                  );

                                  return (
                                    <button
                                      key={date}
                                      disabled={!applies}
                                      onClick={async (event) => {
                                        event.stopPropagation();

                                        if (!applies) return;

                                        await toggleHabit(habit.id, date);
                                        await loadHabits();
                                      }}
                                      className="h-10 aspect-square w-full rounded-xl border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                                      style={{
                                        backgroundColor: !applies
                                          ? "rgba(255,255,255,0.04)"
                                          : completed
                                            ? `${habit.color}cc`
                                            : `${habit.color}18`,
                                        borderColor: !applies
                                          ? "rgba(255,255,255,0.06)"
                                          : completed
                                            ? `${habit.color}dd`
                                            : `${habit.color}30`,
                                        boxShadow:
                                          completed && applies
                                            ? `0 0 12px ${habit.color}35`
                                            : "none",
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </SortableHabitCard>
                      ))}

                      {weekHabits.length === 0 && (
                        <EmptyHabits message="No hay ningún hábito registrado." />
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-3">
                  {weekHabits.map((habit) => (
                    <SortableHabitCard key={habit.id} habit={habit}>
                      <div className="rounded-2xl border border-white/10 bg-black/40 py-5 shadow-lg">
                        <div className="space-y-4 px-4">
                          <button
                            type="button"
                            onClick={() => openEditModal(habit)}
                            className="flex w-full items-center gap-3 text-left"
                          >
                            <div
                              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                              style={{ backgroundColor: `${habit.color}18` }}
                            >
                              <div className="grid h-5 w-5 place-items-center">
                                <HabitIcon name={habit.icon} />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-md font-medium leading-tight line-clamp-2">
                                {habit.name}
                              </div>

                              <div className="text-xs text-white/45">
                                {getHabitScheduleText(habit)}
                              </div>
                            </div>
                          </button>

                          <div className="grid grid-cols-5 gap-5 text-xs text-white/45">
                            {lastDays.map((date) => {
                              const d = dayjs(date);

                              return (
                                <div key={date} className="text-center">
                                  <div>{d.format("dd")}</div>
                                  <div>{d.format("D")}</div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="grid grid-cols-5 gap-5">
                            {lastDays.map((date) => {
                              const completed = isCompleted(habit, date);
                              const applies = doesHabitApplyOnDate(habit, date);

                              return (
                                <button
                                  key={date}
                                  disabled={!applies}
                                  onClick={async (event) => {
                                    event.stopPropagation();

                                    if (!applies) return;

                                    await toggleHabit(habit.id, date);
                                    await loadHabits();
                                  }}
                                  className="h-10 aspect-square w-full rounded-xl border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                                  style={{
                                    backgroundColor: !applies
                                      ? "rgba(255,255,255,0.04)"
                                      : completed
                                        ? `${habit.color}cc`
                                        : `${habit.color}18`,
                                    borderColor: !applies
                                      ? "rgba(255,255,255,0.06)"
                                      : completed
                                        ? `${habit.color}dd`
                                        : `${habit.color}30`,
                                    boxShadow:
                                      completed && applies
                                        ? `0 0 12px ${habit.color}35`
                                        : "none",
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </SortableHabitCard>
                  ))}
                  {weekHabits.length === 0 && (
                    <EmptyHabits message="No hay ningún hábito registrado." />
                  )}
                </div>
              )}
            </section>
          </Fragment>
        )}

        {viewMode === "today" && (
          <section className="space-y-3 p-2">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Hoy</h2>
              <p className="text-sm text-white/45">
                {dayjs(today).format("dddd D [de] MMMM")}
              </p>
            </div>

            {todayHabits.map((habit) => {
              const completed = isCompleted(habit, today);

              return (
                <div
                  key={habit.id}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(habit)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div
                        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
                        style={{ backgroundColor: `${habit.color}18` }}
                      >
                        <div className="grid h-6 w-6 place-items-center">
                          <HabitIcon name={habit.icon} />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="max-w-42.5 text-base sm:max-w-none line-clamp-5 font-semibold leading-tight">
                          {habit.name}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-white/45">
                          <span>{formatHabitTime(habit.reminderTime)}</span>
                          <span className="rounded-full bg-white/10 px-2 py-0.5">
                            {getTimePeriod(habit.reminderTime)}
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await toggleHabit(habit.id, today);
                        await loadHabits();
                      }}
                      className="h-16 w-16 shrink-0 rounded-2xl border transition active:scale-95"
                      style={{
                        backgroundColor: completed
                          ? `${habit.color}cc`
                          : `${habit.color}18`,
                        borderColor: completed
                          ? `${habit.color}dd`
                          : `${habit.color}30`,
                        boxShadow: completed
                          ? `0 0 12px ${habit.color}35`
                          : "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {todayHabits.length === 0 && (
              <EmptyHabits message="No hay hábitos programados para hoy." />
            )}
          </section>
        )}
      </div>
    </main>
  );
}
