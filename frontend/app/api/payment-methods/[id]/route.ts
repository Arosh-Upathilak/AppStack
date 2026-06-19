import { NextResponse } from 'next/server';
import { removeMethod } from '@/lib/server/billingStore';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  removeMethod(id);
  return NextResponse.json({ ok: true });
}
