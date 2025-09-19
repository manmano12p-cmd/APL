// @/app/actions.ts
'use server';
import { divideTask, DivideTaskInput } from '@/ai/flows/adaptive-task-division';
import { evaluateTaskCompletion, EvaluateTaskCompletionInput } from '@/ai/flows/task-completion-evaluation';

export async function getTaskDivisionSuggestion(input: DivideTaskInput) {
  try {
    return await divideTask(input);
  } catch (error) {
    console.error("Error in getTaskDivisionSuggestion:", error);
    return { shouldDivide: false, reasoning: "An error occurred while getting suggestion." };
  }
}

export async function getTaskCompletionSuggestion(input: EvaluateTaskCompletionInput) {
  try {
    return await evaluateTaskCompletion(input);
  } catch (error) {
    console.error("Error in getTaskCompletionSuggestion:", error);
    return { completionStatus: "incomplete" };
  }
}
