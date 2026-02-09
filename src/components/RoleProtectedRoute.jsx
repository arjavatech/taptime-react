import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { cloneElement } from 'react';

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const { getCurrentAdminType } = useCompany();
  
  const isFullyAuthenticated = user && localStorage.getItem('companyID');
  const userType = getCurrentAdminType() || localStorage.getItem('adminType');

  if (loading) return <div>Loading...</div>;
  
  if (!isFullyAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.some(role => role.toLowerCase() === userType.toLowerCase())) {
    return cloneElement(children, { accessDenied: true });
  }
  
  return children;
};

export default RoleProtectedRoute;