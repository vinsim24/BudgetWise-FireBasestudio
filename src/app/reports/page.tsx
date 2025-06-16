
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, getIcon } from '@/lib/utils';
import type { IncomeSource, BudgetCategory, Payment, ReportPeriodSummary, MonthlyDataForReport } from '@/lib/types';
import Header from '@/components/budgetwise/header';
import { BarChart, FileText, CalendarDays } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, getMonth, getYear, set, parse } from 'date-fns';

const getMonthStorageKeyPrefix = (): string => 'budgetwise_data_';

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]); // 0-11 for Jan-Dec
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined); // 0-11
  const [reportData, setReportData] = useState<ReportPeriodSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getAllStoredData = useCallback((): MonthlyDataForReport[] => {
    if (!isClient) return [];
    const data: MonthlyDataForReport[] = [];
    const prefix = getMonthStorageKeyPrefix();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const monthStr = key.substring(prefix.length); // YYYY-MM
          const [year, month] = monthStr.split('-').map(Number);
          const storedValue = localStorage.getItem(key);
          if (storedValue) {
            const parsedData = JSON.parse(storedValue);
            data.push({
              year,
              month: month - 1, // Convert to 0-indexed month
              incomes: parsedData.incomes || [],
              budgetCategories: parsedData.budgetCategories || [],
              payments: parsedData.payments || [],
            });
          }
        } catch (error) {
          console.error(`Failed to parse data for key ${key}:`, error);
        }
      }
    }
    return data;
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    const allData = getAllStoredData();
    const years = Array.from(new Set(allData.map(d => d.year))).sort((a, b) => b - a);
    setAvailableYears(years);
    if (years.length > 0) {
      const currentYear = new Date().getFullYear();
      setSelectedYear(years.includes(currentYear) ? currentYear : years[0]);
    }
  }, [isClient, getAllStoredData]);

  useEffect(() => {
    if (!isClient || !selectedYear) {
      setAvailableMonths([]);
      return;
    }
    const allData = getAllStoredData();
    const monthsForYear = Array.from(
      new Set(
        allData
          .filter(d => d.year === selectedYear)
          .map(d => d.month) // 0-indexed
      )
    ).sort((a, b) => a - b);
    setAvailableMonths(monthsForYear);
    if (reportType === 'monthly' && monthsForYear.length > 0) {
        const currentMonth = new Date().getMonth();
        if(getYear(new Date()) === selectedYear && monthsForYear.includes(currentMonth)) {
            setSelectedMonth(currentMonth);
        } else {
            setSelectedMonth(monthsForYear[0]);
        }
    } else if (reportType === 'monthly') {
        setSelectedMonth(undefined);
    }
  }, [isClient, selectedYear, reportType, getAllStoredData]);


  const generateReport = useCallback(() => {
    if (!isClient) return;
    setIsLoading(true);
    setReportData(null);

    const allData = getAllStoredData();
    let periodLabel = "";
    let relevantData: MonthlyDataForReport[] = [];

    if (reportType === 'monthly' && selectedYear !== undefined && selectedMonth !== undefined) {
      const monthDate = set(new Date(), { year: selectedYear, month: selectedMonth });
      periodLabel = format(monthDate, 'MMMM yyyy');
      relevantData = allData.filter(d => d.year === selectedYear && d.month === selectedMonth);
    } else if (reportType === 'yearly' && selectedYear !== undefined) {
      periodLabel = `Year ${selectedYear}`;
      relevantData = allData.filter(d => d.year === selectedYear);
    } else {
      setIsLoading(false);
      return;
    }

    if (relevantData.length === 0) {
      setReportData({
        periodLabel,
        totalIncome: 0,
        totalBudgeted: 0,
        totalSpent: 0,
        remainingBalance: 0,
        categorySummaries: [],
      });
      setIsLoading(false);
      return;
    }

    let totalIncome = 0;
    let totalBudgeted = 0;
    let totalSpent = 0;
    const categoryMap = new Map<string, { name: string; iconName: string; allocated: number; spent: number }>();

    relevantData.forEach(monthData => {
      monthData.incomes.forEach(inc => totalIncome += inc.amount);
      monthData.budgetCategories.forEach(cat => {
        totalBudgeted += cat.allocatedAmount;
        const existingCat = categoryMap.get(cat.name); // Group by name, assuming names are unique identifiers for aggregation
        if (existingCat) {
          existingCat.allocated += cat.allocatedAmount;
        } else {
          categoryMap.set(cat.name, { name: cat.name, iconName: cat.iconName, allocated: cat.allocatedAmount, spent: 0 });
        }
      });
      monthData.payments.forEach(pay => {
        totalSpent += pay.amount;
        const budgetCat = monthData.budgetCategories.find(c => c.id === pay.categoryId);
        if (budgetCat) {
          const reportCat = categoryMap.get(budgetCat.name);
          if (reportCat) {
            reportCat.spent += pay.amount;
          }
          // If category for payment doesn't exist in budget (e.g. old payment, category deleted), it's still part of totalSpent
        }
      });
    });

    const categorySummaries = Array.from(categoryMap.values()).map(c => ({
      categoryName: c.name,
      iconName: c.iconName,
      totalAllocated: c.allocated,
      totalSpentInPeriod: c.spent,
      remainingInCategory: c.allocated - c.spent,
    })).sort((a,b) => a.categoryName.localeCompare(b.categoryName));

    setReportData({
      periodLabel,
      totalIncome,
      totalBudgeted,
      totalSpent,
      remainingBalance: totalIncome - totalSpent,
      categorySummaries,
    });

    setIsLoading(false);
  }, [isClient, reportType, selectedYear, selectedMonth, getAllStoredData]);

  if (!isClient) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-foreground font-headline">Loading Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-6 w-6 text-primary" />Financial Reports</CardTitle>
            <CardDescription>Generate monthly or yearly financial summaries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <Label htmlFor="reportType" className="block mb-2 font-semibold">Report Type</Label>
                <RadioGroup
                  id="reportType"
                  defaultValue="monthly"
                  value={reportType}
                  onValueChange={(value: 'monthly' | 'yearly') => {
                    setReportType(value);
                    setReportData(null); // Clear previous report
                    if (value === 'yearly') setSelectedMonth(undefined);
                  }}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="r1" />
                    <Label htmlFor="r1">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="r2" />
                    <Label htmlFor="r2">Yearly</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="yearSelect" className="block mb-2 font-semibold">Year</Label>
                <Select
                  value={selectedYear?.toString()}
                  onValueChange={(val) => {
                    setSelectedYear(Number(val));
                    setReportData(null);
                  }}
                  disabled={availableYears.length === 0}
                >
                  <SelectTrigger id="yearSelect">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reportType === 'monthly' && (
                <div>
                  <Label htmlFor="monthSelect" className="block mb-2 font-semibold">Month</Label>
                  <Select
                    value={selectedMonth?.toString()}
                    onValueChange={(val) => {
                      setSelectedMonth(Number(val));
                      setReportData(null);
                    }}
                    disabled={availableMonths.length === 0 || !selectedYear}
                  >
                    <SelectTrigger id="monthSelect">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map(monthIndex => (
                        <SelectItem key={monthIndex} value={monthIndex.toString()}>
                          {format(set(new Date(), { month: monthIndex }), 'MMMM')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button onClick={generateReport} disabled={isLoading || !selectedYear || (reportType === 'monthly' && selectedMonth === undefined)} className="w-full md:w-auto">
              {isLoading ? "Generating..." : "Generate Report"} <BarChart className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {reportData && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><CalendarDays className="mr-2 h-6 w-6 text-primary" />Report for: {reportData.periodLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/10">
                  <CardHeader><CardTitle className="text-sm font-medium text-primary">Total Income</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-primary">{formatCurrency(reportData.totalIncome)}</p></CardContent>
                </Card>
                <Card className="bg-secondary/20">
                  <CardHeader><CardTitle className="text-sm font-medium text-secondary-foreground">Total Budgeted</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-secondary-foreground">{formatCurrency(reportData.totalBudgeted)}</p></CardContent>
                </Card>
                 <Card className={reportData.totalSpent > reportData.totalBudgeted && reportData.totalBudgeted > 0 ? "bg-destructive/20" : "bg-accent/20"}>
                  <CardHeader><CardTitle className="text-sm font-medium text-accent-foreground">Total Spent</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-accent-foreground">{formatCurrency(reportData.totalSpent)}</p></CardContent>
                </Card>
                <Card className={reportData.remainingBalance < 0 ? "bg-destructive/20" : "bg-green-500/20"}>
                  <CardHeader><CardTitle className="text-sm font-medium">Net Balance</CardTitle></CardHeader>
                  <CardContent><p className={`text-2xl font-bold ${reportData.remainingBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(reportData.remainingBalance)}</p></CardContent>
                </Card>
              </div>

              {reportData.categorySummaries.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 font-headline">Category Breakdown</h3>
                  <ScrollArea className="h-[400px] rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Total Budgeted</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                          <TableHead className="text-right">Difference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.categorySummaries.map(cat => {
                          const IconCmp = getIcon(cat.iconName) as React.ElementType;
                          const difference = cat.totalAllocated - cat.totalSpentInPeriod;
                          return (
                            <TableRow key={cat.categoryName}>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <IconCmp className="mr-2 h-5 w-5 text-muted-foreground" />
                                  {cat.categoryName}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(cat.totalAllocated)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(cat.totalSpentInPeriod)}</TableCell>
                              <TableCell className={`text-right font-semibold ${difference < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                {formatCurrency(difference)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
              {reportData.categorySummaries.length === 0 && (
                 <p className="text-muted-foreground text-center py-4">No category data available for this period.</p>
              )}
            </CardContent>
          </Card>
        )}
         {!reportData && !isLoading && (
            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">Select report parameters and click "Generate Report" to view data.</p>
                </CardContent>
            </Card>
        )}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} BudgetWise Reports. All rights reserved.
      </footer>
    </div>
  );
};

export default ReportsPage;

