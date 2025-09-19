'use server';

/**
 * @fileOverview This file defines a Genkit flow for adaptively dividing tasks into smaller pomodoro sessions.
 *
 * - `divideTaskFlow` - A function that suggests dividing a large task into smaller sessions.
 * - `DivideTaskInput` - The input type for the `divideTaskFlow` function, including task name and duration.
 * - `DivideTaskOutput` - The output type for the `divideTaskFlow` function, indicating whether to divide the task.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DivideTaskInputSchema = z.object({
  taskName: z.string().describe('The name of the task.'),
  taskDurationMinutes: z.number().describe('The duration of the task in minutes.'),
});
export type DivideTaskInput = z.infer<typeof DivideTaskInputSchema>;

const DivideTaskOutputSchema = z.object({
  shouldDivide: z.boolean().describe('Whether the task should be divided into smaller sessions.'),
  reasoning: z.string().optional().describe('Reasoning behind whether the task should be divided.')
});
export type DivideTaskOutput = z.infer<typeof DivideTaskOutputSchema>;

export async function divideTask(input: DivideTaskInput): Promise<DivideTaskOutput> {
  return divideTaskFlow(input);
}

const divideTaskPrompt = ai.definePrompt({
  name: 'divideTaskPrompt',
  input: {schema: DivideTaskInputSchema},
  output: {schema: DivideTaskOutputSchema},
  prompt: `You are a helpful assistant that advises users on whether to divide a task into smaller sessions.

Given a task named "{{taskName}}" that will take {{taskDurationMinutes}} minutes, should the task be divided into smaller sessions?

Respond with JSON that contains a single field \"shouldDivide\" with a boolean value. If the task is longer than 60 minutes, you should respond \"true\". Otherwise, respond \"false\". Additionally include a field called \"reasoning\" that justifies your decision.`,
});

const divideTaskFlow = ai.defineFlow(
  {
    name: 'divideTaskFlow',
    inputSchema: DivideTaskInputSchema,
    outputSchema: DivideTaskOutputSchema,
  },
  async input => {
    const {output} = await divideTaskPrompt(input);
    return output!;
  }
);
