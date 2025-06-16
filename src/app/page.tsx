
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/budgetwise/header';
import DashboardSummary from '@/components/budgetwise/dashboard-summary';
import IncomeManager from '@/components/budgetwise/income-manager';
import BudgetManager from '@/components/budgetwise/budget-manager';
import PaymentManager from '@/components/budgetwise/payment-manager';
import SpendingAnalysis from '@/components/budgetwise/spending-analysis';
import type { IncomeSource, BudgetCategory, Payment } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';

// Sample Data (can be removed or modified)
const initialBudgetCategories: BudgetCategory[] = [
  { id: 'cat1', name: 'Rent/Mortgage', allocatedAmount: 1500, iconName: 'Home' },
  { id: 'cat2', name: 'Groceries', allocatedAmount: 400, iconName: 'ShoppingCart' },
  { id: 'cat3', name: 'Utilities', allocatedAmount: 200, iconName: 'Droplets' },
  { id: 'cat4', name: 'Transportation', allocatedAmount: 150, iconName: 'Car' },
  { id: 'cat5', name: 'Entertainment', allocatedAmount: 200, iconName: 'Film' },
];

const getMonthStorageKey = (date: Date): string => {
  return `budgetwise_data_${format(date, 'yyyy-MM')}`;
};

export default function BudgetWisePage() {
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(new Date());
  const [incomes, setIncomes] = useState<IncomeSource[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const monthKey = getMonthStorageKey(currentDisplayMonth);
    const storedDataForMonth = localStorage.getItem(monthKey);

    if (storedDataForMonth) {
      try {
        const data = JSON.parse(storedDataForMonth);
        setIncomes(data.incomes || []);
        setBudgetCategories(data.budgetCategories || initialBudgetCategories);
        setPayments(data.payments || []);
      } catch (error) {
        console.error("Failed to parse data from localStorage:", error);
        // Fallback to default state for the month
        setIncomes([]);
        setPayments([]);
        loadDefaultBudgetCategoriesForMonth();
      }
    } else {
      // New month or first load for this month
      setIncomes([]);
      setPayments([]);
      loadDefaultBudgetCategoriesForMonth();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDisplayMonth, isClient]);

  const loadDefaultBudgetCategoriesForMonth = useCallback(() => {
    const prevMonthDate = subMonths(currentDisplayMonth, 1);
    const prevMonthKey = getMonthStorageKey(prevMonthDate);
    const storedPrevMonthData = localStorage.getItem(prevMonthKey);

    if (storedPrevMonthData) {
      try {
        const prevData = JSON.parse(storedPrevMonthData);
        setBudgetCategories(prevData.budgetCategories || initialBudgetCategories);
      } catch (error) {
        console.error("Failed to parse previous month data:", error);
        setBudgetCategories(initialBudgetCategories);
      }
    } else {
      setBudgetCategories(initialBudgetCategories);
    }
  }, [currentDisplayMonth]);


  const saveDataToLocalStorage = useCallback(() => {
    if (!isClient) return;
    const monthKey = getMonthStorageKey(currentDisplayMonth);
    const dataToSave = { incomes, budgetCategories, payments };
    localStorage.setItem(monthKey, JSON.stringify(dataToSave));
    toast({ title: "Data Saved!", description: `Your budget data for ${format(currentDisplayMonth, 'MMMM yyyy')} has been saved locally.` });
  }, [incomes, budgetCategories, payments, currentDisplayMonth, toast, isClient]);


  const handlePreviousMonth = () => {
    setCurrentDisplayMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDisplayMonth(prev => addMonths(prev, 1));
  };

  // Income Management
  const handleAddIncome = (income: IncomeSource) => {
    setIncomes(prev => [...prev, income]);
    toast({ title: "Income Added", description: `${income.name} has been added for ${format(currentDisplayMonth, 'MMMM yyyy')}.` });
  };
  const handleDeleteIncome = (incomeId: string) => {
    setIncomes(prev => prev.filter(inc => inc.id !== incomeId));
    toast({ title: "Income Deleted", description: `Income source has been removed for ${format(currentDisplayMonth, 'MMMM yyyy')}.` });
  };

  // Budget Category Management
  const handleAddCategory = (category: BudgetCategory) => {
    setBudgetCategories(prev => [...prev, category]);
    toast({ title: "Budget Category Added", description: `${category.name} has been added for ${format(currentDisplayMonth, 'MMMM yyyy')}.` });
  };
  const handleDeleteCategory = (categoryId: string) => {
    setBudgetCategories(prev => prev.filter(cat => cat.id !== categoryId));
    setPayments(prev => prev.filter(p => p.categoryId !== categoryId)); // Also remove payments for this category in the current month
    toast({ title: "Budget Category Deleted", description: `Category and associated payments removed for ${format(currentDisplayMonth, 'MMMM yyyy')}.` });
  };

  // Payment Management
  const handleAddPayment = (payment: Payment) => {
    setPayments(prev => [...prev, payment]);
    toast({ title: "Payment Recorded", description: `${payment.description} has been recorded for ${format(currentDisplayMonth, 'MMMM yyyy')}.` });
  };
  const handleDeletePayment = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    toast({ title: "Payment Deleted", description: `Payment record has been removed for ${format(currentDisplayMonth, 'MMMM yyyy')}.` });
  };
   const handleUpdatePayment = (updatedPayment: Payment) => {
    setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
    toast({ title: "Payment Updated", description: `${updatedPayment.description} status changed for ${format(currentDisplayMonth, 'MMMM yyyy')}.` });
  };


  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-foreground font-headline">Loading BudgetWise...</p>
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
           <Button onClick={saveDataToLocalStorage} variant="outline">
            <Save className="mr-2 h-4 w-4" /> Save Data for {format(currentDisplayMonth, 'MMM yyyy')}
          </Button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center space-x-4 my-6">
          <Button onClick={handlePreviousMonth} variant="outline" aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-xl font-semibold font-headline text-foreground tabular-nums">
            {format(currentDisplayMonth, 'MMMM yyyy')}
          </span>
          <Button onClick={handleNextMonth} variant="outline" aria-label="Next month">
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
