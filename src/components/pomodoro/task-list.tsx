"use client"

import TaskItem from './task-item';
import type { Task } from '@/types';
import { Accordion } from '@/components/ui/accordion';

interface TaskListProps {
  tasks: Task[];
  onStartTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (parentId: string, text: string, duration: number) => void;
}

export default function TaskList({ tasks, ...props }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg mt-4">
        <p>No tasks yet.</p>
        <p>Add a task to get started!</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
        {tasks.map(task => (
            <TaskItem key={task.id} task={task} {...props} />
        ))}
    </Accordion>
  );
}
