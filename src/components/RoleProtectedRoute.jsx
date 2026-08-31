import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const { getCurrentAdminType } = useCompany();

  const companyID = localStorage.getItem('companyID');
  const isFullyAuthenticated = user && companyID;
  const userType = getCurrentAdminType() || localStorage.getItem('adminType');

  // Only show loading if we have no local data to go on
  if (loading && !companyID) return <div>Loading...</div>;

  if (!isFullyAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && (!userType || !allowedRoles.some(role => role.toLowerCase() === userType.toLowerCase()))) {
    return <Navigate to={userType?.toLowerCase() === 'employee' ? '/my-profile' : '/login'} replace />;
  }

  return children;
};

export default RoleProtectedRoute;
