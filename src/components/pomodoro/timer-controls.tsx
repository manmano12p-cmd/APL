"use client"

import { Button } from '@/components/ui/button';
import { Pause, Play, RotateCcw } from 'lucide-react';

interface TimerControlsProps {
  timerActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export default function TimerControls({ timerActive, onStart, onPause, onReset, disabled = false }: TimerControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {timerActive ? (
        <Button onClick={onPause} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground w-32 shadow-md" disabled={disabled}>
          <Pause className="mr-2 h-5 w-5" />
          Pause
        </Button>
      ) : (
        <Button onClick={onStart} size="lg" className="w-32 shadow-md" disabled={disabled}>
          <Play className="mr-2 h-5 w-5" />
          Start
        </Button>
      )}
      <Button onClick={onReset} variant="outline" size="icon" className="shadow-md" disabled={disabled}>
        <RotateCcw className="h-5 w-5" />
      </Button>
    </div>
  );
}
