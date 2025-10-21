import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email or password' }, { status: 400 });
    }

    // Mock auth: accept any email where password === 'password'
    if (password === 'password') {
      return NextResponse.json({ ok: true, user: { email } });
    }

    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (err) {
    console.error('Auth route error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
