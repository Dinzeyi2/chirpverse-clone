
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
        <h1 className="text-4xl font-bold mb-4 text-xBlue">404</h1>
        <p className="text-xl text-gray-600 mb-6">The page you're looking for doesn't exist</p>
        <p className="text-sm text-gray-500 mb-6">
          Path: <code className="bg-gray-100 px-2 py-1 rounded">{location.pathname}</code>
        </p>
        <Button 
          onClick={goHome} 
          variant="default" 
          className="bg-xBlue hover:bg-xBlue/90"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
