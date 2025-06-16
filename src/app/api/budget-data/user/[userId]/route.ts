import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { MonthlyDataForReport } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const allData = await db.collection('budgetData')
      .find({ userId })
      .sort({ year: 1, month: 1 })
      .toArray();

    const reportData: MonthlyDataForReport[] = allData.map(doc => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...data } = doc;
      return data as MonthlyDataForReport;
    });
    
    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Failed to fetch all budget data for user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
