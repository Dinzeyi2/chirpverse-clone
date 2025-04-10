
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
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console for debugging
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Save the error info to state
    this.setState({
      errorInfo
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <DefaultErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

function DefaultErrorFallback({ error, errorInfo, resetError }: DefaultErrorFallbackProps) {
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
          <strong>Error:</strong> {error.message}
          {errorInfo && (
            <>
              <br />
              <br />
              <details>
                <summary>Component Stack</summary>
                <div className="mt-2 text-xs">
                  {errorInfo.componentStack}
                </div>
              </details>
            </>
          )}
        </pre>
      )}
      <div className="flex gap-4">
        <Button 
          onClick={resetError}
          variant="outline"
          className="flex items-center gap-2"
        >
          Try Again
        </Button>
        <Button 
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-xBlue hover:bg-blue-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Application
        </Button>
      </div>
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
