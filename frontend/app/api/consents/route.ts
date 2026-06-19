import { NextResponse } from 'next/server';
import { listConsents } from '@/lib/server/billingStore';

export async function GET() {
  return NextResponse.json({ consents: listConsents() });
}
