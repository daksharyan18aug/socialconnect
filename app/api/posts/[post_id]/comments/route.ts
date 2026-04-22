import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: Promise<{ post_id: string }> }) {
  const { post_id } = await params

  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('post_id', post_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data })
}

export async function POST(req: Request, { params }: { params: Promise<{ post_id: string }> }) {
  const { post_id } = await params
  const token = getTokenFromRequest(req)
  const user = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content || content.trim().length === 0)
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })

  const { data, error } = await supabase
    .from('comments')
    .insert({ content: content.trim(), user_id: user.userId, post_id })
    .select('*, profiles(username, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: post } = await supabase
    .from('posts')
    .select('comment_count')
    .eq('id', post_id)
    .single()

  await supabase
    .from('posts')
    .update({ comment_count: (post?.comment_count || 0) + 1 })
    .eq('id', post_id)

  return NextResponse.json({ comment: data }, { status: 201 })
}