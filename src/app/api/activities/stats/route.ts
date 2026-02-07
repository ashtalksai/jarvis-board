import { NextResponse } from 'next/server';
import { getActivityStats } from '@/lib/db';

export async function GET() {
  const stats = await getActivityStats();
  return NextResponse.json(stats);
}
