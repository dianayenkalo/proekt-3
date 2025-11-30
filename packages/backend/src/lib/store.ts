/**
 * In-memory store for posts
 * This simulates a database by storing posts in memory
 */

import { Post } from '@posts/shared';

class PostsStore {
  private posts: Map<string, Post> = new Map();

  /**
   * Get all posts
   */
  getAll(): Post[] {
    return Array.from(this.posts.values());
  }

  /**
   * Get a post by ID
   */
  getById(id: string): Post | undefined {
    return this.posts.get(id);
  }

  /**
   * Create a new post
   */
  create(post: Post): void {
    this.posts.set(post.id, post);
  }

  /**
   * Update an existing post
   */
  update(id: string, post: Post): void {
    if (!this.posts.has(id)) {
      throw new Error('Post not found');
    }
    this.posts.set(id, post);
  }

  /**
   * Delete a post
   */
  delete(id: string): void {
    if (!this.posts.has(id)) {
      throw new Error('Post not found');
    }
    this.posts.delete(id);
  }
}

// Singleton instance
export const postsStore = new PostsStore();

