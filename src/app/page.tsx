
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
import { Save } from 'lucide-react';

// Sample Data (can be removed or modified)
const initialIncomes: IncomeSource[] = [
  { id: 'inc1', name: 'Monthly Salary', amount: 5000, dateAdded: new Date().toISOString() },
  { id: 'inc2', name: 'Freelance Project', amount: 750, dateAdded: new Date().toISOString() },
];

const initialBudgetCategories: BudgetCategory[] = [
  { id: 'cat1', name: 'Rent/Mortgage', allocatedAmount: 1500, iconName: 'Home' },
  { id: 'cat2', name: 'Groceries', allocatedAmount: 400, iconName: 'ShoppingCart' },
  { id: 'cat3', name: 'Utilities', allocatedAmount: 200, iconName: 'Droplets' },
  { id: 'cat4', name: 'Transportation', allocatedAmount: 150, iconName: 'Car' },
  { id: 'cat5', name: 'Entertainment', allocatedAmount: 200, iconName: 'Film' },
];

const initialPayments: Payment[] = [
  { id: 'pay1', categoryId: 'cat1', description: 'Monthly Rent', amount: 1500, date: new Date(Date.now() - 2*24*60*60*1000).toISOString(), isTransferred: true },
  { id: 'pay2', categoryId: 'cat2', description: 'Weekly Groceries', amount: 85.50, date: new Date(Date.now() - 1*24*60*60*1000).toISOString(), isTransferred: true },
  { id: 'pay3', categoryId: 'cat3', description: 'Electricity Bill', amount: 75.20, date: new Date().toISOString(), isTransferred: false },
  { id: 'pay4', categoryId: 'cat5', description: 'Movie Tickets', amount: 30.00, date: new Date().toISOString(), isTransferred: true },
];


export default function BudgetWisePage() {
  const [incomes, setIncomes] = useState<IncomeSource[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    // Load data from localStorage or use initial sample data
    const storedIncomes = localStorage.getItem('budgetwise_incomes');
    const storedBudgets = localStorage.getItem('budgetwise_budgets');
    const storedPayments = localStorage.getItem('budgetwise_payments');

    setIncomes(storedIncomes ? JSON.parse(storedIncomes) : initialIncomes);
    setBudgetCategories(storedBudgets ? JSON.parse(storedBudgets) : initialBudgetCategories);
    setPayments(storedPayments ? JSON.parse(storedPayments) : initialPayments);
  }, []);

  const saveDataToLocalStorage = useCallback(() => {
    localStorage.setItem('budgetwise_incomes', JSON.stringify(incomes));
    localStorage.setItem('budgetwise_budgets', JSON.stringify(budgetCategories));
    localStorage.setItem('budgetwise_payments', JSON.stringify(payments));
    toast({ title: "Data Saved!", description: "Your budget data has been saved locally." });
  }, [incomes, budgetCategories, payments, toast]);


  // Income Management
  const handleAddIncome = (income: IncomeSource) => {
    setIncomes(prev => [...prev, income]);
    toast({ title: "Income Added", description: `${income.name} has been added.` });
  };
  const handleDeleteIncome = (incomeId: string) => {
    setIncomes(prev => prev.filter(inc => inc.id !== incomeId));
    toast({ title: "Income Deleted", description: "Income source has been removed." });
  };

  // Budget Category Management
  const handleAddCategory = (category: BudgetCategory) => {
    setBudgetCategories(prev => [...prev, category]);
    toast({ title: "Budget Category Added", description: `${category.name} has been added.` });
  };
  const handleDeleteCategory = (categoryId: string) => {
    setBudgetCategories(prev => prev.filter(cat => cat.id !== categoryId));
    // Optionally, remove payments associated with this category or reassign them
    setPayments(prev => prev.filter(p => p.categoryId !== categoryId));
    toast({ title: "Budget Category Deleted", description: "Category and associated payments removed." });
  };

  // Payment Management
  const handleAddPayment = (payment: Payment) => {
    setPayments(prev => [...prev, payment]);
    toast({ title: "Payment Recorded", description: `${payment.description} has been recorded.` });
  };
  const handleDeletePayment = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    toast({ title: "Payment Deleted", description: "Payment record has been removed." });
  };
   const handleUpdatePayment = (updatedPayment: Payment) => {
    setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
    toast({ title: "Payment Updated", description: `${updatedPayment.description} status changed.` });
  };


  if (!isClient) {
    // Render a loading state or null on the server to avoid hydration mismatch
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
            <Save className="mr-2 h-4 w-4" /> Save Data
          </Button>
        </div>
        
        <DashboardSummary incomes={incomes} budgetCategories={budgetCategories} payments={payments} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-3 space-y-8"> {/* Adjusted to lg:col-span-3 */}
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
