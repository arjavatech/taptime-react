import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Check if user has completed full authentication flow
  const isFullyAuthenticated = user && localStorage.getItem('companyID');

  if (loading) return <div>Loading...</div>;
  
  return isFullyAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;