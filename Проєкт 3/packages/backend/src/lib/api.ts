/**
 * API client for posts
 * Uses axios to make HTTP requests to the backend API
 */

import axios from 'axios';
import {
  Post,
  CreatePostPayload,
  UpdatePostPayload,
  PartialUpdatePostPayload,
  ApiResponse,
} from '@posts/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const postsApi = {
  /**
   * GET /api/posts - Get all posts
   */
  async getAll(): Promise<ApiResponse<Post[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Post[]>>('/posts');
      return response.data;
    } catch (error: any) {
      return {
        error: error.response?.data?.error || 'Failed to fetch posts',
      };
    }
  },

  /**
   * GET /api/posts/[id] - Get a single post by ID
   */
  async getById(id: string): Promise<ApiResponse<Post>> {
    try {
      const response = await apiClient.get<ApiResponse<Post>>(`/posts/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        error: error.response?.data?.error || 'Failed to fetch post',
      };
    }
  },

  /**
   * POST /api/posts - Create a new post
   */
  async create(payload: CreatePostPayload): Promise<ApiResponse<Post>> {
    try {
      const response = await apiClient.post<ApiResponse<Post>>('/posts', payload);
      return response.data;
    } catch (error: any) {
      return {
        error: error.response?.data?.error || 'Failed to create post',
      };
    }
  },

  /**
   * PUT /api/posts/[id] - Full update of a post
   */
  async fullUpdate(id: string, payload: UpdatePostPayload): Promise<ApiResponse<Post>> {
    try {
      const response = await apiClient.put<ApiResponse<Post>>(`/posts/${id}`, payload);
      return response.data;
    } catch (error: any) {
      return {
        error: error.response?.data?.error || 'Failed to update post',
      };
    }
  },

  /**
   * PATCH /api/posts/[id] - Partial update of a post
   */
  async partialUpdate(
    id: string,
    payload: PartialUpdatePostPayload
  ): Promise<ApiResponse<Post>> {
    try {
      const response = await apiClient.patch<ApiResponse<Post>>(`/posts/${id}`, payload);
      return response.data;
    } catch (error: any) {
      return {
        error: error.response?.data?.error || 'Failed to partially update post',
      };
    }
  },

  /**
   * DELETE /api/posts/[id] - Delete a post
   */
  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    try {
      const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/posts/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        error: error.response?.data?.error || 'Failed to delete post',
      };
    }
  },
};

