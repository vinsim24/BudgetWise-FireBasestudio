// use server'

/**
 * @fileOverview Provides AI-driven suggestions for optimizing budget allocations and identifying potential overspending.
 *
 * - suggestBudgetOptimizations - A function that suggests budget optimizations based on user's financial data.
 * - SuggestBudgetOptimizationsInput - The input type for the suggestBudgetOptimizations function.
 * - SuggestBudgetOptimizationsOutput - The return type for the suggestBudgetOptimizations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBudgetOptimizationsInputSchema = z.object({
  income: z.number().describe('Total monthly income.'),
  budgetAllocations: z.record(z.string(), z.number()).describe('A map of budget categories to allocated amounts.'),
  actualSpending: z.record(z.string(), z.number()).describe('A map of spending categories to actual spending amounts.'),
});

export type SuggestBudgetOptimizationsInput = z.infer<typeof SuggestBudgetOptimizationsInputSchema>;

const SuggestBudgetOptimizationsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      category: z.string().describe('The budget category for the suggestion.'),
      suggestion: z.string().describe('The optimization suggestion for the category.'),
      impact: z.string().describe('The potential impact of the suggestion on the overall budget.'),
    })
  ).describe('A list of budget optimization suggestions.'),
});

export type SuggestBudgetOptimizationsOutput = z.infer<typeof SuggestBudgetOptimizationsOutputSchema>;

export async function suggestBudgetOptimizations(input: SuggestBudgetOptimizationsInput): Promise<SuggestBudgetOptimizationsOutput> {
  return suggestBudgetOptimizationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBudgetOptimizationsPrompt',
  input: {schema: SuggestBudgetOptimizationsInputSchema},
  output: {schema: SuggestBudgetOptimizationsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's income, budget allocations, and actual spending to provide personalized budget optimization suggestions.

  Income: ${'{{income}}'}
  Budget Allocations: ${'{{budgetAllocations}}'}
  Actual Spending: ${'{{actualSpending}}'}

  Provide specific, actionable suggestions for reallocating funds from overspent categories to underspent ones. Explain the potential impact of each suggestion.

  Format your response as a JSON array of suggestions, including the category, suggestion, and impact of the suggestion.
  `,
});

const suggestBudgetOptimizationsFlow = ai.defineFlow(
  {
    name: 'suggestBudgetOptimizationsFlow',
    inputSchema: SuggestBudgetOptimizationsInputSchema,
    outputSchema: SuggestBudgetOptimizationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
