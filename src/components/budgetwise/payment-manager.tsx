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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, CreditCard, PlusCircle, Trash2 } from 'lucide-react';
import type { Payment, BudgetCategory } from '@/lib/types';
import { formatCurrency, cn, getIcon } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';

const paymentSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  categoryId: z.string().min(1, 'Category is required.'),
  date: z.date({ required_error: "Payment date is required." }),
  isTransferred: z.boolean().default(false),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentManagerProps {
  payments: Payment[];
  budgetCategories: BudgetCategory[];
  onAddPayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
  onUpdatePayment: (payment: Payment) => void;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({ payments, budgetCategories, onAddPayment, onDeletePayment, onUpdatePayment }) => {
  const { theme } = useTheme();
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { description: '', amount: 0, categoryId: '', date: new Date(), isTransferred: false },
  });

  const onSubmit: SubmitHandler<PaymentFormData> = (data) => {
    onAddPayment({
      id: crypto.randomUUID(),
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId,
      date: data.date.toISOString(),
      isTransferred: data.isTransferred,
    });
    form.reset();
  };

  const handleToggleTransferred = (payment: Payment) => {
    onUpdatePayment({ ...payment, isTransferred: !payment.isTransferred });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><CreditCard className="mr-2 h-6 w-6 text-primary" />Track Payments</CardTitle>
        <CardDescription>Record your actual payments for each category.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="lg:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Monthly rent, Groceries" {...field} />
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
                      <Input type="number" step="0.01" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgetCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="isTransferred"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm col-span-full md:col-span-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Payment Transferred?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            <Button type="submit" className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </form>
        </Form>

        <h3 className="text-lg font-semibold mb-2 font-headline">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <ScrollArea className="h-[300px] rounded-md border table-on-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Transferred</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payment) => {
                  const category = budgetCategories.find(c => c.id === payment.categoryId);
                  const IconCmp = category ? getIcon(category.iconName) as React.ElementType : React.Fragment;
                  const rowClassName = payment.isTransferred ? (theme === 'dark' ? 'payment-transferred-dark' : 'payment-transferred-light') : '';
                  return (
                    <TableRow key={payment.id} className={cn(rowClassName, "transition-colors")}>
                      <TableCell className="font-medium">{payment.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {category && <IconCmp className="mr-2 h-4 w-4 text-muted-foreground" />}
                          {category?.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{format(new Date(payment.date), "PP")}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={payment.isTransferred}
                          onCheckedChange={() => handleToggleTransferred(payment)}
                          aria-label={`Mark ${payment.description} as ${payment.isTransferred ? 'not transferred' : 'transferred'}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onDeletePayment(payment.id)} aria-label={`Delete payment ${payment.description}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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
         <p className="text-sm text-muted-foreground">Total payments made: <span className="font-bold text-primary">{formatCurrency(payments.reduce((acc, curr) => acc + curr.amount, 0))}</span></p>
      </CardFooter>
    </Card>
  );
};

export default PaymentManager;
