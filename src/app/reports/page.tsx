
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, getIcon } from '@/lib/utils';
import type { ReportPeriodSummary, MonthlyDataForReport } from '@/lib/types';
import Header from '@/components/budgetwise/header';
import { BarChart, FileText, CalendarDays, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, getMonth, getYear, set } from 'date-fns';

const USER_ID = "defaultUser"; 

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]); 
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined); 
  const [reportData, setReportData] = useState<ReportPeriodSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchAllBudgetDataForUser = useCallback(async (): Promise<MonthlyDataForReport[]> => {
    if (!isClient) return [];
    setIsFetchingInitialData(true);
    try {
      const response = await fetch(`/api/budget-data/user/${USER_ID}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      const data = await response.json() as MonthlyDataForReport[];
      return data;
    } catch (error) {
      console.error("Failed to fetch data for reports:", error);
      return [];
    } finally {
        setIsFetchingInitialData(false);
    }
  }, [isClient]);


  useEffect(() => {
    if (!isClient) return;

    const fetchAndSetAvailableDates = async () => {
      const allData = await fetchAllBudgetDataForUser();
      const years = Array.from(new Set(allData.map(d => d.year))).sort((a, b) => b - a);
      setAvailableYears(years);
      if (years.length > 0) {
        const currentYear = new Date().getFullYear();
        setSelectedYear(years.includes(currentYear) ? currentYear : years[0]);
      }
    };
    fetchAndSetAvailableDates();
  }, [isClient, fetchAllBudgetDataForUser]);


  useEffect(() => {
    if (!isClient || !selectedYear || isFetchingInitialData) {
      setAvailableMonths([]);
      return;
    }
    
    const updateMonths = async () => {
        const allData = await fetchAllBudgetDataForUser(); 
        const monthsForYear = Array.from(
          new Set(
            allData
              .filter(d => d.year === selectedYear)
              .map(d => d.month) 
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
    };
    if (selectedYear) { // Ensure selectedYear is set before fetching months
        updateMonths();
    }
  }, [isClient, selectedYear, reportType, fetchAllBudgetDataForUser, isFetchingInitialData]);


  const generateReport = useCallback(async () => {
    if (!isClient) return;
    setIsLoading(true);
    setReportData(null);

    const allData = await fetchAllBudgetDataForUser();
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
        const existingCat = categoryMap.get(cat.name);
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
  }, [isClient, reportType, selectedYear, selectedMonth, fetchAllBudgetDataForUser]);

  if (!isClient || isFetchingInitialData) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10 text-primary mb-4" />
          <p className="text-lg text-foreground font-headline">Loading Report Data...</p>
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
            <CardDescription>Generate monthly or yearly financial summaries from your data.</CardDescription>
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
                    setReportData(null); 
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
                    //setSelectedMonth(undefined); // Reset month when year changes
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
                    {availableYears.length === 0 && <SelectItem value="no-data" disabled>No data available</SelectItem>}
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
                      {availableMonths.length === 0 && <SelectItem value="no-data" disabled>No data for this year</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button onClick={generateReport} disabled={isLoading || !selectedYear || (reportType === 'monthly' && selectedMonth === undefined)} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart className="mr-2 h-4 w-4" />}
               Generate Report
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
                                  {IconCmp && <IconCmp className="mr-2 h-5 w-5 text-muted-foreground" />}
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
                    <p className="text-muted-foreground text-center">Select report parameters and click "Generate Report" to view data. If no years/months are available, add some data on the main dashboard first.</p>
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
