import { NextResponse } from 'next/server';
import { addMethod, listMethods, luhnValid } from '@/lib/server/billingStore';

export async function GET() {
  return NextResponse.json({ methods: listMethods(), stripeEnabled: false });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const digits = String(body?.number ?? '').replace(/\D/g, '');
  if (!digits) {
    return NextResponse.json({ error: 'Card number is required.' }, { status: 400 });
  }
  if (!luhnValid(digits)) {
    return NextResponse.json({ error: 'That card number looks invalid. Use a Luhn-valid test number (e.g. 4242 4242 4242 4242).' }, { status: 400 });
  }
  const expMonth = Number(body?.expMonth);
  const expYear = Number(body?.expYear);
  if (!expMonth || expMonth < 1 || expMonth > 12 || !expYear) {
    return NextResponse.json({ error: 'Enter a valid expiry date (MM/YY).' }, { status: 400 });
  }
  const method = addMethod({ number: digits, expMonth, expYear, setAsPrimary: !!body?.setAsPrimary });
  return NextResponse.json({ ok: true, method });
}
