/**
 * API Route: /api/posts
 * Handles GET (read all) and POST (create) operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { Post, CreatePostPayload, ApiResponse } from '@posts/shared';
import { generateId, getCurrentTimestamp, validatePost } from '@posts/shared';
import { postsStore } from '@/lib/store';

export async function GET(): Promise<NextResponse<ApiResponse<Post[]>>> {
  try {
    const allPosts = postsStore.getAll();
    return NextResponse.json({ data: allPosts });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Post>>> {
  try {
    const body: CreatePostPayload = await request.json();
    
    const validation = validatePost(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const newPost: Post = {
      id: generateId(),
      title: body.title,
      content: body.content,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    postsStore.create(newPost);

    return NextResponse.json({ data: newPost }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

