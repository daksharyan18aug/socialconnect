'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/context'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'

export default function ProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '', last_name: '', bio: '',
    website: '', location: '', avatar_url: ''
  })
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // ── Follow state ──────────────────────────────────────────
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    const res = await fetch(`/api/users?username=${username}`)
    const data = await res.json()

    const found = data.users?.find((u: any) => u.username === username)
    if (!found) { router.push('/feed'); return }

    setProfile(found)
    setEditForm({
      first_name: found.first_name || '',
      last_name: found.last_name || '',
      bio: found.bio || '',
      website: found.website || '',
      location: found.location || '',
      avatar_url: found.avatar_url || ''
    })

    const postsRes = await fetch('/api/posts')
    const postsData = await postsRes.json()
    const userPosts = postsData.posts?.filter((p: any) => p.profiles?.username === username) || []
    setPosts(userPosts)

    // ── Fetch followers/following counts ──────────────────
    const [followersRes, followingRes] = await Promise.all([
      fetch(`/api/users/${found.id}/followers`),
      fetch(`/api/users/${found.id}/following`)
    ])
    const followersData = await followersRes.json()
    const followingData = await followingRes.json()

    setFollowersCount(followersData.count || 0)
    setFollowingCount(followingData.count || 0)

    // ── FIX: use user.userId instead of user.id ──────────
    if (user?.userId) {
      const alreadyFollowing = followersData.followers?.some(
        (f: any) => f.follower?.id === user.userId
      )
      setIsFollowing(!!alreadyFollowing)
    }
    // ─────────────────────────────────────────────────────

    setLoading(false)
  }

  // ── Follow / Unfollow handler ─────────────────────────────
  const handleFollowToggle = async () => {
    if (!user) { router.push('/login'); return }
    setFollowLoading(true)
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/users/${profile?.id}/follow`, {
        method,
        headers: { Authorization: `Bearer ${user.token}` }
      })
      if (res.ok) {
        setIsFollowing(prev => !prev)
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1)
      }
    } catch (err) {
      console.error('Follow toggle error:', err)
    } finally {
      setFollowLoading(false)
    }
  }
  // ─────────────────────────────────────────────────────────

  const handleAvatarUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user?.token}` },
      body: formData
    })
    const data = await res.json()
    return data.url || null
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    let avatar_url = editForm.avatar_url
    if (avatarFile) {
      const uploaded = await handleAvatarUpload(avatarFile)
      if (uploaded) avatar_url = uploaded
    }

    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({ ...editForm, avatar_url })
    })

    const data = await res.json()
    if (res.ok) {
      setProfile({ ...profile, ...data.user })
      setEditing(false)
    }
    setSaving(false)
  }

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const isOwnProfile = user?.username === username

  if (loading) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="text-center text-gray-400 py-20">Loading profile...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Profile Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.username?.[0]?.toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <p className="text-gray-400 text-sm">@{profile?.username}</p>

                {/* ── Follower / Following counts ── */}
                <div className="flex gap-4 mt-1">
                  <span className="text-gray-400 text-xs">
                    <span className="text-white font-semibold">{followersCount}</span> Followers
                  </span>
                  <span className="text-gray-400 text-xs">
                    <span className="text-white font-semibold">{followingCount}</span> Following
                  </span>
                  <span className="text-gray-400 text-xs">
                    <span className="text-white font-semibold">{profile?.posts_count || posts.length}</span> Posts
                  </span>
                </div>
                {/* ─────────────────────────────── */}

              </div>
            </div>

            {/* ── Edit button (own) OR Follow button (others) ── */}
            <div className="flex flex-col items-end gap-2">
              {isOwnProfile && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-xl transition"
                >
                  Edit Profile
                </button>
              )}
              {!isOwnProfile && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`text-sm px-5 py-2 rounded-xl font-semibold transition-all disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-gray-700 hover:bg-red-900 hover:text-red-400 text-white border border-gray-600'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
            {/* ─────────────────────────────────────────────── */}

          </div>

          {!editing ? (
            <div className="mt-4 space-y-2">
              {profile?.bio && <p className="text-gray-300 text-sm">{profile.bio}</p>}
              {profile?.location && <p className="text-gray-400 text-sm">📍 {profile.location}</p>}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noreferrer"
                  className="text-blue-400 text-sm hover:underline">
                  🔗 {profile.website}
                </a>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-gray-400 text-xs mb-1 block">First Name</label>
                  <input
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                    value={editForm.first_name}
                    onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-gray-400 text-xs mb-1 block">Last Name</label>
                  <input
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                    value={editForm.last_name}
                    onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Bio (max 160 chars)</label>
                <textarea
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 text-sm resize-none"
                  rows={2}
                  maxLength={160}
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Location</label>
                <input
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                  value={editForm.location}
                  onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Website</label>
                <input
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                  value={editForm.website}
                  onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Profile Picture</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="text-gray-400 text-sm"
                  onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-xl transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-5 py-2 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Posts */}
        <h2 className="text-white font-semibold mb-4">Posts</h2>
        {posts.length === 0 ? (
          <div className="text-center text-gray-400 py-10">No posts yet</div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
          ))
        )}
      </div>
    </div>
  )
}