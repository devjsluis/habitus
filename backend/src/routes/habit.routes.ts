import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const { name, icon, color, frequencyDays, reminderTime } = req.body;

  const habit = await prisma.habit.create({
    data: {
      name,
      icon,
      color,
      frequencyDays: frequencyDays ?? [],
      reminderTime: reminderTime || null,
      userId: req.userId!,
    },
  });

  res.status(201).json(habit);
});

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const habits = await prisma.habit.findMany({
    where: {
      userId: req.userId,
      archived: false,
    },
    include: {
      logs: {
        orderBy: {
          date: "desc",
        },
      },
    },
    orderBy: {
      position: "asc",
    },
  });

  res.json(habits);
});

router.post(
  "/:habitId/toggle",
  authMiddleware,
  async (req: AuthRequest, res) => {
    const habitId = req.params.habitId as string;
    const { date } = req.body;

    const targetDate = new Date(`${date}T12:00:00.000Z`);

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: req.userId,
      },
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: targetDate,
        },
      },
    });

    if (existingLog) {
      await prisma.habitLog.delete({
        where: {
          id: existingLog.id,
        },
      });

      return res.json({ completed: false });
    }

    const log = await prisma.habitLog.create({
      data: {
        habitId,
        userId: req.userId!,
        date: targetDate,
        completed: true,
      },
    });

    res.json({ completed: true, log });
  },
);

router.patch("/reorder", authMiddleware, async (req: AuthRequest, res) => {
  const { habitIds } = req.body as {
    habitIds: string[];
  };

  await prisma.$transaction(
    habitIds.map((habitId, index) =>
      prisma.habit.updateMany({
        where: {
          id: habitId,
          userId: req.userId,
        },
        data: {
          position: index,
        },
      }),
    ),
  );

  res.json({
    message: "Habits reordered",
  });
});

router.patch("/:habitId", authMiddleware, async (req: AuthRequest, res) => {
  const habitId = req.params.habitId as string;
  const { name, icon, color, frequencyDays, reminderTime } = req.body;

  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId: req.userId,
    },
  });

  if (!habit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  const updatedHabit = await prisma.habit.update({
    where: {
      id: habitId,
    },
    data: {
      name,
      icon,
      color,
      frequencyDays: frequencyDays ?? [],
      reminderTime: reminderTime || null,
    },
  });

  res.json(updatedHabit);
});

router.patch(
  "/:habitId/archive",
  authMiddleware,
  async (req: AuthRequest, res) => {
    const habitId = req.params.habitId as string;

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: req.userId,
      },
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const updatedHabit = await prisma.habit.update({
      where: {
        id: habitId,
      },
      data: {
        archived: !habit.archived,
      },
    });

    res.json({
      message: updatedHabit.archived ? "Habit archived" : "Habit unarchived",
      habit: updatedHabit,
    });
  },
);

router.delete("/:habitId", authMiddleware, async (req: AuthRequest, res) => {
  const habitId = req.params.habitId as string;

  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId: req.userId,
    },
  });

  if (!habit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  await prisma.habit.delete({
    where: {
      id: habitId,
    },
  });

  res.json({ message: "Habit deleted", habit });
});

export default router;
