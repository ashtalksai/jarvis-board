import { NextRequest, NextResponse } from 'next/server';
import { getActivities, createActivity, type ActivityFilters } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  
  const filters: ActivityFilters = {};
  
  if (searchParams.has('action')) {
    filters.action = searchParams.get('action')!;
  }
  if (searchParams.has('entity_type')) {
    filters.entity_type = searchParams.get('entity_type')!;
  }
  if (searchParams.has('entity_id')) {
    filters.entity_id = searchParams.get('entity_id')!;
  }
  if (searchParams.has('start_date')) {
    filters.start_date = searchParams.get('start_date')!;
  }
  if (searchParams.has('end_date')) {
    filters.end_date = searchParams.get('end_date')!;
  }
  if (searchParams.has('limit')) {
    filters.limit = parseInt(searchParams.get('limit')!, 10);
  }
  if (searchParams.has('offset')) {
    filters.offset = parseInt(searchParams.get('offset')!, 10);
  }

  const activities = await getActivities(filters);
  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.action?.trim()) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const activity = await createActivity({
      action: body.action,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      details: body.details,
      session_id: body.session_id,
      tokens_used: body.tokens_used,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
