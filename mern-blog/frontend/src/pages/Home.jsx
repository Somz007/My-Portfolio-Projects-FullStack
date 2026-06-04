import { useState, useEffect } from 'react';
import { fetchPosts } from '../api/posts';
import PostCard from '../components/PostCard';
import Spinner from '../components/Spinner';

export default function Home() {
  const [posts, setPosts]       = useState([]);
  const [meta, setMeta]         = useState({ page: 1, totalPages: 1 });
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await fetchPosts({ page, limit: 9, search: search || undefined });
        setPosts(data.posts);
        setMeta({ page: data.page, totalPages: data.totalPages });
      } catch {
        setError('Failed to load posts.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="container">
      <div className="home-header">
        <h1>Latest Posts</h1>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search posts…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input"
          />
          <button type="submit" className="btn btn-primary">Search</button>
          {search && (
            <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              Clear
            </button>
          )}
        </form>
      </div>

      {loading && <Spinner />}
      {error && <p className="error-msg">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="empty-msg">{search ? `No posts matching "${search}"` : 'No posts yet. Be the first!'}</p>
      )}

      <div className="posts-grid">
        {posts.map((p) => <PostCard key={p._id} post={p} />)}
      </div>

      {meta.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← Prev</button>
          <span>Page {page} of {meta.totalPages}</span>
          <button className="btn btn-outline" onClick={() => setPage((p) => p + 1)} disabled={page === meta.totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}
