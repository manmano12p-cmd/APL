// @/components/pomodoro/header.tsx
'use client';
import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, LogIn, LogOut } from 'lucide-react';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  totalRemainingTime: number; // in seconds
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Header({ title, totalRemainingTime, user, onLogin, onLogout }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return '...';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getFinishTime = () => {
    if (currentTime === null) return '...';
    const finishDate = new Date(currentTime.getTime() + totalRemainingTime * 1000);
    return formatTime(finishDate);
  };
  
  return (
    <header className="w-full max-w-6xl mx-auto flex justify-between items-center text-foreground">
      <div className="flex items-center gap-2">
        <Clock className="h-6 w-6" />
        <span className="text-xl font-semibold">{formatTime(currentTime)}</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-center text-primary font-headline">
        {title}
      </h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            <span className="text-xl font-semibold">Finish at: {getFinishTime()}</span>
        </div>
         {user ? (
          <Button onClick={onLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        ) : (
          <Button onClick={onLogin}>
            <LogIn className="mr-2 h-4 w-4" /> Login
          </Button>
        )}
      </div>
    </header>
  );
}
