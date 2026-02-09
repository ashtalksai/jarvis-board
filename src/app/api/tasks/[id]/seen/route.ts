import { NextRequest, NextResponse } from 'next/server';
import { markTaskSeen } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseInt(id);
  
  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  // Default to 'ash' for now - could be expanded to support multiple users
  const userId = 'ash';
  
  await markTaskSeen(taskId, userId);
  
  return NextResponse.json({ success: true });
}
