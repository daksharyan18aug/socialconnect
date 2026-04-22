import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: Promise<{ post_id: string }> }) {
  const { post_id } = await params

  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url, first_name, last_name)')
    .eq('id', post_id)
    .eq('is_active', true)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json({ post: data })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ post_id: string }> }) {
  const { post_id } = await params
  const token = getTokenFromRequest(req)
  const user = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, image_url } = await req.json()

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', post_id)
    .single()

  if (!post || post.author_id !== user.userId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('posts')
    .update({ content, image_url, updated_at: new Date().toISOString() })
    .eq('id', post_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ post_id: string }> }) {
  const { post_id } = await params
  const token = getTokenFromRequest(req)
  const user = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', post_id)
    .single()

  if (!post || post.author_id !== user.userId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabase
    .from('posts')
    .update({ is_active: false })
    .eq('id', post_id)

  return NextResponse.json({ message: 'Post deleted' })
}