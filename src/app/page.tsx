import PomodoroApp from '@/components/pomodoro/pomodoro-app';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto">
        <PomodoroApp />
      </div>
    </main>
  );
}
