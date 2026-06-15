-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "frequencyDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reminderTime" TEXT;
