"use client"
import React from 'react';
import { CardDescription } from '@/components/ui/card';

interface TimerDisplayProps {
  timeLeft: number;
  totalDuration: number;
  mode: 'work' | 'break';
  activeTaskName: string;
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft, totalDuration, mode, activeTaskName }) => {
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center w-64 h-64">
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="7"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          className={mode === 'work' ? 'text-primary' : 'text-accent'}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s linear' }}
        />
      </svg>
      <div className="relative flex flex-col items-center">
        <div className="text-6xl font-bold tracking-tighter text-foreground">
          {formatTime(timeLeft)}
        </div>
        <CardDescription className="mt-2 text-sm uppercase tracking-widest">
            {mode}
        </CardDescription>
        {mode === 'work' && (
            <p className="mt-2 text-center text-sm text-muted-foreground truncate w-48">{activeTaskName}</p>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay;
