import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h3>Access Denied</h3>
        <p>Aapke paas is page ko dekhne ki ijazat nahi hai.</p>
      </div>
    );
  }

  return children;
}