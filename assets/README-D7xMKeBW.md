---
title: "Next.js : A Practical Intermediate Guide to Full-Stack React Development"
slug: nextjs-a-practical-intermediate-guide-to-full-stack-react-development
date: 2026-04-24
tags: [Next.js, React, JavaScript, TypeScript, SSR, SSG, App Router, Full-Stack]
category: tech
---

# Next.js : A Practical Intermediate Guide to Full-Stack React Development

Next.js is the most popular React meta-framework in the world. Built by Vercel, it extends React with server-side rendering, static site generation, file-based routing, API routes, and much more — all with zero configuration. This guide covers the modern App Router (introduced in Next.js 13 and stable in Next.js 14+), covering the patterns that matter in production applications.

---

## 1. App Router vs Pages Router

Next.js has two routing systems. The **App Router** (`/app` directory) is the modern default and supports React Server Components, nested layouts, and streaming. The **Pages Router** (`/pages` directory) is the legacy system, still widely used.

This guide focuses entirely on the **App Router**.

```
my-app/
├── app/
│   ├── layout.tsx           # Root layout (required)
│   ├── page.tsx             # Home page — renders at "/"
│   ├── loading.tsx          # Loading UI for this segment
│   ├── error.tsx            # Error UI for this segment
│   ├── not-found.tsx        # 404 UI
│   ├── globals.css
│   ├── dashboard/
│   │   ├── layout.tsx       # Dashboard layout (nested)
│   │   ├── page.tsx         # "/dashboard"
│   │   └── settings/
│   │       └── page.tsx     # "/dashboard/settings"
│   └── api/
│       └── users/
│           └── route.ts     # API route — "/api/users"
├── components/
├── lib/
└── public/
```

---

## 2. Layouts and Pages

### Root Layout (Required)

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'My App', template: '%s | My App' },
  description: 'A Next.js application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header>
          <nav>My App</nav>
        </header>
        <main>{children}</main>
        <footer>© 2026</footer>
      </body>
    </html>
  );
}
```

### Nested Layout

```tsx
// app/dashboard/layout.tsx
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <section className="dashboard-content">{children}</section>
    </div>
  );
}
```

### Page Component

```tsx
// app/dashboard/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard', // Becomes "Dashboard | My App" via template
};

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard.</p>
    </div>
  );
}
```

---

## 3. Server Components vs Client Components

This is the most important concept in the App Router. By default, **every component is a Server Component** — it renders on the server and sends HTML to the client, with zero JavaScript shipped for that component.

### Server Component (default)

```tsx
// app/posts/page.tsx — runs on the server
// Can fetch data directly, access databases, use secrets
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts(); // Direct async/await — no useEffect needed

  return (
    <ul>
      {posts.map((post: { id: number; title: string }) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Client Component

Add `'use client'` at the top when you need interactivity, browser APIs, or React hooks:

```tsx
// components/SearchBar.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    });
  }

  return (
    <form onSubmit={handleSearch}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
```

### Mixing Server and Client Components

```tsx
// app/page.tsx — Server Component
import { SearchBar } from '@/components/SearchBar';   // Client Component
import { PostList } from '@/components/PostList';     // Server Component

export default async function HomePage() {
  const featuredPosts = await getFeaturedPosts(); // server-only fetch

  return (
    <div>
      <SearchBar />                          {/* Client — interactive */}
      <PostList posts={featuredPosts} />     {/* Server — static content */}
    </div>
  );
}
```

> **Rule:** Server Components can import Client Components, but Client Components **cannot** import Server Components. You can pass Server Components as `children` props to Client Components.

---

## 4. Dynamic Routes

```tsx
// app/blog/[slug]/page.tsx
interface Props {
  params: { slug: string };
}

async function getPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

// Generate static pages at build time
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());
  return posts.map((post: { slug: string }) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const post = await getPost(params.slug);
  return { title: post?.title ?? 'Post Not Found' };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) return <div>Post not found</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.date}</p>
      <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </article>
  );
}
```

### Catch-all and Optional Catch-all Routes

```
app/docs/[...slug]/page.tsx        → /docs/a/b/c  (params.slug = ['a', 'b', 'c'])
app/docs/[[...slug]]/page.tsx      → /docs         (params.slug = undefined)
                                   → /docs/a/b     (params.slug = ['a', 'b'])
```

---

## 5. API Routes

API routes in the App Router are defined with `route.ts` files and use Web standard `Request` / `Response` objects:

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

const users = [
  { id: 1, name: 'Muhammad', email: 'muhammad@example.com' },
  { id: 2, name: 'Sara', email: 'sara@example.com' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  const filtered = role ? users.filter((u: any) => u.role === role) : users;
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const newUser = { id: users.length + 1, ...body };
  users.push(newUser);
  return NextResponse.json(newUser, { status: 201 });
}
```

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserById(Number(params.id));
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteUser(Number(params.id));
  return new NextResponse(null, { status: 204 });
}
```

---

## 6. Server Actions

Server Actions allow you to run server-side code directly from a component — no API route needed. They are ideal for form submissions and mutations.

```tsx
// app/posts/new/page.tsx
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function createPost(formData: FormData) {
  'use server'; // marks this function as a Server Action

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!title || !content) throw new Error('Title and content are required');

  await db.post.create({ data: { title, content } }); // direct DB access
  revalidatePath('/posts'); // invalidate the posts cache
  redirect('/posts');
}

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Post title" required />
      <textarea name="content" placeholder="Post content" required />
      <button type="submit">Publish Post</button>
    </form>
  );
}
```

### Server Actions with useFormState

```tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createPost } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Publishing...' : 'Publish'}</button>;
}

export function NewPostForm() {
  const [state, action] = useFormState(createPost, { error: null });

  return (
    <form action={action}>
      {state.error && <p className="error">{state.error}</p>}
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <SubmitButton />
    </form>
  );
}
```

---

## 7. Data Fetching Strategies

Next.js supports four rendering strategies, often mixed within the same application:

```tsx
// 1. Static Generation (SSG) — fetched at build time, cached forever
export const dynamic = 'force-static';

// 2. Incremental Static Regeneration (ISR) — revalidate periodically
const res = await fetch('/api/data', { next: { revalidate: 3600 } }); // every hour

// 3. Dynamic Rendering (SSR) — fetched on every request
export const dynamic = 'force-dynamic';
// OR use: cookies(), headers(), searchParams — these opt into dynamic rendering automatically

// 4. On-demand Revalidation — revalidate when data changes
import { revalidatePath, revalidateTag } from 'next/cache';

// Tag a fetch request
const res = await fetch('/api/posts', { next: { tags: ['posts'] } });

// Revalidate it from a Server Action or API route
revalidateTag('posts');
revalidatePath('/blog');
```

---

## 8. Middleware

Middleware runs before a request completes — ideal for authentication, redirects, and A/B testing:

```typescript
// middleware.ts (at the project root)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isProtected = request.nextUrl.pathname.startsWith('/dashboard');

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

---

## 9. Loading and Error UI

```tsx
// app/dashboard/loading.tsx — shown automatically while the page suspends
export default function DashboardLoading() {
  return (
    <div className="skeleton-wrapper">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
    </div>
  );
}

// app/dashboard/error.tsx — shown when an error is thrown in this segment
'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h1>404 — Page Not Found</h1>
      <a href="/">Go Home</a>
    </div>
  );
}
```

---

## 10. Image and Font Optimization

```tsx
// next/image — automatic lazy loading, sizing, and format optimization
import Image from 'next/image';

export function Avatar({ src, name }: { src: string; name: string }) {
  return (
    <Image
      src={src}
      alt={name}
      width={64}
      height={64}
      className="rounded-full"
      priority={false} // set true for above-the-fold images
    />
  );
}

// next/font — zero layout shift, self-hosted automatically
import { Inter, Fira_Code } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 11. Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
NEXT_PUBLIC_API_URL=https://api.example.com   # Exposed to the browser
JWT_SECRET=supersecretkey                      # Server-only
```

```typescript
// Server-only (API routes, Server Components, Server Actions)
const db = process.env.DATABASE_URL;
const secret = process.env.JWT_SECRET;

// Client-accessible (must be prefixed with NEXT_PUBLIC_)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

---

## Conclusion

Next.js with the App Router represents the most complete React development experience available today. Server Components eliminate unnecessary client-side JavaScript. Server Actions remove the need for boilerplate API routes for mutations. The file-system router makes the structure of your application immediately readable. Combined with TypeScript, Tailwind CSS, and a database ORM like Prisma, Next.js provides a full-stack foundation that scales from a weekend project to a production application serving millions of users.

---

*Last updated: April 2026*