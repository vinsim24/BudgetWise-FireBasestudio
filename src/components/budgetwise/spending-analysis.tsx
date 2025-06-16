"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartBig } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import type { BudgetCategory, Payment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface SpendingAnalysisProps {
  budgetCategories: BudgetCategory[];
  payments: Payment[];
}

const SpendingAnalysis: React.FC<SpendingAnalysisProps> = ({ budgetCategories, payments }) => {
  const { theme } = useTheme();

  const data = budgetCategories.map(category => {
    const spent = payments
      .filter(p => p.categoryId === category.id)
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      name: category.name,
      budgeted: category.allocatedAmount,
      spent: spent,
      remaining: category.allocatedAmount - spent,
    };
  });

  const chartColors = {
    budgeted: theme === 'dark' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-2))', // Lighter Teal
    spent: theme === 'dark' ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-1))',    // Teal
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background border border-border rounded-md shadow-lg">
          <p className="font-headline text-foreground">{`${label}`}</p>
          <p style={{ color: chartColors.budgeted }}>{`Budgeted: ${formatCurrency(payload[0].value)}`}</p>
          <p style={{ color: chartColors.spent }}>{`Spent: ${formatCurrency(payload[1].value)}`}</p>
          <p className={`font-semibold ${payload[0].payload.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
            {`Remaining: ${formatCurrency(payload[0].payload.remaining)}`}
          </p>
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><BarChartBig className="mr-2 h-6 w-6 text-primary" />Spending Analysis</CardTitle>
        <CardDescription>Visualize your spending compared to your allocated budget for each category.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No budget categories or payments to analyze yet.</p>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value, 'USD').replace('US','')} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}/>
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }}/>
                <Bar dataKey="budgeted" fill={chartColors.budgeted} name="Budgeted" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="spent" fill={chartColors.spent} name="Spent" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpendingAnalysis;
