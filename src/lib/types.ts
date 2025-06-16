
import type { LucideIcon } from 'lucide-react';

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  dateAdded: string; // ISO string date
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  iconName: string; // Lucide icon name string
}

export interface Payment {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string; // ISO string date
  isTransferred: boolean;
}

export type BudgetData = {
  income: IncomeSource[];
  budgetCategories: BudgetCategory[];
  payments: Payment[];
};

export type AiSuggestion = {
  category: string;
  suggestion: string;
  impact: string;
};

export type AiOverspendingResult = {
  overspendingCategories: string[];
  suggestions: string;
};
