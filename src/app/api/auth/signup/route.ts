import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email or password' }, { status: 400 });
    }

    if (typeof password === 'string' && password.length < 6) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Mock creation: in a real app you'd check for existing users and persist to DB
    console.log('Mock create user:', { name, email });

    return NextResponse.json({ ok: true, user: { name, email } }, { status: 201 });
  } catch (err) {
    console.error('Signup route error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
