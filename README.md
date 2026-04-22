# SocialConnect

A full-stack social media web application built with Next.js, Supabase, and Tailwind CSS. Users can register, create profiles, share posts, like and comment on content, and discover others through a personalized feed.
## Deployment on Vercel
https://socialconnect-lilac.vercel.app/register
## Live Demo

>(https://www.loom.com/share/3ad8275c889543608dd06fc63e6c3a75)

## Features

- JWT-based authentication (register, login, logout)
- User profiles with bio, avatar, location, and website
- Create, edit, and delete posts (text + image upload)
- Like and unlike posts
- Comment on posts and delete own comments
- Chronological public feed
- Image upload to Supabase Storage (JPEG/PNG, max 2MB)
- Fully responsive dark UI

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL via Supabase |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| File Storage | Supabase Storage |
| UI Components | shadcn/ui |

## Project Structure

```
socialconnect/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── posts/
│   │   │   ├── route.ts
│   │   │   └── [post_id]/
│   │   │       ├── route.ts
│   │   │       ├── like/route.ts
│   │   │       └── comments/route.ts
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   ├── me/route.ts
│   │   │   └── [user_id]/route.ts
│   │   ├── feed/route.ts
│   │   ├── upload/route.ts
│   │   └── avatar/route.ts
│   ├── feed/page.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── profile/[username]/page.tsx
├── components/
│   ├── Navbar.tsx
│   └── PostCard.tsx
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── upload.ts
│   └── context.tsx
├── .env.local (not committed)
├── .gitignore
└── README.md
```

## Database Schema

```sql
profiles     - id, username, email, first_name, last_name, bio, avatar_url, website, location, posts_count
posts        - id, content, author_id, image_url, is_active, like_count, comment_count, created_at
likes        - id, user_id, post_id, created_at
comments     - id, content, user_id, post_id, created_at
follows      - id, follower_id, following_id, created_at
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login with email or username |
| POST | /api/auth/logout | Logout user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| GET | /api/users/me | Get own profile |
| PATCH | /api/users/me | Update own profile |
| GET | /api/users/[user_id] | Get user by ID |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/posts | List all posts |
| POST | /api/posts | Create a post |
| GET | /api/posts/[post_id] | Get single post |
| PATCH | /api/posts/[post_id] | Update own post |
| DELETE | /api/posts/[post_id] | Delete own post |

### Interactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/posts/[post_id]/like | Like a post |
| DELETE | /api/posts/[post_id]/like | Unlike a post |
| GET | /api/posts/[post_id]/comments | Get comments |
| POST | /api/posts/[post_id]/comments | Add comment |

### Feed
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/feed | Get chronological feed |

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/socialconnect.git
cd socialconnect
```

2. Install dependencies
```bash
npm install
```

3. Create `.env.local` file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret

4. Set up Supabase database by running the SQL schema in your Supabase SQL Editor

5. Create two public storage buckets in Supabase: `posts-images` and `avatars`

6. Run the development server
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Your Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Your Supabase anon public key |
| SUPABASE_SERVICE_ROLE_KEY | Your Supabase service role key |
| JWT_SECRET | Secret key for signing JWT tokens |
