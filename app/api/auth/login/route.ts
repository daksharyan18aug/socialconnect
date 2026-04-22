import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { signToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, username, password } = await req.json()

    let loginEmail = email

    if (!loginEmail && username) {
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .single()

      if (!data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      loginEmail = data.email
    }

    if (!loginEmail) {
      return NextResponse.json({ error: 'Email or username required' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    })

    if (error) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    const token = signToken({ userId: data.user.id, username: profile.username })

    return NextResponse.json({ token, user: profile })

  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}