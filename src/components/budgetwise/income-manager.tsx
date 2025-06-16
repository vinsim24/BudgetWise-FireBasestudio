"use client";

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Landmark, PlusCircle, Trash2 } from 'lucide-react';
import type { IncomeSource } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const incomeSchema = z.object({
  name: z.string().min(1, 'Income source name is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface IncomeManagerProps {
  incomes: IncomeSource[];
  onAddIncome: (income: IncomeSource) => void;
  onDeleteIncome: (incomeId: string) => void;
}

const IncomeManager: React.FC<IncomeManagerProps> = ({ incomes, onAddIncome, onDeleteIncome }) => {
  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { name: '', amount: 0 },
  });

  const onSubmit: SubmitHandler<IncomeFormData> = (data) => {
    onAddIncome({
      id: crypto.randomUUID(),
      name: data.name,
      amount: data.amount,
      dateAdded: new Date().toISOString(),
    });
    form.reset();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><Landmark className="mr-2 h-6 w-6 text-primary" />Manage Income Sources</CardTitle>
        <CardDescription>Add and view your sources of income.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Source Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Salary, Freelance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 3000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Income
            </Button>
          </form>
        </Form>

        <h3 className="text-lg font-semibold mb-2 font-headline">Current Income Sources</h3>
        {incomes.length === 0 ? (
          <p className="text-muted-foreground">No income sources added yet.</p>
        ) : (
          <ScrollArea className="h-[200px] rounded-md border table-on-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell className="font-medium">{income.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(income.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => onDeleteIncome(income.id)} aria-label={`Delete ${income.name}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">Total monthly income: <span className="font-bold text-primary">{formatCurrency(incomes.reduce((acc, curr) => acc + curr.amount, 0))}</span></p>
      </CardFooter>
    </Card>
  );
};

export default IncomeManager;
