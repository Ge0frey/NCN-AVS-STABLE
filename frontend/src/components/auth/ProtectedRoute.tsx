import { ReactNode, useEffect, memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWalletContext } from '../../context/WalletContext';
import { useUser } from '@civic/auth-web3/react';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Use memo to prevent unnecessary re-renders
const ProtectedRoute = memo(function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Reduce console logging to avoid excessive output
  const debug = false;
  const logDebug = (message: string, data?: any) => {
    if (debug) {
      console.log(message, data);
    }
  };

  logDebug('ProtectedRoute: Rendering');
  
  const location = useLocation();
  const { connected, isInitialized, isLoading: walletLoading } = useWalletContext();
  const { user, isLoading: civicLoading } = useUser();
  
  // User is authenticated if either wallet is connected or Civic Auth user exists
  const isUserAuthenticated = connected || !!user;
  const isLoading = walletLoading || civicLoading;
  
  logDebug('ProtectedRoute: State', { 
    pathname: location.pathname,
    connected, 
    hasUser: !!user,
    isUserAuthenticated,
    isInitialized, 
    isLoading: isLoading
  });

  useEffect(() => {
    logDebug('ProtectedRoute: Route changed', location.pathname);
  }, [location.pathname]);

  // Only show loading state while initializing
  if (!isInitialized) {
    logDebug('ProtectedRoute: Showing loading state (not initialized)');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500"></div>
          <p className="text-slate-600 dark:text-slate-300">Initializing...</p>
        </div>
      </div>
    );
  }

  // Redirect to connect page if not authenticated
  if (!isUserAuthenticated) {
    logDebug('ProtectedRoute: Redirecting to connect page');
    return <Navigate to="/connect" replace state={{ from: location }} />;
  }

  // Show loading state while fetching data
  if (isLoading) {
    logDebug('ProtectedRoute: Showing loading state (loading data)');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  logDebug('ProtectedRoute: Rendering children');
  return <>{children}</>;
});

export default ProtectedRoute; 