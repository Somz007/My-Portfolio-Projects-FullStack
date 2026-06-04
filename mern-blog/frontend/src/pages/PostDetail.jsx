import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPost, toggleLike, fetchComments, addComment, deleteComment, deletePost } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost]         = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetchPost(id),
          fetchComments(id),
        ]);
        setPost(postRes.data);
        setComments(commentsRes.data.comments);
      } catch {
        setError('Post not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    setLikeLoading(true);
    try {
      const { data } = await toggleLike(id);
      setPost((p) => ({ ...p, likeCount: data.likeCount, liked: data.liked }));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      const { data } = await addComment(id, { content: newComment });
      setComments((c) => [...c, data]);
      setNewComment('');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    await deleteComment(commentId);
    setComments((c) => c.filter((x) => x._id !== commentId));
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    await deletePost(id);
    navigate('/');
  };

  if (loading) return <Spinner />;
  if (error) return <div className="container"><p className="error-msg">{error}</p></div>;

  const date = new Date(post.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  const isAuthor = user?._id === post.author?._id;

  return (
    <div className="container container-narrow">
      {post.coverImage && <img src={post.coverImage} alt={post.title} className="post-cover" />}

      <div className="post-tags">
        {post.tags?.map((t) => <span key={t} className="tag">{t}</span>)}
      </div>

      <h1 className="post-title">{post.title}</h1>

      <div className="post-meta">
        <span>By <strong>{post.author?.name}</strong></span>
        <span>{date}</span>
      </div>

      <div className="post-content">{post.content}</div>

      <div className="post-actions">
        <button
          className={`btn ${post.liked ? 'btn-primary' : 'btn-outline'}`}
          onClick={handleLike}
          disabled={likeLoading}
        >
          {post.liked ? '❤️' : '🤍'} {post.likeCount ?? 0} {post.likeCount === 1 ? 'Like' : 'Likes'}
        </button>
        {isAuthor && (
          <div className="author-actions">
            <Link to={`/posts/${post._id}/edit`} className="btn btn-outline">Edit</Link>
            <button onClick={handleDeletePost} className="btn btn-danger">Delete</button>
          </div>
        )}
      </div>

      {/* ── Comments ─────────────────────────── */}
      <section className="comments-section">
        <h2>Comments ({comments.length})</h2>

        {user ? (
          <form className="comment-form" onSubmit={handleComment}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              rows={3}
              className="input"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={commentLoading}>
              {commentLoading ? 'Posting…' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <p className="login-prompt"><Link to="/login">Log in</Link> to leave a comment.</p>
        )}

        <div className="comments-list">
          {comments.length === 0 && <p className="empty-msg">No comments yet.</p>}
          {comments.map((c) => (
            <div key={c._id} className="comment">
              <div className="comment-header">
                <strong>{c.author?.name}</strong>
                <span>{new Date(c.createdAt).toLocaleDateString('en-ZA')}</span>
                {user?._id === c.author?._id && (
                  <button className="btn-text btn-danger-text" onClick={() => handleDeleteComment(c._id)}>Delete</button>
                )}
              </div>
              <p>{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
