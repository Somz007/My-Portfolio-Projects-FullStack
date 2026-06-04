import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home       from './pages/Home';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import EditPost   from './pages/EditPost';
import Login      from './pages/Login';
import Register   from './pages/Register';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/posts/:id"     element={<PostDetail />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/create"        element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
          <Route path="/posts/:id/edit" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}
