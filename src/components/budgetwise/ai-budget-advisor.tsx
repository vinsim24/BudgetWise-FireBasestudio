"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, AlertCircle, Lightbulb } from 'lucide-react';
import type { IncomeSource, BudgetCategory, Payment, AiSuggestion, AiOverspendingResult } from '@/lib/types';
import { suggestBudgetOptimizations } from '@/ai/flows/suggest-budget-optimizations';
import { identifyPotentialOverspending } from '@/ai/flows/identify-potential-overspending';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AiBudgetAdvisorProps {
  incomes: IncomeSource[];
  budgetCategories: BudgetCategory[];
  payments: Payment[];
}

const AiBudgetAdvisor: React.FC<AiBudgetAdvisorProps> = ({ incomes, budgetCategories, payments }) => {
  const [optimizations, setOptimizations] = useState<AiSuggestion[] | null>(null);
  const [overspending, setOverspending] = useState<AiOverspendingResult | null>(null);
  const [isLoadingOptimizations, setIsLoadingOptimizations] = useState(false);
  const [isLoadingOverspending, setIsLoadingOverspending] = useState(false);
  const { toast } = useToast();

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  
  const budgetAllocations = budgetCategories.reduce((acc, cat) => {
    acc[cat.name] = cat.allocatedAmount;
    return acc;
  }, {} as Record<string, number>);

  const actualSpending = budgetCategories.reduce((acc, cat) => {
    const spentInCategory = payments
      .filter(p => p.categoryId === cat.id)
      .reduce((sum, p) => sum + p.amount, 0);
    acc[cat.name] = spentInCategory;
    return acc;
  }, {} as Record<string, number>);
  
  const paymentHighlighting = payments.reduce((acc, payment) => {
    const categoryName = budgetCategories.find(c => c.id === payment.categoryId)?.name;
    if (categoryName) {
      acc[categoryName] = payment.isTransferred;
    }
    return acc;
  }, {} as Record<string, boolean>);


  const handleSuggestOptimizations = async () => {
    setIsLoadingOptimizations(true);
    setOptimizations(null);
    try {
      const result = await suggestBudgetOptimizations({
        income: totalIncome,
        budgetAllocations,
        actualSpending,
      });
      setOptimizations(result.suggestions);
    } catch (error) {
      console.error("Error fetching budget optimizations:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not fetch budget optimization suggestions.",
      });
    } finally {
      setIsLoadingOptimizations(false);
    }
  };

  const handleIdentifyOverspending = async () => {
    setIsLoadingOverspending(true);
    setOverspending(null);
    try {
      const result = await identifyPotentialOverspending({
        income: totalIncome,
        budget: budgetAllocations,
        spending: actualSpending,
        paymentHighlighting,
      });
      setOverspending(result);
    } catch (error) {
      console.error("Error identifying potential overspending:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not identify potential overspending.",
      });
    } finally {
      setIsLoadingOverspending(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><Sparkles className="mr-2 h-6 w-6 text-primary" />AI Budget Advisor</CardTitle>
        <CardDescription>Get smart suggestions to optimize your budget and manage spending.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Button onClick={handleSuggestOptimizations} disabled={isLoadingOptimizations || isLoadingOverspending} className="w-full">
            {isLoadingOptimizations ? "Analyzing..." : "Suggest Budget Optimizations"}
          </Button>
          {optimizations && optimizations.length > 0 && (
            <Alert variant="default" className="mt-4 bg-accent/20 border-accent">
              <Lightbulb className="h-5 w-5 text-accent-foreground" />
              <AlertTitle className="font-headline text-accent-foreground">Optimization Suggestions</AlertTitle>
              <ScrollArea className="h-[150px] mt-2">
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {optimizations.map((opt, index) => (
                      <li key={index}>
                        <strong>{opt.category}:</strong> {opt.suggestion} <em>(Impact: {opt.impact})</em>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </ScrollArea>
            </Alert>
          )}
          {optimizations !== null && optimizations.length === 0 && (
             <p className="text-sm text-muted-foreground text-center py-2">No specific optimizations found. Your budget looks balanced!</p>
          )}
        </div>

        <div className="space-y-2">
          <Button onClick={handleIdentifyOverspending} disabled={isLoadingOptimizations || isLoadingOverspending} className="w-full">
            {isLoadingOverspending ? "Scanning..." : "Identify Potential Overspending"}
          </Button>
          {overspending && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-headline">Potential Overspending</AlertTitle>
              <ScrollArea className="h-[150px] mt-2">
              <AlertDescription>
                {overspending.overspendingCategories.length > 0 && (
                  <>
                    <p>You might be overspending in:</p>
                    <ul className="list-disc pl-5">
                      {overspending.overspendingCategories.map((cat, index) => (
                        <li key={index}>{cat}</li>
                      ))}
                    </ul>
                  </>
                )}
                <p className="mt-2">{overspending.suggestions}</p>
              </AlertDescription>
              </ScrollArea>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">AI suggestions are for informational purposes only. Consult a financial advisor for personalized advice.</p>
      </CardFooter>
    </Card>
  );
};

export default AiBudgetAdvisor;
