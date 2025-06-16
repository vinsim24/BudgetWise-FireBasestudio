"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Banknote, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { IncomeSource, BudgetCategory, Payment } from '@/lib/types';

interface DashboardSummaryProps {
  incomes: IncomeSource[];
  budgetCategories: BudgetCategory[];
  payments: Payment[];
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ incomes, budgetCategories, payments }) => {
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
  const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalIncome - totalSpent;
  const budgetUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const overBudget = totalSpent > totalBudgeted;

  const summaryItems = [
    { title: "Total Income", value: formatCurrency(totalIncome), Icon: DollarSign, color: "text-green-500" },
    { title: "Total Budgeted", value: formatCurrency(totalBudgeted), Icon: Banknote, color: "text-blue-500" },
    { title: "Total Spent", value: formatCurrency(totalSpent), Icon: TrendingDown, color: overBudget ? "text-red-500" : "text-yellow-500" },
    { title: "Remaining Balance", value: formatCurrency(remainingBalance), Icon: TrendingUp, color: remainingBalance >=0 ? "text-green-500" : "text-red-500" },
  ];

  return (
    <section aria-labelledby="summary-title">
      <h2 id="summary-title" className="sr-only">Financial Summary</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryItems.map((item, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">{item.title}</CardTitle>
              <item.Icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-headline ${item.color}`}>{item.value}</div>
              {item.title === "Total Spent" && (
                <p className="text-xs text-muted-foreground pt-1">
                  {budgetUtilization.toFixed(1)}% of budget utilized
                  {overBudget && <AlertTriangle className="inline h-4 w-4 ml-1 text-red-500" />}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default DashboardSummary;
