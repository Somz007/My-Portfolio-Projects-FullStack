import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPost, updatePost } from '../api/posts';
import Spinner from '../components/Spinner';

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', coverImage: '', tags: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetchPost(id).then(({ data }) => {
      setForm({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || '',
        coverImage: data.coverImage || '',
        tags: (data.tags || []).join(', '),
      });
      setLoading(false);
    }).catch(() => { setError('Post not found.'); setLoading(false); });
  }, [id]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updatePost(id, { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) });
      navigate(`/posts/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="container container-narrow">
      <h1>Edit Post</h1>
      {error && <p className="error-msg">{error}</p>}
      <form className="post-form" onSubmit={handleSubmit}>
        <label>Title *
          <input className="input" value={form.title} onChange={set('title')} required />
        </label>
        <label>Content *
          <textarea className="input" rows={12} value={form.content} onChange={set('content')} required />
        </label>
        <label>Excerpt
          <input className="input" value={form.excerpt} onChange={set('excerpt')} />
        </label>
        <label>Cover Image URL
          <input className="input" type="url" value={form.coverImage} onChange={set('coverImage')} placeholder="https://..." />
        </label>
        <label>Tags <span className="hint">(comma-separated)</span>
          <input className="input" value={form.tags} onChange={set('tags')} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
