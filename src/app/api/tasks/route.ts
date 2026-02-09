import { NextRequest, NextResponse } from 'next/server';
import { getAllTasks, createTask, createActivity } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') || undefined;
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const userId = searchParams.get('userId') || 'ash';

  const tasks = await getAllTasks(status, category, search, userId);
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Map priority string to level if needed
  let priorityLevel = body.priority_level || 2;
  if (body.priority && !body.priority_level) {
    const priorityMap: Record<string, number> = {
      'Low': 1,
      'Medium': 2,
      'High': 3,
      'Urgent': 4,
    };
    priorityLevel = priorityMap[body.priority] || 2;
  }

  const task = await createTask({
    ...body,
    priority_level: priorityLevel,
    status: body.status || 'backlog',
  });
  
  // Log activity
  await createActivity({
    action: 'task.create',
    entity_type: 'task',
    entity_id: String(task.id),
    details: {
      title: task.title,
      category: task.category,
      priority_level: task.priority_level,
      status: task.status,
    },
  });
  
  return NextResponse.json(task, { status: 201 });
}
