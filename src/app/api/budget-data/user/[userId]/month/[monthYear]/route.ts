import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { BudgetDataForMonth } from '@/lib/types';
import { parse } from 'date-fns';

export async function GET(
  request: Request,
  { params }: { params: { userId: string; monthYear: string } }
) {
  try {
    const { userId, monthYear } = params;
    if (!userId || !monthYear) {
      return NextResponse.json({ error: 'User ID and Month-Year are required' }, { status: 400 });
    }

    const db = await getDb();
    const budgetData = await db.collection('budgetData').findOne({ userId, monthYear });

    if (!budgetData) {
      return NextResponse.json({ error: 'Data not found for this user and month' }, { status: 404 });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...dataToReturn } = budgetData;
    return NextResponse.json(dataToReturn as BudgetDataForMonth);
  } catch (error) {
    console.error('Failed to fetch budget data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string; monthYear: string } }
) {
  try {
    const { userId, monthYear } = params;
    if (!userId || !monthYear) {
      return NextResponse.json({ error: 'User ID and Month-Year are required' }, { status: 400 });
    }

    const body = await request.json() as BudgetDataForMonth;
    
    const parsedDate = parse(monthYear, 'yyyy-MM', new Date());
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth(); // 0-indexed

    const dataToSave = {
      userId,
      monthYear,
      year,
      month,
      incomes: body.incomes || [],
      budgetCategories: body.budgetCategories || [],
      payments: body.payments || [],
    };

    const db = await getDb();
    const result = await db.collection('budgetData').updateOne(
      { userId, monthYear },
      { $set: dataToSave },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Data saved successfully', result });
  } catch (error) {
    console.error('Failed to save budget data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
