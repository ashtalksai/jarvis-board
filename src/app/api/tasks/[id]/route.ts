import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, deleteTask, createActivity } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseInt(id);
  
  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const task = await getTaskById(taskId);
  
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseInt(id);
  
  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const previousTask = await getTaskById(taskId);
  const body = await request.json();
  
  // Handle priority mapping if needed
  if (body.priority && !body.priority_level) {
    const priorityMap: Record<string, number> = {
      'Low': 1,
      'Medium': 2,
      'High': 3,
      'Urgent': 4,
    };
    body.priority_level = priorityMap[body.priority] || 2;
  }
  
  const task = await updateTask(taskId, body);
  
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Log activity
  const changes: Record<string, any> = {};
  if (previousTask) {
    const fieldsToTrack = ['title', 'description', 'category', 'priority_level', 'status', 'due_date', 'eta', 'tags'];
    fieldsToTrack.forEach(key => {
      const prevValue = previousTask[key as keyof typeof previousTask];
      const newValue = body[key];
      if (newValue !== undefined && JSON.stringify(prevValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          from: prevValue,
          to: newValue
        };
      }
    });
  }

  const isStatusChange = body.status && previousTask?.status !== body.status;

  await createActivity({
    action: isStatusChange ? 'task.status_change' : 'task.update',
    entity_type: 'task',
    entity_id: String(taskId),
    details: {
      title: task.title,
      changes,
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseInt(id);
  
  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const task = await getTaskById(taskId);
  const deleted = await deleteTask(taskId);
  
  if (!deleted) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Log activity
  if (task) {
    await createActivity({
      action: 'task.delete',
      entity_type: 'task',
      entity_id: String(taskId),
      details: {
        title: task.title,
        category: task.category,
      },
    });
  }

  return NextResponse.json({ success: true });
}
