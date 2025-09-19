"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { onAuthStateChanged, User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import AddTaskForm from './add-task-form';
import TaskList from './task-list';
import TimerDisplay from './timer-display';
import TimerControls from './timer-controls';
import SettingsDialog from './settings-dialog';
import Header from '@/components/pomodoro/header';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { getTaskDivisionSuggestion, getTaskCompletionSuggestion } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/types';
import { DEFAULT_WORK_MINS, DEFAULT_BREAK_MINS } from '@/lib/constants';
import { auth, db, signInWithGoogle, signOut } from '@/lib/firebase';


type TimerMode = 'work' | 'break';

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const findTask = (taskId: string, tasks: Task[]): Task | null => {
  for (const task of tasks) {
    if (task.id === taskId) return task;
    if (task.subtasks) {
      const found = findTask(taskId, task.subtasks);
      if (found) return found;
    }
  }
  return null;
};

// These functions now need to operate on the state directly and then call a sync function.
const updateTaskInTree = (tasks: Task[], taskId: string, updates: Partial<Task>): Task[] => {
  return tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, ...updates };
    }
    if (task.subtasks) {
      return { ...task, subtasks: updateTaskInTree(task.subtasks, taskId, updates) };
    }
    return task;
  });
};

const deleteTaskFromTree = (tasks: Task[], taskId: string): Task[] => {
    return tasks
      .filter(task => task.id !== taskId)
      .map(task => ({
        ...task,
        subtasks: task.subtasks ? deleteTaskFromTree(task.subtasks, taskId) : [],
      }));
};

const addSubtaskToTree = (tasks: Task[], parentId: string, subtask: Task): Task[] => {
  return tasks.map(task => {
    if (task.id === parentId) {
      return { ...task, subtasks: [...(task.subtasks || []), subtask] };
    }
    if (task.subtasks) {
      return { ...task, subtasks: addSubtaskToTree(task.subtasks, parentId, subtask) };
    }
    return task;
  });
};

const updateDurations = (tasks: Task[]): Task[] => {
  return tasks.map(task => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task;
    }
    const newSubtasks = updateDurations(task.subtasks);
    const newDuration = newSubtasks.reduce((total, sub) => total + sub.duration, 0);
    return { ...task, subtasks: newSubtasks, duration: newDuration };
  });
};

const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function PomodoroApp() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    workDuration: DEFAULT_WORK_MINS * 60,
    breakDuration: DEFAULT_BREAK_MINS * 60,
  });

  const [timeLeft, setTimeLeft] = useState(settings.workDuration);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [timerKey, setTimerKey] = useState(0);

  const [showSettings, setShowSettings] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ shouldDivide: boolean; reasoning?: string; taskName: string; duration: number } | null>(null);
  const [completionSuggestion, setCompletionSuggestion] = useState<{ status: 'complete' | 'incomplete' | 'add_time'; additionalTime?: number; task: Task } | null>(null);
  const [soundsLoaded, setSoundsLoaded] = useState(false);

  const workEndPlayer = useRef<Tone.Player | null>(null);
  const breakEndPlayer = useRef<Tone.Player | null>(null);

  const { toast } = useToast();
  
  // --- Firebase Auth and DB Sync ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // User is signed in, listen for tasks
        const tasksRef = ref(db, `tasks/${currentUser.uid}`);
        return onValue(tasksRef, (snapshot) => {
          const data = snapshot.val();
          setTasksState(data ? data : []);
        });
      } else {
        // User is signed out
        setTasksState([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const syncTasksWithFirebase = useCallback((newTasks: Task[]) => {
    if (user) {
      set(ref(db, `tasks/${user.uid}`), newTasks);
    }
  }, [user]);

  const setTasks = (updater: React.SetStateAction<Task[]>) => {
    setTasksState(prevTasks => {
      const newRawTasks = typeof updater === 'function' ? updater(prevTasks) : updater;
      const newTasksWithDurations = updateDurations(newRawTasks);
      // We are now calling syncTasksWithFirebase explicitly in functions that modify tasks
      // syncTasksWithFirebase(newTasksWithDurations); 
      return newTasksWithDurations;
    });
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast({ title: 'Successfully logged in!' });
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/popup-closed-by-user') {
        console.info("Login popup closed by user.");
      } else {
        console.error("Login failed:", error);
        toast({ title: 'Login failed', description: 'Could not sign in with Google.', variant: 'destructive' });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: 'Successfully logged out.' });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: 'Logout failed', variant: 'destructive' });
    }
  };
  // --- End Firebase ---


  useEffect(() => {
    const soundUrls = ["/sounds/work-end.mp3", "/sounds/break-end.mp3"];
    
    const loadSounds = async () => {
      try {
        workEndPlayer.current = new Tone.Player(soundUrls[0]).toDestination();
        breakEndPlayer.current = new Tone.Player(soundUrls[1]).toDestination();
        await Tone.loaded();
        setSoundsLoaded(true);
      } catch (error) {
         console.error("Could not load sounds, continuing without them.", error);
         setSoundsLoaded(true); // Still allow app to function
      }
    };
    loadSounds();
  }, []);

  const playWorkEndSound = useCallback(() => {
    if(workEndPlayer.current && workEndPlayer.current.loaded) {
      Tone.start();
      workEndPlayer.current?.start();
    }
  }, []);

  const playBreakEndSound = useCallback(() => {
    if(breakEndPlayer.current && breakEndPlayer.current.loaded) {
      Tone.start();
      breakEndPlayer.current?.start();
    }
  }, []);

  const startBreak = useCallback(() => {
    setTimerMode('break');
    const duration = settings.breakDuration;
    setTimeLeft(duration);
    setTimerActive(true);
    setTimerKey(prev => prev + 1);
    toast({ title: 'Time for a break!', duration: 5000 });
  },[settings.breakDuration, toast]);

  const resetTimer = useCallback((taskId: string | null = activeTaskId) => {
    setTimerActive(false);
    const newTimerMode = timerMode === 'break' ? 'work' : timerMode;
    if (newTimerMode === 'work' && taskId) {
      const task = findTask(taskId, tasks);
      setTimeLeft(task?.duration || settings.workDuration);
    } else if (newTimerMode === 'break') {
      setTimeLeft(settings.breakDuration);
    } else {
       setTimeLeft(settings.workDuration);
    }
    setTimerMode(newTimerMode);
    setTimerKey(prev => prev + 1);
  }, [activeTaskId, settings.breakDuration, settings.workDuration, tasks, timerMode]);

  const handleTimerEnd = useCallback(async () => {
    if (timerMode === 'work') {
      playWorkEndSound();
      const activeTask = activeTaskId ? findTask(activeTaskId, tasks) : null;
      if (activeTask && !activeTask.completed) {
        try {
          const result = await getTaskCompletionSuggestion({ taskName: activeTask.text });
          setCompletionSuggestion({ status: result.completionStatus, additionalTime: result.additionalTime, task: activeTask });
        } catch (error) {
          console.error("Failed to get completion suggestion", error);
          startBreak();
        }
      } else {
        startBreak();
      }
    } else {
      playBreakEndSound();
      toast({ title: "Break's over!", description: "Time to get back to work." });
      setTimerMode('work');
      resetTimer(activeTaskId);
    }
  }, [timerMode, activeTaskId, tasks, toast, playWorkEndSound, playBreakEndSound, startBreak, resetTimer]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      handleTimerEnd();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft, handleTimerEnd]);
  
  const addTask = useCallback(async (text: string, duration: number) => {
    if (!user) {
      toast({ title: 'Please log in', description: 'You must be logged in to add tasks.' });
      return;
    }
    const minutes = duration / 60;
    if (minutes > 60) {
        const suggestion = await getTaskDivisionSuggestion({ taskName: text, taskDurationMinutes: minutes });
        if (suggestion.shouldDivide) {
            setAiSuggestion({ ...suggestion, taskName: text, duration });
            return;
        }
    }
    const newTask: Task = { id: generateUniqueId(), text, duration, completed: false, subtasks: [], parentId: null };
    const newTasks = [...tasks, newTask];
    setTasksState(newTasks);
    syncTasksWithFirebase(newTasks);
  }, [user, toast, tasks, syncTasksWithFirebase]);

  const addSubtask = (parentId: string, text: string, duration: number) => {
    const newSubtask: Task = { id: generateUniqueId(), text, duration, completed: false, subtasks: [], parentId };
    const newTasks = addSubtaskToTree(tasks, parentId, newSubtask);
    const newTasksWithDurations = updateDurations(newTasks);
    setTasksState(newTasksWithDurations);
    syncTasksWithFirebase(newTasksWithDurations);
  };
  
  const handleAiDivideConfirm = () => {
    if (!aiSuggestion) return;
    const { taskName, duration } = aiSuggestion;
    const sessionDuration = 25 * 60;
    const numSessions = Math.ceil(duration / sessionDuration);
    const parentId = generateUniqueId();
    const parentTask: Task = { id: parentId, text: taskName, duration: 0, completed: false, subtasks: [], parentId: null };
    
    let remainingDuration = duration;
    for (let i = 0; i < numSessions; i++) {
        const subtaskDuration = Math.min(sessionDuration, remainingDuration);
        parentTask.subtasks.push({
            id: generateUniqueId(),
            text: `${taskName} (Part ${i + 1})`,
            duration: subtaskDuration,
            completed: false,
            subtasks: [],
            parentId
        });
        remainingDuration -= subtaskDuration;
    }
    const newTasks = [...tasks, parentTask];
    const newTasksWithDurations = updateDurations(newTasks);
    setTasksState(newTasksWithDurations);
    syncTasksWithFirebase(newTasksWithDurations);
    setAiSuggestion(null);
  };

  const handleAiDivideCancel = () => {
    if (!aiSuggestion) return;
    const { taskName, duration } = aiSuggestion;
    const newTask: Task = { id: generateUniqueId(), text: taskName, duration, completed: false, subtasks: [], parentId: null };
    const newTasks = [...tasks, newTask];
    setTasksState(newTasks);
    syncTasksWithFirebase(newTasks);
    setAiSuggestion(null);
  };

  const startTimer = useCallback((taskId: string, customDuration?: number) => {
    const task = findTask(taskId, tasks);
    if (!task) return;
    
    const duration = customDuration ?? task.duration;

    clearInterval(0); 
    setTimerMode('work');
    setTimeLeft(duration);
    setActiveTaskId(taskId);
    setTimerActive(true);
    setTimerKey(prev => prev + 1);
  }, [tasks]);

  const handleCompletionConfirm = () => {
    if (!completionSuggestion) return;
    const { status, additionalTime, task } = completionSuggestion;
    if (status === 'add_time' && additionalTime) {
      startTimer(task.id, additionalTime * 60);
    } else {
      if (status === 'complete') {
        toggleTask(task.id);
      }
      startBreak();
    }
    setCompletionSuggestion(null);
  };
  
  const handleCompletionCancel = () => {
    startBreak();
    setCompletionSuggestion(null);
  };

  
  const pauseTimer = () => setTimerActive(false);
  const resumeTimer = () => setTimerActive(true);
  
  const toggleTask = (taskId: string) => {
    const task = findTask(taskId, tasks);
    if (task) {
      const newTasks = updateTaskInTree(tasks, taskId, { completed: !task.completed });
      setTasksState(newTasks);
      syncTasksWithFirebase(newTasks);
    }
  };
  
  const deleteTask = (taskId: string) => {
    const newTasks = deleteTaskFromTree(tasks, taskId);
    setTasksState(newTasks);
    syncTasksWithFirebase(newTasks);

    if (activeTaskId === taskId) {
      setTimerActive(false);
      setActiveTaskId(null);
      setTimeLeft(settings.workDuration);
    }
  };

  const activeTask = activeTaskId ? findTask(activeTaskId, tasks) : null;
  const activeTaskName = activeTask?.text ?? (user ? "Select a task" : "Login to start");

  const timerTotalDuration = useMemo(() => {
    if (timerMode === 'break') return settings.breakDuration;
    if (activeTask) return activeTask.duration;
    return settings.workDuration;
  }, [timerMode, activeTask, settings]);

  const { activeTasks, completedTasks, totalRemainingTime } = useMemo(() => {
    const active: Task[] = [];
    const completed: Task[] = [];
    tasks.forEach(task => {
        if (task.completed) {
            completed.push(task);
        } else {
            active.push(task);
        }
    });
    
    const remainingTime = active.reduce((acc, task) => acc + (task.duration || 0), 0);
    const totalBreaks = active.length > 1 ? (active.length - 1) * settings.breakDuration : 0;
    
    return { activeTasks: active, completedTasks: completed, totalRemainingTime: remainingTime + totalBreaks };
  }, [tasks, settings.breakDuration]);


  return (
    <>
      <Header
        title="Pomodoro Pro"
        totalRemainingTime={totalRemainingTime}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full mt-8">
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-6">
              <TimerDisplay key={timerKey} totalDuration={timerTotalDuration} timeLeft={timeLeft} mode={timerMode} activeTaskName={activeTaskName} />
              <TimerControls
                timerActive={timerActive}
                onStart={resumeTimer}
                onPause={pauseTimer}
                onReset={() => resetTimer()}
                disabled={!activeTaskId || !soundsLoaded}
              />
            </CardContent>
          </Card>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="lg" onClick={() => setShowSettings(true)} className="gap-2 shadow-md w-48 h-12 text-lg">
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </Button>
          </div>
        </div>
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddTaskForm onAddTask={addTask} />
              <TaskList key="active-tasks" tasks={activeTasks} onStartTask={startTimer} onToggleTask={toggleTask} onDeleteTask={deleteTask} onAddSubtask={addSubtask} />
            </CardContent>
          </Card>
           {completedTasks.length > 0 && (
            <Collapsible className="mt-6">
                <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        Completed Tasks ({completedTasks.length})
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <Card className="shadow-lg mt-2">
                        <CardContent className="p-4">
                           <TaskList key="completed-tasks" tasks={completedTasks} onStartTask={startTimer} onToggleTask={toggleTask} onDeleteTask={deleteTask} onAddSubtask={addSubtask} />
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>
          )}
        </div>
        <SettingsDialog open={showSettings} onOpenChange={setShowSettings} settings={settings} onSave={setSettings} />
        
        {aiSuggestion && (
          <AlertDialog open={!!aiSuggestion} onOpenChange={() => setAiSuggestion(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>AI Suggestion: Large Task</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="block mb-2">Your task "{aiSuggestion.taskName}" is estimated to take {formatTime(aiSuggestion.duration)}. That's longer than a typical Pomodoro session.</span>
                  <span className="block"><strong>AI says:</strong> {aiSuggestion.reasoning}</span>
                  <span className="block mt-2">Would you like to split it into multiple 25-minute Pomodoro sessions?</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="outline" onClick={handleAiDivideCancel}>Add as-is</Button>
                <Button onClick={handleAiDivideConfirm} className="bg-accent hover:bg-accent/90 text-accent-foreground">Split Task</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {completionSuggestion && (
          <AlertDialog open={!!completionSuggestion} onOpenChange={() => setCompletionSuggestion(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Session Complete!</AlertDialogTitle>
                <AlertDialogDescription>
                   <span>Time's up for "{completionSuggestion.task.text}".</span>
                   {completionSuggestion.status === 'add_time' && completionSuggestion.additionalTime && 
                     <span className="block mt-2">The AI suggests this task might need more time. Would you like to add an extra <strong>{completionSuggestion.additionalTime} minutes</strong>?</span>
                   }
                   {completionSuggestion.status === 'complete' &&
                      <span className="block mt-2">The AI suggests this task is complete. Let's take a break.</span>
                   }
                   {completionSuggestion.status === 'incomplete' &&
                      <span className="block mt-2">The AI suggests this task may not be complete, but let's take a break for now.</span>
                   }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <Button variant="outline" onClick={handleCompletionCancel}>Dismiss</Button>
                 <Button onClick={handleCompletionConfirm} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  {completionSuggestion.status === 'add_time' ? "Add Time" : "Mark as Complete & Break"}
                 </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </>
  );
}
