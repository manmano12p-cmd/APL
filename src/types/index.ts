export interface Task {
  id: string;
  text: string;
  duration: number; // in seconds
  completed: boolean;
  subtasks: Task[];
  parentId?: string | null;
}
