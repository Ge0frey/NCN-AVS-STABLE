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
