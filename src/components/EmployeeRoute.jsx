import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const EmployeeRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  const isEmployee = user && localStorage.getItem('companyID') && localStorage.getItem('adminType') === 'Employee';
  return isEmployee ? children : <Navigate to="/login" replace />;
};

export default EmployeeRoute;
