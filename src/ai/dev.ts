import { config } from 'dotenv';
config();

import '@/ai/flows/generate-initial-budget.ts';
import '@/ai/flows/suggest-budget-optimizations.ts';
import '@/ai/flows/identify-potential-overspending.ts';