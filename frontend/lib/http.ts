import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';

export async function parseJson<T>(req: Request, schema: ZodSchema<T>): Promise<T | NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  try {
    return schema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: e.flatten() }, { status: 400 });
    }
    throw e;
  }
}

export function ok<T extends object>(data: T = {} as T) {
  return NextResponse.json({ ok: true, ...data });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
