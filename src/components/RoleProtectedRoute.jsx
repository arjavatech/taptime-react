import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cloneElement } from 'react';

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  const isFullyAuthenticated = user && localStorage.getItem('companyID');
  const userType = localStorage.getItem('adminType');

  if (loading) return <div>Loading...</div>;
  
  if (!isFullyAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userType)) {
    return cloneElement(children, { accessDenied: true });
  }
  
  return children;
};

export default RoleProtectedRoute;