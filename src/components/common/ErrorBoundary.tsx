
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <DefaultErrorFallback 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const handleRefresh = () => {
    resetError();
    window.location.reload();
  };
  
  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-4 text-center",
      isDark ? "bg-black text-white" : "bg-lightBeige text-black"
    )}>
      <img 
        src="/lovable-uploads/3466f833-541a-44f1-86a1-5e3f5ed4d8ed.png" 
        alt="iblue logo" 
        className="w-20 h-20 mb-6"
      />
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="mb-2 max-w-md mx-auto">
        We're sorry, but an error has occurred while rendering the application.
      </p>
      {error && (
        <pre className={cn(
          "text-xs p-4 rounded mb-4 overflow-auto max-w-md w-full text-left",
          isDark ? "bg-gray-800" : "bg-gray-100"
        )}>
          {error.message}
        </pre>
      )}
      <Button 
        onClick={handleRefresh}
        className="flex items-center gap-2 bg-xBlue hover:bg-blue-600"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh Application
      </Button>
    </div>
  );
}

// This wrapper allows the ErrorBoundary to be used with hooks
export default function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}
