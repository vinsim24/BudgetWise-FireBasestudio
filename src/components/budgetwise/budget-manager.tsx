"use client";

import React, { useState }  from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as LucideIcons from 'lucide-react'; // Import all icons
import type { BudgetCategory, Payment } from '@/lib/types';
import { formatCurrency, getIcon } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

const budgetSchema = z.object({
  name: z.string().min(1, 'Category name is required.'),
  allocatedAmount: z.coerce.number().positive('Allocated amount must be positive.'),
  iconName: z.string().min(1, 'Icon is required.'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const iconOptions = [
  { value: 'Home', label: 'Housing', IconCmp: LucideIcons.Home },
  { value: 'Utensils', label: 'Groceries', IconCmp: LucideIcons.Utensils },
  { value: 'Car', label: 'Transportation', IconCmp: LucideIcons.Car },
  { value: 'Droplets', label: 'Utilities', IconCmp: LucideIcons.Droplets },
  { value: 'HeartPulse', label: 'Healthcare', IconCmp: LucideIcons.HeartPulse },
  { value: 'Shield', label: 'Insurance', IconCmp: LucideIcons.ShieldCheck },
  { value: 'Film', label: 'Entertainment', IconCmp: LucideIcons.Film },
  { value: 'GraduationCap', label: 'Education', IconCmp: LucideIcons.GraduationCap },
  { value: 'Gift', label: 'Gifts/Donations', IconCmp: LucideIcons.Gift },
  { value: 'Briefcase', label: 'Work', IconCmp: LucideIcons.Briefcase },
  { value: 'Activity', label: 'Miscellaneous', IconCmp: LucideIcons.Activity },
  { value: 'PiggyBank', label: 'Savings', IconCmp: LucideIcons.PiggyBank },
];

interface BudgetManagerProps {
  budgetCategories: BudgetCategory[];
  payments: Payment[];
  onAddCategory: (category: BudgetCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ budgetCategories, payments, onAddCategory, onDeleteCategory }) => {
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { name: '', allocatedAmount: 0, iconName: '' },
  });

  const onSubmit: SubmitHandler<BudgetFormData> = (data) => {
    onAddCategory({
      id: crypto.randomUUID(),
      name: data.name,
      allocatedAmount: data.allocatedAmount,
      iconName: data.iconName,
    });
    form.reset();
  };

  const getSpentAmount = (categoryId: string) => {
    return payments
      .filter(p => p.categoryId === categoryId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><LucideIcons.LayoutList className="mr-2 h-6 w-6 text-primary" />Budget Categories</CardTitle>
        <CardDescription>Define your budget limits for different expense categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Groceries, Rent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allocatedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocated Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="iconName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center">
                              <opt.IconCmp className="mr-2 h-4 w-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full md:w-auto">
              <LucideIcons.PlusCircle className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </form>
        </Form>

        <h3 className="text-lg font-semibold mb-2 font-headline">Your Budget Plan</h3>
        {budgetCategories.length === 0 ? (
          <p className="text-muted-foreground">No budget categories defined yet.</p>
        ) : (
          <ScrollArea className="h-[300px] rounded-md border table-on-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetCategories.map((category) => {
                  const IconCmp = getIcon(category.iconName) as LucideIcons.LucideIcon;
                  const spentAmount = getSpentAmount(category.id);
                  const remainingAmount = category.allocatedAmount - spentAmount;
                  const progress = category.allocatedAmount > 0 ? (spentAmount / category.allocatedAmount) * 100 : 0;
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <IconCmp className="mr-2 h-5 w-5 text-primary" />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(category.allocatedAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(spentAmount)}</TableCell>
                      <TableCell className={`text-right font-semibold ${remainingAmount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {formatCurrency(remainingAmount)}
                      </TableCell>
                       <TableCell>
                        <Progress value={Math.min(100, progress)} className="w-24 h-2" indicatorClassName={progress > 100 ? "bg-destructive" : ""} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onDeleteCategory(category.id)} aria-label={`Delete ${category.name}`}>
                          <LucideIcons.Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter>
         <p className="text-sm text-muted-foreground">Total budgeted amount: <span className="font-bold text-primary">{formatCurrency(budgetCategories.reduce((acc, curr) => acc + curr.allocatedAmount, 0))}</span></p>
      </CardFooter>
    </Card>
  );
};

export default BudgetManager;
