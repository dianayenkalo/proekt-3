'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Post, CreatePostPayload, UpdatePostPayload, PartialUpdatePostPayload } from '@posts/shared';
import { postsApi } from '@/lib/api';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
`;

const Header = styled.h1`
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;

  ${(props) => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: #3498db;
          color: white;
          &:hover {
            background-color: #2980b9;
          }
        `;
      case 'danger':
        return `
          background-color: #e74c3c;
          color: white;
          &:hover {
            background-color: #c0392b;
          }
        `;
      default:
        return `
          background-color: #95a5a6;
          color: white;
          &:hover {
            background-color: #7f8c8d;
          }
        `;
    }
  }}
`;

const PostCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const PostTitle = styled.h2`
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
`;

const PostContent = styled.p`
  color: #555;
  margin: 0 0 1rem 0;
  line-height: 1.6;
`;

const PostMeta = styled.div`
  font-size: 0.875rem;
  color: #888;
  margin-bottom: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Form = styled.form`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ErrorMessage = styled.div`
  background-color: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #fcc;
`;

const SuccessMessage = styled.div`
  background-color: #efe;
  color: #3c3;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #cfc;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 2rem;
  color: #888;
`;

export function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  // Fetch all posts on mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postsApi.getAll();
      if (response.data) {
        setPosts(response.data);
      } else {
        setError(response.error || 'Failed to load posts');
      }
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      const payload: CreatePostPayload = {
        title: formData.title,
        content: formData.content,
      };
      const response = await postsApi.create(payload);
      if (response.data) {
        setSuccess('Post created successfully!');
        setFormData({ title: '', content: '' });
        await loadPosts();
      } else {
        setError(response.error || 'Failed to create post');
      }
    } catch (err) {
      setError('Failed to create post');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      const response = await postsApi.delete(id);
      if (response.data || response.message) {
        setSuccess('Post deleted successfully!');
        await loadPosts();
      } else {
        setError(response.error || 'Failed to delete post');
      }
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  const handleStartEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({ title: post.title, content: post.content });
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setFormData({ title: '', content: '' });
  };

  const handleFullUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      setError(null);
      setSuccess(null);
      const payload: UpdatePostPayload = {
        title: formData.title,
        content: formData.content,
      };
      const response = await postsApi.fullUpdate(editingPost.id, payload);
      if (response.data) {
        setSuccess('Post updated successfully!');
        setEditingPost(null);
        setFormData({ title: '', content: '' });
        await loadPosts();
      } else {
        setError(response.error || 'Failed to update post');
      }
    } catch (err) {
      setError('Failed to update post');
    }
  };

  const handlePartialUpdate = async (field: 'title' | 'content', value: string) => {
    if (!editingPost) return;
    try {
      setError(null);
      setSuccess(null);
      const payload: PartialUpdatePostPayload = { [field]: value };
      const response = await postsApi.partialUpdate(editingPost.id, payload);
      if (response.data) {
        setSuccess(`Post ${field} updated successfully!`);
        await loadPosts();
      } else {
        setError(response.error || 'Failed to update post');
      }
    } catch (err) {
      setError('Failed to update post');
    }
  };

  if (loading && posts.length === 0) {
    return (
      <Container>
        <LoadingSpinner>Loading posts...</LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>Posts Management</Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <Form onSubmit={editingPost ? handleFullUpdate : handleCreate}>
        <FormTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</FormTitle>
        <Input
          type="text"
          placeholder="Post title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <TextArea
          placeholder="Post content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
        />
        <ButtonGroup>
          <Button type="submit" variant="primary">
            {editingPost ? 'Update Post (PUT)' : 'Create Post'}
          </Button>
          {editingPost && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handlePartialUpdate('title', formData.title)}
              >
                Update Title Only (PATCH)
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handlePartialUpdate('content', formData.content)}
              >
                Update Content Only (PATCH)
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </>
          )}
        </ButtonGroup>
      </Form>

      <div>
        <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>All Posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <p style={{ color: '#888' }}>No posts yet. Create your first post above!</p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id}>
              <PostTitle>{post.title}</PostTitle>
              <PostContent>{post.content}</PostContent>
              <PostMeta>
                Created: {new Date(post.createdAt).toLocaleString()} |{' '}
                Updated: {new Date(post.updatedAt).toLocaleString()}
              </PostMeta>
              <ButtonGroup>
                <Button variant="secondary" onClick={() => handleStartEdit(post)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(post.id)}>
                  Delete
                </Button>
              </ButtonGroup>
            </PostCard>
          ))
        )}
      </div>
    </Container>
  );
}

