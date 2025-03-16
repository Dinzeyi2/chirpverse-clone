
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // New prop to determine if auth is required
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = false // Default to false, meaning content is visible to all
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    // Show loading spinner or skeleton
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-xBlue"></div>
      </div>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-6">This page requires authentication</h1>
        <Button onClick={() => navigate('/auth')} className="bg-xBlue hover:bg-blue-600">
          Sign in to continue
        </Button>
      </div>
    );
  }

  // For other cases, show the content regardless of auth status
  return <>{children}</>;
};

export default ProtectedRoute;
