"use client"

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Task } from '@/types';
import AddTaskForm from './add-task-form';
import { cn } from '@/lib/utils';
import TaskList from './task-list';

interface TaskItemProps {
  task: Task;
  onStartTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (parentId: string, text: string, duration: number) => void;
}

const formatDuration = (durationInSeconds: number) => {
  if (durationInSeconds === 0) return '0 min';
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = durationInSeconds % 60;
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (seconds > 0 && hours === 0 && minutes < 10) result += `${seconds}s`;
  return result.trim() || '0s';
};

export default function TaskItem({ task, onStartTask, onToggleTask, onDeleteTask, onAddSubtask }: TaskItemProps) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  return (
    <AccordionItem value={task.id} className="bg-card border rounded-lg overflow-hidden mb-2">
      <div className="flex items-center p-3">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggleTask(task.id)}
          className="mr-3"
          aria-label={`Mark task ${task.text} as complete`}
        />
        <label
          htmlFor={`task-${task.id}`}
          className={cn("flex-grow text-sm font-medium cursor-pointer", task.completed && "line-through text-muted-foreground")}
        >
          {task.text}
        </label>
        <span className="text-xs text-muted-foreground mr-3">{formatDuration(task.duration)}</span>
        
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onStartTask(task.id)} className="h-8 w-8 text-primary hover:text-primary" aria-label={`Start task ${task.text}`}>
                <Play className="h-4 w-4" />
            </Button>

            <AccordionTrigger className="p-2 h-8 w-8 [&[data-state=open]>svg]:rotate-180" aria-label="Toggle subtasks">
                 <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionTrigger>

            <Button variant="ghost" size="icon" onClick={() => onDeleteTask(task.id)} className="h-8 w-8 text-destructive hover:text-destructive" aria-label={`Delete task ${task.text}`}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </div>
      <AccordionContent>
        <div className="pl-10 pr-4 pb-2">
          {hasSubtasks && (
             <TaskList
                tasks={task.subtasks}
                onStartTask={onStartTask}
                onToggleTask={onToggleTask}
                onDeleteTask={onDeleteTask}
                onAddSubtask={onAddSubtask}
              />
          )}
          <AddTaskForm
            onAddTask={(text, duration) => onAddSubtask(task.id, text, duration)}
            isSubtask={true}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
