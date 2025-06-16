
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

export type BudgetDataForMonth = {
  incomes: IncomeSource[];
  budgetCategories: BudgetCategory[];
  payments: Payment[];
};


// Types for the Reports Page
export interface MonthlyDataForReport extends BudgetDataForMonth {
  year: number;
  month: number; // 0-indexed (0 for January, 11 for December)
}

export interface ReportCategorySummary {
  categoryName: string;
  iconName: string;
  totalAllocated: number;
  totalSpentInPeriod: number;
  remainingInCategory: number;
}

export interface ReportPeriodSummary {
  periodLabel: string;
  totalIncome: number;
  totalBudgeted: number;
  totalSpent: number;
  remainingBalance: number;
  categorySummaries: ReportCategorySummary[];
}
