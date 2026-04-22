import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: Request, { params }: { params: Promise<{ user_id: string }> }) {
  const { user_id } = await params

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, bio, avatar_url, website, location, posts_count, created_at')
    .eq('id', user_id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ user: data })
}