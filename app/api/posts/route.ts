import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10
    const from = (page - 1) * limit

    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url, first_name, last_name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ posts: data, page })

  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    const user = token ? verifyToken(token) : null
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, image_url } = await req.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.length > 280) {
      return NextResponse.json({ error: 'Content max 280 characters' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        content: content.trim(),
        image_url: image_url || null,
        author_id: user.userId,
        is_active: true,
        like_count: 0,
        comment_count: 0
      })
      .select('*, profiles(username, avatar_url, first_name, last_name)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: profile } = await supabase
  .from('profiles')
  .select('posts_count')
  .eq('id', user.userId)
  .single()

await supabase
  .from('profiles')
  .update({ posts_count: (profile?.posts_count || 0) + 1 })
  .eq('id', user.userId)

    return NextResponse.json({ post: data }, { status: 201 })

  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}