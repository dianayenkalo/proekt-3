/**
 * API Route: /api/posts/[id]
 * Handles GET (read one), PUT (full update), PATCH (partial update), and DELETE operations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Post,
  UpdatePostPayload,
  PartialUpdatePostPayload,
  ApiResponse,
} from '@posts/shared';
import { getCurrentTimestamp, validatePost } from '@posts/shared';
import { postsStore } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Post>>> {
  try {
    const post = postsStore.getById(params.id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: post });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Post>>> {
  try {
    const post = postsStore.getById(params.id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const body: UpdatePostPayload = await request.json();
    
    const validation = validatePost(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const updatedPost: Post = {
      ...post,
      title: body.title,
      content: body.content,
      updatedAt: getCurrentTimestamp(),
    };

    postsStore.update(params.id, updatedPost);

    return NextResponse.json({ data: updatedPost });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Post>>> {
  try {
    const post = postsStore.getById(params.id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const body: PartialUpdatePostPayload = await request.json();
    
    if (body.title !== undefined || body.content !== undefined) {
      const validation = validatePost({
        title: body.title ?? post.title,
        content: body.content ?? post.content,
      });
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    const updatedPost: Post = {
      ...post,
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      updatedAt: getCurrentTimestamp(),
    };

    postsStore.update(params.id, updatedPost);

    return NextResponse.json({ data: updatedPost });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to partially update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const post = postsStore.getById(params.id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    postsStore.delete(params.id);

    return NextResponse.json(
      { data: { id: params.id }, message: 'Post deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

