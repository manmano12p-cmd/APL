'use server';

/**
 * @fileOverview This file defines a Genkit flow for evaluating task completion.
 *
 * - evaluateTaskCompletion - A function that uses GenAI to ask the user if a task is complete.
 * - EvaluateTaskCompletionInput - The input type for the evaluateTaskCompletion function.
 * - EvaluateTaskCompletionOutput - The return type for the evaluateTaskCompletion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateTaskCompletionInputSchema = z.object({
  taskName: z.string().describe('The name of the task that has reached its time limit.'),
});

export type EvaluateTaskCompletionInput = z.infer<typeof EvaluateTaskCompletionInputSchema>;

const EvaluateTaskCompletionOutputSchema = z.object({
  completionStatus: z
    .enum(['complete', 'incomplete', 'add_time'])
    .describe("The user's assessment of the task's completion status."),
  additionalTime: z
    .number()
    .optional()
    .describe('If completionStatus is "add_time", the additional time requested in minutes.'),
});

export type EvaluateTaskCompletionOutput = z.infer<typeof EvaluateTaskCompletionOutputSchema>;

export async function evaluateTaskCompletion(
  input: EvaluateTaskCompletionInput
): Promise<EvaluateTaskCompletionOutput> {
  return evaluateTaskCompletionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateTaskCompletionPrompt',
  input: {schema: EvaluateTaskCompletionInputSchema},
  output: {schema: EvaluateTaskCompletionOutputSchema},
  prompt: `The timer has expired for the task "{{taskName}}".
Based on the task name, assess if it seems like a task that is now complete, or one that might need more time.
Provide a recommendation.

Respond with a JSON object that contains a "completionStatus" field.
The "completionStatus" field should be one of the following values:
- "complete": If you think the task is probably finished.
- "incomplete": If the task is probably not finished, but it's a good time for a break.
- "add_time": If you think the user should spend a little more time to finish it up.

If you suggest "add_time", also include an "additionalTime" field with a suggested number of extra minutes (e.g., 5 or 10).

Example 1: Task "Write report introduction"
{
  "completionStatus": "add_time",
  "additionalTime": 5
}

Example 2: Task "Quick email to John"
{
  "completionStatus": "complete"
}

Example 3: Task "Brainstorm project ideas"
{
  "completionStatus": "incomplete"
}

Your response:`,
});

const evaluateTaskCompletionFlow = ai.defineFlow(
  {
    name: 'evaluateTaskCompletionFlow',
    inputSchema: EvaluateTaskCompletionInputSchema,
    outputSchema: EvaluateTaskCompletionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
