import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import WorkerProfilePage from './pages/WorkerProfilePage';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function NavigationBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        Digital Labour Marketplace
      </Link>

      {!token ? (
        <div className="nav-links-wrap">
          <Link
            to="/login"
            style={{ textDecoration: 'none', color: '#475569', fontWeight: '600', padding: '6px 14px', fontSize: '0.9rem' }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            style={{ textDecoration: 'none', background: '#2563eb', color: 'white', fontWeight: '600', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem' }}
          >
            Create Account
          </Link>
        </div>
      ) : (
        <div className="nav-links-wrap">
          {user.role === 'worker' && (
            <Link to="/worker-profile" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '700', fontSize: '0.88rem' }}>
              Digital ID & Profile
            </Link>
          )}
          {user.role === 'customer' && (
            <Link to="/customer-dashboard" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '700', fontSize: '0.88rem' }}>
              Find Verified Workers
            </Link>
          )}
          {user.role === 'admin' && (
            <Link to="/admin-dashboard" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '700', fontSize: '0.88rem' }}>
              Admin Verification Panel
            </Link>
          )}

          <span style={{ fontSize: '0.82rem', background: '#f1f5f9', padding: '4px 10px', borderRadius: '16px', color: '#334155', fontWeight: '600' }}>
            {user.name} ({user.role})
          </span>

          <button
            onClick={handleLogout}
            style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem' }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/worker-profile"
          element={
            <ProtectedRoute allowedRole="worker">
              <WorkerProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute allowedRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
