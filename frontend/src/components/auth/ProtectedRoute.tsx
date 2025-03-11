import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWalletContext } from '../../context/WalletContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  console.log('ProtectedRoute: Rendering');
  
  const location = useLocation();
  const { connected, isInitialized, isLoading } = useWalletContext();
  
  console.log('ProtectedRoute: State', { 
    pathname: location.pathname,
    connected, 
    isInitialized, 
    isLoading 
  });

  useEffect(() => {
    console.log('ProtectedRoute: Route changed', location.pathname);
  }, [location.pathname]);

  // Only show loading state while initializing
  if (!isInitialized) {
    console.log('ProtectedRoute: Showing loading state (not initialized)');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500"></div>
          <p className="text-slate-600 dark:text-slate-300">Initializing...</p>
        </div>
      </div>
    );
  }
