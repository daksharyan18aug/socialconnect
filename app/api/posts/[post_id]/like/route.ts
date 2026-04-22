import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: Promise<{ post_id: string }> }) {
  const { post_id } = await params
  const token = getTokenFromRequest(req)
  const user = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('likes')
    .insert({ user_id: user.userId, post_id })

  if (error) return NextResponse.json({ error: 'Already liked' }, { status: 409 })

  const { data: post } = await supabase
    .from('posts')
    .select('like_count')
    .eq('id', post_id)
    .single()

  await supabase
    .from('posts')
    .update({ like_count: (post?.like_count || 0) + 1 })
    .eq('id', post_id)

  return NextResponse.json({ liked: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ post_id: string }> }) {
  const { post_id } = await params
  const token = getTokenFromRequest(req)
  const user = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('likes')
    .delete()
    .eq('user_id', user.userId)
    .eq('post_id', post_id)

  const { data: post } = await supabase
    .from('posts')
    .select('like_count')
    .eq('id', post_id)
    .single()

  await supabase
    .from('posts')
    .update({ like_count: Math.max((post?.like_count || 1) - 1, 0) })
    .eq('id', post_id)

  return NextResponse.json({ liked: false })
}