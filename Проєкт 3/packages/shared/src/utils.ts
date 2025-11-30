/**
 * Utility functions for the posts application
 */

/**
 * Generate a unique ID for posts
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validate post data
 */
export function validatePost(data: { title?: string; content?: string }): {
  valid: boolean;
  error?: string;
} {
  if (data.title !== undefined && (!data.title || data.title.trim().length === 0)) {
    return { valid: false, error: 'Title cannot be empty' };
  }
  if (data.content !== undefined && (!data.content || data.content.trim().length === 0)) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  return { valid: true };
}

