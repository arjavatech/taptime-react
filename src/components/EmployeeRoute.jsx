import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const EmployeeRoute = ({ children }) => {
  const { user, loading } = useAuth();

  const companyID = localStorage.getItem('companyID');
  const adminType = localStorage.getItem('adminType');

  // Only show loading if we have no local data to go on
  if (loading && !companyID) return <div>Loading...</div>;

  const isEmployee = user && companyID && adminType === 'Employee';
  return isEmployee ? children : <Navigate to="/login" replace />;
};

export default EmployeeRoute;
