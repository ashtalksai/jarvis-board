import { NextRequest, NextResponse } from 'next/server';
import { getAllTasks, createTask, createActivity } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') || undefined;
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;

  const tasks = getAllTasks(status, category, search);
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const task = createTask(body);
  
  // Log activity
  createActivity({
    action: 'task.create',
    entity_type: 'task',
    entity_id: String(task.id),
    details: {
      title: task.title,
      category: task.category,
      priority: task.priority,
      status: task.status,
    },
  });
  
  return NextResponse.json(task, { status: 201 });
}
