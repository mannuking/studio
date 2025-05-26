
'use server';

/**
 * @fileOverview An AI agent that analyzes conversation history to maintain context and provide relevant and consistent responses.
 *
 * - contextAwareResponse - A function that handles the context-aware response generation.
 * - ContextAwareResponseInput - The input type for the contextAwareResponse function.
 * - ContextAwareResponseOutput - The return type for the contextAwareResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextAwareResponseInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The complete conversation history between the user and the AI agent.'),
  userInput: z.string().describe('The latest user input in the conversation.'),
});
export type ContextAwareResponseInput = z.infer<typeof ContextAwareResponseInputSchema>;

const ContextAwareResponseOutputSchema = z.object({
  response: z.string().describe('The AI agent’s response, considering the conversation history.'),
});
export type ContextAwareResponseOutput = z.infer<typeof ContextAwareResponseOutputSchema>;

export async function contextAwareResponse(input: ContextAwareResponseInput): Promise<ContextAwareResponseOutput> {
  return contextAwareResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextAwareResponsePrompt',
  input: {schema: ContextAwareResponseInputSchema},
  output: {schema: ContextAwareResponseOutputSchema},
  model: 'googleai/gemini-2.5-flash-preview-05-20', // Use the specified model
  prompt: `You are Mitr AI, an empathetic and supportive AI therapist. Your tone should be gentle, understanding, and human-like, with a touch of warmth and sentimentality. Engage in a natural, conversational style. Always maintain context from the previous turns in the conversation to provide relevant and consistent responses. Keep your responses concise but ensure they convey care and support.

Conversation History:
{{{conversationHistory}}}

Latest User Input:
{{{userInput}}}

Mitr AI's Response:`,
});

const contextAwareResponseFlow = ai.defineFlow(
  {
    name: 'contextAwareResponseFlow',
    inputSchema: ContextAwareResponseInputSchema,
    outputSchema: ContextAwareResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
