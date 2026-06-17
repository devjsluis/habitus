type EmptyHabitsProps = {
  message: string;
};

export default function EmptyHabits({ message }: EmptyHabitsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-white/50">
      {message}
    </div>
  );
}
