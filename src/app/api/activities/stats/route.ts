import { NextResponse } from 'next/server';
import { getActivityStats } from '@/lib/db';

export async function GET() {
  const stats = getActivityStats();
  return NextResponse.json(stats);
}
