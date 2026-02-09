import { NextRequest, NextResponse } from 'next/server';
import { getComments, createComment, createActivity } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseInt(id);
  
  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const comments = await getComments(taskId);
  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseInt(id);
  
  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const body = await request.json();
  const { content, author } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  if (!author || !['ash', 'jarvis'].includes(author)) {
    return NextResponse.json({ error: 'Valid author (ash or jarvis) is required' }, { status: 400 });
  }

  const comment = await createComment(taskId, author, content.trim());

  // Log activity
  await createActivity({
    action: 'task.comment',
    entity_type: 'task',
    entity_id: String(taskId),
    details: {
      author,
      preview: content.slice(0, 100),
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
