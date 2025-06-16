'use server';

/**
 * @fileOverview Generates an initial budget allocation based on user income and family size.
 *
 * - generateInitialBudget - A function that generates the initial budget.
 * - GenerateInitialBudgetInput - The input type for the generateInitialBudget function.
 * - GenerateInitialBudgetOutput - The return type for the generateInitialBudget function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialBudgetInputSchema = z.object({
  income: z.number().describe('The user\'s monthly income.'),
  familySize: z.number().describe('The number of people in the user\'s family.'),
});
export type GenerateInitialBudgetInput = z.infer<
  typeof GenerateInitialBudgetInputSchema
>;

const GenerateInitialBudgetOutputSchema = z.object({
  housing: z.number().describe('Recommended monthly budget for housing.'),
  food: z.number().describe('Recommended monthly budget for food.'),
  transportation: z.number().describe('Recommended monthly budget for transportation.'),
  utilities: z.number().describe('Recommended monthly budget for utilities.'),
  healthcare: z.number().describe('Recommended monthly budget for healthcare.'),
  insurance: z.number().describe('Recommended monthly budget for insurance.'),
  entertainment: z.number().describe('Recommended monthly budget for entertainment.'),
  savings: z.number().describe('Recommended monthly budget for savings.'),
  other: z.number().describe('Recommended monthly budget for other expenses.'),
});
export type GenerateInitialBudgetOutput = z.infer<
  typeof GenerateInitialBudgetOutputSchema
>;

export async function generateInitialBudget(
  input: GenerateInitialBudgetInput
): Promise<GenerateInitialBudgetOutput> {
  return generateInitialBudgetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialBudgetPrompt',
  input: {schema: GenerateInitialBudgetInputSchema},
  output: {schema: GenerateInitialBudgetOutputSchema},
  prompt: `You are a personal finance advisor. A new user has provided their monthly income and family size.
  Suggest an initial budget allocation across the following categories, based on typical spending patterns for someone with their income and family size. Provide only the number for each category.

Income: {{income}}
Family Size: {{familySize}}

Categories:
- Housing
- Food
- Transportation
- Utilities
- Healthcare
- Insurance
- Entertainment
- Savings
- Other`,
});

const generateInitialBudgetFlow = ai.defineFlow(
  {
    name: 'generateInitialBudgetFlow',
    inputSchema: GenerateInitialBudgetInputSchema,
    outputSchema: GenerateInitialBudgetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
