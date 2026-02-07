import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, deleteTask, createActivity } from '@/lib/db';

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
  const task = await updateTask(taskId, body);
  
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Log activity
  const changes: Record<string, any> = {};
  if (previousTask) {
    Object.keys(body).forEach(key => {
      if (previousTask[key as keyof typeof previousTask] !== body[key]) {
        changes[key] = {
          from: previousTask[key as keyof typeof previousTask],
          to: body[key]
        };
      }
    });
  }

  await createActivity({
    action: body.status && previousTask?.status !== body.status ? 'task.status_change' : 'task.update',
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
