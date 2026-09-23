import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="spinner" style={{ borderColor: 'rgba(122,45,142,.25)', borderTopColor: '#5C1A6E', width: 34, height: 34 }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  return children;
}
