import { supabase } from './supabase'

export async function uploadImage(file: File, bucket: 'posts-images' | 'avatars') {
  if (!['image/jpeg', 'image/png'].includes(file.type))
    throw new Error('Only JPEG and PNG allowed')
  if (file.size > 2 * 1024 * 1024)
    throw new Error('Max file size is 2MB')

  const ext = file.type === 'image/jpeg' ? 'jpg' : 'png'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(filename, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename)
  return data.publicUrl
}