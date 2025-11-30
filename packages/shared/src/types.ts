/**
 * Post interface - represents a text post in the system
 */
export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create post payload - data required to create a new post
 */
export interface CreatePostPayload {
  title: string;
  content: string;
}

/**
 * Update post payload - data for full update (PUT)
 */
export interface UpdatePostPayload {
  title: string;
  content: string;
}

/**
 * Partial update post payload - data for partial update (PATCH)
 */
export interface PartialUpdatePostPayload {
  title?: string;
  content?: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

