
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/budgetwise/header';
import DashboardSummary from '@/components/budgetwise/dashboard-summary';
import IncomeManager from '@/components/budgetwise/income-manager';
import BudgetManager from '@/components/budgetwise/budget-manager';
import PaymentManager from '@/components/budgetwise/payment-manager';
import SpendingAnalysis from '@/components/budgetwise/spending-analysis';
import type { IncomeSource, BudgetCategory, Payment, BudgetDataForMonth } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Save, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';

const initialBudgetCategories: BudgetCategory[] = [
  { id: 'cat1', name: 'Rent/Mortgage', allocatedAmount: 1500, iconName: 'Home' },
  { id: 'cat2', name: 'Groceries', allocatedAmount: 400, iconName: 'ShoppingCart' },
  { id: 'cat3', name: 'Utilities', allocatedAmount: 200, iconName: 'Droplets' },
  { id: 'cat4', name: 'Transportation', allocatedAmount: 150, iconName: 'Car' },
  { id: 'cat5', name: 'Entertainment', allocatedAmount: 200, iconName: 'Film' },
];

const USER_ID = "defaultUser"; 

export default function BudgetWisePage() {
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(new Date());
  const [incomes, setIncomes] = useState<IncomeSource[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(initialBudgetCategories);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSavingData, setIsSavingData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadDataForMonth = useCallback(async (monthDate: Date) => {
    if (!isClient) return;
    setIsLoadingData(true);

    const monthYear = format(monthDate, 'yyyy-MM');
    try {
      const response = await fetch(`/api/budget-data/user/${USER_ID}/month/${monthYear}`);
      if (response.ok) {
        const data = await response.json() as BudgetDataForMonth;
        setIncomes(data.incomes || []);
        setBudgetCategories(data.budgetCategories || initialBudgetCategories);
        setPayments(data.payments || []);
      } else if (response.status === 404) {
        setIncomes([]);
        setPayments([]);
        const prevMonthDate = subMonths(monthDate, 1);
        const prevMonthYear = format(prevMonthDate, 'yyyy-MM');
        try {
          const prevMonthResponse = await fetch(`/api/budget-data/user/${USER_ID}/month/${prevMonthYear}`);
          if (prevMonthResponse.ok) {
            const prevData = await prevMonthResponse.json() as BudgetDataForMonth;
            setBudgetCategories(prevData.budgetCategories || initialBudgetCategories);
          } else {
            setBudgetCategories(initialBudgetCategories);
          }
        } catch (e) {
           setBudgetCategories(initialBudgetCategories);
        }
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ variant: "destructive", title: "Error Loading Data", description: "Could not fetch data from the server." });
      setIncomes([]);
      setBudgetCategories(initialBudgetCategories);
      setPayments([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [isClient, toast]);

  useEffect(() => {
    loadDataForMonth(currentDisplayMonth);
  }, [currentDisplayMonth, loadDataForMonth]);


  const saveData = useCallback(async () => {
    if (!isClient) return;
    setIsSavingData(true);
    const monthYear = format(currentDisplayMonth, 'yyyy-MM');
    const dataToSave: BudgetDataForMonth = { incomes, budgetCategories, payments };
    
    try {
      const response = await fetch(`/api/budget-data/user/${USER_ID}/month/${monthYear}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
      await response.json();
      toast({ title: "Data Saved!", description: `Your budget data for ${format(currentDisplayMonth, 'MMMM yyyy')} has been saved.` });
    } catch (error) {
      console.error("Failed to save data:", error);
      toast({ variant: "destructive", title: "Error Saving Data", description: "Could not save data to the server." });
    } finally {
      setIsSavingData(false);
    }
  }, [incomes, budgetCategories, payments, currentDisplayMonth, toast, isClient]);


  const handlePreviousMonth = () => {
    setCurrentDisplayMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDisplayMonth(prev => addMonths(prev, 1));
  };

  const handleAddIncome = (income: IncomeSource) => {
    setIncomes(prev => [...prev, income]);
  };
  const handleDeleteIncome = (incomeId: string) => {
    setIncomes(prev => prev.filter(inc => inc.id !== incomeId));
  };

  const handleAddCategory = (category: BudgetCategory) => {
    setBudgetCategories(prev => [...prev, category]);
  };
  const handleDeleteCategory = (categoryId: string) => {
    setBudgetCategories(prev => prev.filter(cat => cat.id !== categoryId));
    setPayments(prev => prev.filter(p => p.categoryId !== categoryId)); 
  };

  const handleAddPayment = (payment: Payment) => {
    setPayments(prev => [...prev, payment]);
  };
  const handleDeletePayment = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
  };
   const handleUpdatePayment = (updatedPayment: Payment) => {
    setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
  };


  if (!isClient || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10 text-primary mb-4" />
          <p className="text-lg text-foreground font-headline">Loading BudgetWise Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-headline text-primary">My Dashboard</h1>
           <Button onClick={saveData} variant="outline" disabled={isSavingData}>
            {isSavingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Save Data for {format(currentDisplayMonth, 'MMM yyyy')}
          </Button>
        </div>

        <div className="flex items-center justify-center space-x-4 my-6">
          <Button onClick={handlePreviousMonth} variant="outline" aria-label="Previous month" disabled={isLoadingData || isSavingData}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-xl font-semibold font-headline text-foreground tabular-nums">
            {format(currentDisplayMonth, 'MMMM yyyy')}
          </span>
          <Button onClick={handleNextMonth} variant="outline" aria-label="Next month" disabled={isLoadingData || isSavingData}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        <DashboardSummary incomes={incomes} budgetCategories={budgetCategories} payments={payments} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-3 space-y-8">
            <IncomeManager incomes={incomes} onAddIncome={handleAddIncome} onDeleteIncome={handleDeleteIncome} />
            <BudgetManager budgetCategories={budgetCategories} payments={payments} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} />
          </div>
        </div>
        
        <PaymentManager payments={payments} budgetCategories={budgetCategories} onAddPayment={handleAddPayment} onDeletePayment={handleDeletePayment} onUpdatePayment={handleUpdatePayment} />
        <SpendingAnalysis budgetCategories={budgetCategories} payments={payments} />

      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} BudgetWise. All rights reserved.
      </footer>
    </div>
  );
}
