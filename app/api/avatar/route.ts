import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function POST(req: Request) {
  const token = getTokenFromRequest(req)
  const user = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!['image/jpeg', 'image/png'].includes(file.type))
    return NextResponse.json({ error: 'Only JPEG and PNG allowed' }, { status: 400 })

  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: 'Max file size is 2MB' }, { status: 400 })

  const ext = file.type === 'image/jpeg' ? 'jpg' : 'png'
  const filename = `${user.userId}-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from('avatars').getPublicUrl(filename)

  await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', user.userId)

  return NextResponse.json({ url: data.publicUrl })
}