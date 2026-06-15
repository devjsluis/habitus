import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  name: string;
  size?: number;
};

export function HabitIcon({ name, size = 20 }: Props) {
  const Icon = Icons[name as keyof typeof Icons] as LucideIcon | undefined;

  if (!Icon) return <Icons.Circle size={size} />;

  return <Icon size={size} />;
}
