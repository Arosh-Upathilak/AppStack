import { NextResponse } from 'next/server';
import { setPrimary } from '@/lib/server/billingStore';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  setPrimary(id);
  return NextResponse.json({ ok: true });
}
