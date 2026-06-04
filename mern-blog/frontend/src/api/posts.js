// All API functions for posts and comments.
// Every function just calls the axios instance — the interceptor adds the token.
import api from './axios';

// ── Posts ─────────────────────────────────────────────────────
export const fetchPosts    = (params = {}) => api.get('/posts', { params });
export const fetchPost     = (id)          => api.get(`/posts/${id}`);
export const createPost    = (data)        => api.post('/posts', data);
export const updatePost    = (id, data)    => api.put(`/posts/${id}`, data);
export const deletePost    = (id)          => api.delete(`/posts/${id}`);
export const toggleLike    = (id)          => api.put(`/posts/${id}/like`);

// ── Comments ─────────────────────────────────────────────────
export const fetchComments = (postId)      => api.get(`/posts/${postId}/comments`);
export const addComment    = (postId, data)=> api.post(`/posts/${postId}/comments`, data);
export const deleteComment = (id)          => api.delete(`/comments/${id}`);
