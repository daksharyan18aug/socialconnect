'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/context'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'

export default function FeedPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [posting, setPosting] = useState(false)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const res = await fetch('/api/posts')
    const data = await res.json()
    setPosts(data.posts || [])
    setLoading(false)
  }

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user?.token}` },
      body: formData
    })
    const data = await res.json()
    return data.url || null
  }

  const handlePost = async () => {
    if (!user || !content.trim()) return
    setPosting(true)

    let image_url = null
    if (image) {
      image_url = await handleImageUpload(image)
    }

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({ content, image_url })
    })

    const data = await res.json()
    if (res.ok) {
      setPosts(prev => [data.post, ...prev])
      setContent('')
      setImage(null)
      setCharCount(0)
    }
    setPosting(false)
  }

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Create Post */}
        {user && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
            <h2 className="text-white font-semibold mb-3">Create Post</h2>
            <textarea
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-blue-500 resize-none text-sm"
              placeholder="What's on your mind?"
              rows={3}
              maxLength={280}
              value={content}
              onChange={e => {
                setContent(e.target.value)
                setCharCount(e.target.value.length)
              }}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-gray-400 hover:text-blue-400 text-sm transition">
                  📷 Add Image
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={e => setImage(e.target.files?.[0] || null)}
                  />
                </label>
                {image && (
                  <span className="text-green-400 text-xs">{image.name}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${charCount > 250 ? 'text-red-400' : 'text-gray-500'}`}>
                  {charCount}/280
                </span>
                <button
                  onClick={handlePost}
                  disabled={posting || !content.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-xl transition"
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p className="text-lg mb-2">No posts yet</p>
            <p className="text-sm">Be the first to post something!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  )
}