'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/context'
import Link from 'next/link'

interface Post {
  id: string
  content: string
  image_url?: string
  like_count: number
  comment_count: number
  created_at: string
  author_id: string
  profiles: {
    username: string
    avatar_url?: string
    first_name?: string
    last_name?: string
  }
}

export default function PostCard({ post, onDelete }: { post: Post; onDelete?: (id: string) => void }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComment, setLoadingComment] = useState(false)

  const handleLike = async () => {
    if (!user) return
    const method = liked ? 'DELETE' : 'POST'
    const res = await fetch(`/api/posts/${post.id}/like`, {
      method,
      headers: { Authorization: `Bearer ${user.token}` }
    })
    if (res.ok) {
      setLiked(!liked)
      setLikeCount(prev => liked ? prev - 1 : prev + 1)
    }
  }

  const loadComments = async () => {
    if (showComments) {
      setShowComments(false)
      return
    }
    const res = await fetch(`/api/posts/${post.id}/comments`)
    const data = await res.json()
    setComments(data.comments || [])
    setShowComments(true)
  }

  const handleComment = async () => {
    if (!user || !newComment.trim()) return
    setLoadingComment(true)
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({ content: newComment })
    })
    const data = await res.json()
    if (res.ok) {
      setComments(prev => [...prev, data.comment])
      setNewComment('')
    }
    setLoadingComment(false)
  }

  const handleDelete = async () => {
    if (!user) return
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user.token}` }
    })
    if (res.ok && onDelete) onDelete(post.id)
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Link href={`/profile/${post.profiles?.username}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              post.profiles?.username?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {post.profiles?.first_name} {post.profiles?.last_name}
            </p>
            <p className="text-gray-400 text-xs">@{post.profiles?.username}</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">{timeAgo(post.created_at)}</span>
          {user?.userId === post.author_id && (
            <button
              onClick={handleDelete}
              className="text-gray-500 hover:text-red-400 text-xs transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-100 text-sm leading-relaxed mb-3">{post.content}</p>

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="post"
          className="w-full rounded-xl mb-3 max-h-96 object-cover"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-2 border-t border-gray-800">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition ${liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likeCount}</span>
        </button>

        <button
          onClick={loadComments}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition"
        >
          <span>💬</span>
          <span>{post.comment_count || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 space-y-3">
          {comments.length === 0 && (
            <p className="text-gray-500 text-sm">No comments yet</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {c.profiles?.username?.[0]?.toUpperCase()}
              </div>
              <div className="bg-gray-800 rounded-xl px-3 py-2 flex-1">
                <p className="text-blue-400 text-xs font-semibold mb-1">@{c.profiles?.username}</p>
                <p className="text-gray-200 text-sm">{c.content}</p>
              </div>
            </div>
          ))}

          {user && (
            <div className="flex gap-2 mt-3">
              <input
                className="flex-1 bg-gray-800 text-white text-sm rounded-xl px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500"
                placeholder="Write a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                disabled={loadingComment}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 rounded-xl transition"
              >
                Post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}