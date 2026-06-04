import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../api/posts';

export default function CreatePost() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', coverImage: '', tags: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const { data } = await createPost(payload);
      navigate(`/posts/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container container-narrow">
      <h1>New Post</h1>
      {error && <p className="error-msg">{error}</p>}
      <form className="post-form" onSubmit={handleSubmit}>
        <label>Title *
          <input className="input" value={form.title} onChange={set('title')} required />
        </label>
        <label>Content *
          <textarea className="input" rows={12} value={form.content} onChange={set('content')} required />
        </label>
        <label>Excerpt <span className="hint">(auto-generated from content if left blank)</span>
          <input className="input" value={form.excerpt} onChange={set('excerpt')} />
        </label>
        <label>Cover Image URL
          <input className="input" type="url" value={form.coverImage} onChange={set('coverImage')} placeholder="https://..." />
        </label>
        <label>Tags <span className="hint">(comma-separated, e.g. react, javascript)</span>
          <input className="input" value={form.tags} onChange={set('tags')} placeholder="react, javascript, tutorial" />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Publishing…' : 'Publish Post'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
