import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params

    const { data, error } = await supabase
      .from('follows')
      .select(`
        created_at,
        follower:profiles!follows_follower_id_fkey (
          id, username, first_name, last_name, avatar_url
        )
      `)
      .eq('following_id', user_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ followers: data, count: data.length })
  } catch (error: any) {
    console.error('Followers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}