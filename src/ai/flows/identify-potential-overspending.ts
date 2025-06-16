// src/ai/flows/identify-potential-overspending.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for identifying potential overspending based on user's budgeting data.
 *
 * - identifyPotentialOverspending - A function that identifies potential overspending categories.
 * - IdentifyPotentialOverspendingInput - The input type for the identifyPotentialOverspending function.
 * - IdentifyPotentialOverspendingOutput - The output type for the identifyPotentialOverspending function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


const IdentifyPotentialOverspendingInputSchema = z.object({
  income: z.number().describe('The total income.'),
  budget: z.record(z.number()).describe('A map of budget categories to allocated amounts.'),
  spending: z.record(z.number()).describe('A map of spending categories to actual amounts spent.'),
  paymentHighlighting: z.record(z.boolean()).optional().describe('A map of payment categories to a boolean indicating if the payment has been transferred.'),
});
export type IdentifyPotentialOverspendingInput = z.infer<typeof IdentifyPotentialOverspendingInputSchema>;

const IdentifyPotentialOverspendingOutputSchema = z.object({
  overspendingCategories: z.array(z.string()).describe('An array of categories where overspending is likely to occur.'),
  suggestions: z.string().describe('Suggestions for optimizing budget allocations and reducing potential overspending.'),
});
export type IdentifyPotentialOverspendingOutput = z.infer<typeof IdentifyPotentialOverspendingOutputSchema>;

export async function identifyPotentialOverspending(input: IdentifyPotentialOverspendingInput): Promise<IdentifyPotentialOverspendingOutput> {
  return identifyPotentialOverspendingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPotentialOverspendingPrompt',
  input: {schema: IdentifyPotentialOverspendingInputSchema},
  output: {schema: IdentifyPotentialOverspendingOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's budget and spending habits to identify potential overspending.

Income: {{{income}}}
Budget: {{JSON.stringify budget}}
Spending: {{JSON.stringify spending}}

Identify categories where spending is close to or exceeds the budget. Provide specific suggestions for how the user can adjust their budget or spending habits to avoid overspending.

Payment Highlighting: {{JSON.stringify paymentHighlighting}}

Output the categories where overspending is likely to occur, and suggestions to avoid overspending.
`, 
});

const identifyPotentialOverspendingFlow = ai.defineFlow(
  {
    name: 'identifyPotentialOverspendingFlow',
    inputSchema: IdentifyPotentialOverspendingInputSchema,
    outputSchema: IdentifyPotentialOverspendingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
