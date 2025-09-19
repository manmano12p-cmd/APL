"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface AddTaskFormProps {
  onAddTask: (text: string, duration: number) => void;
  isSubtask?: boolean;
}

export default function AddTaskForm({ onAddTask, isSubtask = false }: AddTaskFormProps) {
  const [text, setText] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const s = parseInt(seconds, 10) || 0;
    const totalSeconds = h * 3600 + m * 60 + s;
    if (totalSeconds <= 0) return;
    
    onAddTask(text, totalSeconds);
    setText('');
    setHours('');
    setMinutes('');
    setSeconds('');
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-2 ${isSubtask ? 'p-2' : 'mb-6'}`}>
      <Input
        type="text"
        placeholder={isSubtask ? "New subtask..." : "Add a new task..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-grow"
      />
      <div className="flex gap-2 items-center">
        <div className="flex-grow flex gap-2">
            <div className="w-full">
                <Label htmlFor="hours" className="sr-only">Hours</Label>
                <Input id="hours" type="number" placeholder="Hrs" value={hours} onChange={(e) => setHours(e.target.value)} min="0" />
            </div>
            <div className="w-full">
                <Label htmlFor="minutes" className="sr-only">Minutes</Label>
                <Input id="minutes" type="number" placeholder="Mins" value={minutes} onChange={(e) => setMinutes(e.target.value)} min="0" />
            </div>
            <div className="w-full">
                <Label htmlFor="seconds" className="sr-only">Seconds</Label>
                <Input id="seconds" type="number" placeholder="Secs" value={seconds} onChange={(e) => setSeconds(e.target.value)} min="0" />
            </div>
        </div>
        <Button type="submit" size={isSubtask ? 'sm' : 'default'} className="bg-primary text-primary-foreground shrink-0">
          <Plus className="h-4 w-4" />
          {!isSubtask && <span className='ml-2'>Add</span>}
        </Button>
      </div>
    </form>
  );
}
