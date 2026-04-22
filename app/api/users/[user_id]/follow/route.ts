import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id: followingId } = await params

    const token = getTokenFromRequest(request)
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = verifyToken(token)
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (currentUser.userId === followingId) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('follows')
      .insert({ follower_id: currentUser.userId, following_id: followingId })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already following' }, { status: 200 })
      }
      throw error
    }

    return NextResponse.json({ message: 'Followed successfully', follow: data }, { status: 201 })
  } catch (error: any) {
    console.error('Follow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id: followingId } = await params

    const token = getTokenFromRequest(request)
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = verifyToken(token)
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUser.userId)
      .eq('following_id', followingId)

    if (error) throw error

    return NextResponse.json({ message: 'Unfollowed successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Unfollow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}