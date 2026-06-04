import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  const date = new Date(post.createdAt).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <article className="post-card">
      {post.coverImage && (
        <Link to={`/posts/${post._id}`}>
          <img src={post.coverImage} alt={post.title} className="post-card-cover" />
        </Link>
      )}
      <div className="post-card-body">
        {post.tags?.length > 0 && (
          <div className="post-card-tags">
            {post.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
        )}
        <h2 className="post-card-title">
          <Link to={`/posts/${post._id}`}>{post.title}</Link>
        </h2>
        <p className="post-card-excerpt">{post.excerpt}</p>
        <div className="post-card-meta">
          <span>{post.author?.name}</span>
          <span>{date}</span>
          <span>❤️ {post.likeCount ?? post.likes?.length ?? 0}</span>
        </div>
      </div>
    </article>
  );
}
