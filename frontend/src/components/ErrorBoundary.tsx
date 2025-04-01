import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors in child component tree
 * and display a fallback UI instead of crashing the app
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error: error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white">
          <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <div className="bg-gray-900 p-4 rounded mb-4">
              <p className="text-white mb-2">{this.state.error?.toString()}</p>
              <details className="text-gray-400 text-sm">
                <summary className="cursor-pointer text-blue-400 hover:text-blue-300 mb-2">
                  View error details
                </summary>
                <pre className="overflow-auto p-2 bg-gray-950 rounded">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            </div>
            <div className="flex justify-between">
              <button 
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Go to Home Page
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 